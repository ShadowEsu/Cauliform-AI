"use client";

import { useRef, useState, useCallback } from "react";
import {
  float32ToInt16,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  pcmToAudioBuffer,
} from "@/lib/audio-utils";

const GEMINI_INPUT_SAMPLE_RATE = 16000;
const GEMINI_OUTPUT_SAMPLE_RATE = 24000;

interface UseGeminiLiveOptions {
  apiKey: string;
  model?: string;
  onTranscript?: (role: "user" | "agent", text: string) => void;
  onError?: (error: string) => void;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "active"
  | "ended"
  | "error";

export function useGeminiLive({
  apiKey,
  model = "gemini-2.0-flash-live-001",
  onTranscript,
  onError,
}: UseGeminiLiveOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const playNextChunk = useCallback(() => {
    const ctx = playbackCtxRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const buffer = audioQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextChunk();
    };
  }, []);

  const connect = useCallback(
    async (systemPrompt: string) => {
      try {
        setStatus("connecting");

        // Set up audio capture context at 16kHz
        const audioCtx = new AudioContext({ sampleRate: GEMINI_INPUT_SAMPLE_RATE });
        audioCtxRef.current = audioCtx;

        // Set up playback context at 24kHz
        const playbackCtx = new AudioContext({ sampleRate: GEMINI_OUTPUT_SAMPLE_RATE });
        playbackCtxRef.current = playbackCtx;
        nextPlayTimeRef.current = 0;

        // Get microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: GEMINI_INPUT_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;

        // Open WebSocket to Gemini Live API
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Send setup message
          const setupMsg = {
            setup: {
              model: `models/${model}`,
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Aoede",
                    },
                  },
                },
              },
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
            },
          };
          ws.send(JSON.stringify(setupMsg));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          // Setup complete
          if (data.setupComplete) {
            setStatus("active");

            // Start capturing microphone audio
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Use ScriptProcessorNode to capture raw PCM
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return;

              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = float32ToInt16(inputData);
              const base64 = arrayBufferToBase64(int16.buffer as ArrayBuffer);

              ws.send(
                JSON.stringify({
                  realtimeInput: {
                    mediaChunks: [
                      {
                        data: base64,
                        mimeType: "audio/pcm;rate=16000",
                      },
                    ],
                  },
                })
              );
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

            // Send initial text prompt to trigger greeting
            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    {
                      role: "user",
                      parts: [{ text: "Please start the conversation. Begin with your greeting." }],
                    },
                  ],
                  turnComplete: true,
                },
              })
            );
          }

          // Handle server content (audio response)
          if (data.serverContent) {
            const parts = data.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  // Decode base64 PCM audio
                  const arrayBuf = base64ToArrayBuffer(part.inlineData.data);
                  const int16 = new Int16Array(arrayBuf);
                  const audioBuffer = pcmToAudioBuffer(
                    playbackCtxRef.current!,
                    int16,
                    GEMINI_OUTPUT_SAMPLE_RATE
                  );
                  audioQueueRef.current.push(audioBuffer);

                  if (!isPlayingRef.current) {
                    playNextChunk();
                  }
                }

                // Handle text transcription if available
                if (part.text) {
                  onTranscript?.("agent", part.text);
                }
              }
            }

            // Handle input transcription
            if (data.serverContent?.inputTranscript) {
              onTranscript?.("user", data.serverContent.inputTranscript);
            }
            if (data.serverContent?.outputTranscript) {
              onTranscript?.("agent", data.serverContent.outputTranscript);
            }
          }
        };

        ws.onerror = () => {
          setStatus("error");
          onError?.("WebSocket connection error");
        };

        ws.onclose = () => {
          if (status !== "error") {
            setStatus("ended");
          }
        };
      } catch (err: any) {
        setStatus("error");
        onError?.(err.message || "Failed to connect");
      }
    },
    [apiKey, model, onTranscript, onError, playNextChunk, status]
  );

  const disconnect = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close audio contexts
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close();
      playbackCtxRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setStatus("ended");
  }, []);

  return { status, isSpeaking, connect, disconnect };
}
