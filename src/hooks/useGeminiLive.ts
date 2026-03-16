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

interface FormAnswer {
  questionTitle: string;
  answer: string;
}

interface UseGeminiLiveOptions {
  apiKey: string;
  model?: string;
  onTranscript?: (role: "user" | "agent", text: string) => void;
  onError?: (error: string) => void;
  onLog?: (message: string) => void;
  onFormSubmit?: (answers: FormAnswer[]) => void;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "active"
  | "ended"
  | "error";

export function useGeminiLive({
  apiKey,
  model = "gemini-2.5-flash-native-audio-latest",
  onTranscript,
  onError,
  onLog,
  onFormSubmit,
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

  const log = useCallback(
    (msg: string) => {
      const ts = new Date().toLocaleTimeString();
      onLog?.(`[${ts}] ${msg}`);
    },
    [onLog]
  );

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
    async (systemPrompt: string, tools?: unknown[]) => {
      try {
        setStatus("connecting");
        log("Starting connection...");

        // Set up audio capture context at 16kHz
        log(`Creating audio capture context at ${GEMINI_INPUT_SAMPLE_RATE}Hz`);
        const audioCtx = new AudioContext({ sampleRate: GEMINI_INPUT_SAMPLE_RATE });
        audioCtxRef.current = audioCtx;
        // Resume AudioContext (required after user gesture in some browsers)
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
          log("Resumed suspended audio capture context");
        }
        log(`Actual capture sample rate: ${audioCtx.sampleRate}Hz, state: ${audioCtx.state}`);

        // Set up playback context at 24kHz
        const playbackCtx = new AudioContext({ sampleRate: GEMINI_OUTPUT_SAMPLE_RATE });
        playbackCtxRef.current = playbackCtx;
        nextPlayTimeRef.current = 0;
        if (playbackCtx.state === "suspended") {
          await playbackCtx.resume();
          log("Resumed suspended playback context");
        }
        log(`Playback context created at ${playbackCtx.sampleRate}Hz, state: ${playbackCtx.state}`);

        // Get microphone
        log("Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: GEMINI_INPUT_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;
        const track = stream.getAudioTracks()[0];
        const settings = track.getSettings();
        log(`Mic acquired: ${track.label} (${settings.sampleRate}Hz, ${settings.channelCount}ch)`);

        // Open WebSocket to Gemini Live API
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        log(`Connecting WebSocket to Gemini Live API...`);
        log(`Model: ${model}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          log("WebSocket connected, sending setup message...");
          const setupConfig: Record<string, unknown> = {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          };
          if (tools && tools.length > 0) {
            setupConfig.tools = tools;
          }
          const setupMsg = { setup: setupConfig };
          ws.send(JSON.stringify(setupMsg));
          log(`Setup sent (prompt: ${systemPrompt.length} chars)`);
        };

        ws.onmessage = async (event) => {
          const raw = event.data instanceof Blob ? await event.data.text() : event.data;
          const data = JSON.parse(raw);
          log(`WS message keys: ${Object.keys(data).join(", ")}`);

          // Check for errors
          if (data.error) {
            log(`API ERROR: ${JSON.stringify(data.error)}`);
            onError?.(data.error.message || JSON.stringify(data.error));
            return;
          }

          // Setup complete
          if (data.setupComplete) {
            log("Setup complete! Starting mic capture and sending greeting prompt...");
            setStatus("active");

            // Start capturing microphone audio
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            let chunkCount = 0;
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

              chunkCount++;
              if (chunkCount % 50 === 0) {
                log(`Sent ${chunkCount} audio chunks to Gemini`);
              }
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
            log("Mic capture started, sending audio to Gemini");

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
            log("Sent initial greeting prompt");
          }

          // Handle server content (audio response)
          if (data.serverContent) {
            const parts = data.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  const arrayBuf = base64ToArrayBuffer(part.inlineData.data);
                  const int16 = new Int16Array(arrayBuf);
                  log(`Received audio chunk: ${int16.length} samples (${(int16.length / GEMINI_OUTPUT_SAMPLE_RATE * 1000).toFixed(0)}ms)`);

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

                if (part.text) {
                  log(`Agent text: ${part.text}`);
                  onTranscript?.("agent", part.text);
                }
              }
            }

            if (data.serverContent?.inputTranscript) {
              log(`User transcript: ${data.serverContent.inputTranscript}`);
              onTranscript?.("user", data.serverContent.inputTranscript);
            }
            if (data.serverContent?.outputTranscript) {
              log(`Agent transcript: ${data.serverContent.outputTranscript}`);
              onTranscript?.("agent", data.serverContent.outputTranscript);
            }

            // Log turn completion
            if (data.serverContent?.turnComplete) {
              log("Agent turn complete");
            }
          }

          // Handle tool calls from Gemini
          if (data.toolCall) {
            log(`Tool call received: ${JSON.stringify(data.toolCall)}`);
            const functionCalls = data.toolCall.functionCalls;
            if (functionCalls) {
              for (const fc of functionCalls) {
                if (fc.name === "submit_form" && fc.args?.answers) {
                  log(`submit_form called with ${fc.args.answers.length} answers`);
                  onFormSubmit?.(fc.args.answers);

                  // Send tool response back to Gemini so it can continue talking
                  ws.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: [{
                        id: fc.id,
                        name: fc.name,
                        response: { success: true, message: "Form submitted successfully" },
                      }],
                    },
                  }));
                  log("Sent tool response to Gemini");
                }
              }
            }
          }

          // Log any other message types
          if (!data.setupComplete && !data.serverContent && !data.toolCall) {
            log(`Unknown message: ${JSON.stringify(data).slice(0, 200)}`);
          }
        };

        ws.onerror = (event) => {
          log(`WebSocket error: ${JSON.stringify(event)}`);
          setStatus("error");
          onError?.("WebSocket connection error");
        };

        ws.onclose = (event) => {
          log(`WebSocket closed: code=${event.code} reason="${event.reason}"`);
          setStatus((prev) => (prev === "error" ? "error" : "ended"));
        };
      } catch (err: any) {
        log(`Connection error: ${err.message}`);
        setStatus("error");
        onError?.(err.message || "Failed to connect");
      }
    },
    [apiKey, model, onTranscript, onError, onLog, log, playNextChunk]
  );

  const disconnect = useCallback(() => {
    log("Disconnecting...");

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

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
    log("Disconnected");
  }, [log]);

  return { status, isSpeaking, connect, disconnect };
}
