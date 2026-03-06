"use client";

import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  StartSensitivity,
  type FunctionCall,
  type FunctionDeclaration,
  type FunctionResponse,
  type LiveServerMessage,
  type Session,
} from "@google/genai";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LIVE_MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";

const FORM_AGENT_TOOLS: FunctionDeclaration[] = [
  {
    name: "get_session_overview",
    description: "Get the form title, question count, and current phase before beginning.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_current_question",
    description: "Get the next question the agent should ask right now.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "save_answer",
    description: "Validate and save the user's answer for the current question.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "The user's answer in concise normalized text.",
        },
      },
      required: ["answer"],
      additionalProperties: false,
    },
  },
  {
    name: "review_answers",
    description: "Get a brief review summary of all captured answers before submission.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "change_answer",
    description: "Update one previously captured answer during the review step.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        questionId: {
          type: "string",
          description: "The question id to update.",
        },
        answer: {
          type: "string",
          description: "The replacement answer.",
        },
      },
      required: ["questionId", "answer"],
      additionalProperties: false,
    },
  },
  {
    name: "submit_form",
    description: "Submit the completed Google Form after the user confirms.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

type LiveState = "idle" | "parsing" | "connecting" | "live" | "error";

type ParsedFormSummary = {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  capabilities: {
    supportsConversation: boolean;
    supportsSubmission: boolean;
    unsupportedReasons: string[];
  };
  unsupportedReason?: string;
};

type ToolResult = {
  ok: boolean;
  phase: string;
  speakHint?: string;
  data?: Record<string, unknown>;
  error?: string;
};

function parseSampleRate(mimeType?: string): number {
  if (!mimeType) return 24000;
  const params = mimeType.split(";").map((value) => value.trim());
  for (const param of params) {
    const [key, value] = param.split("=").map((item) => item.trim());
    if (key === "rate") {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 24000;
}

function floatToPcm16Base64(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);

  for (let index = 0; index < float32.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, float32[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Int16Array(bytes.buffer);
}

function int16ToFloat32(pcm: Int16Array): Float32Array {
  const output = new Float32Array(pcm.length);
  for (let index = 0; index < pcm.length; index += 1) {
    output[index] = pcm[index] / 0x8000;
  }
  return output;
}

function downsampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  const targetRate = 16000;
  if (inputRate <= targetRate) return input;

  const ratio = inputRate / targetRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(Math.floor((index + 1) * ratio), input.length);
    let sum = 0;
    let count = 0;
    for (let inner = start; inner < end; inner += 1) {
      sum += input[inner];
      count += 1;
    }
    output[index] = count > 0 ? sum / count : input[start] ?? 0;
  }

  return output;
}

function buildSystemInstruction(): string {
  return [
    "You are Cauli, a warm and efficient voice agent helping the user complete a Google Form.",
    "Always use tools to inspect form state, fetch the current question, save answers, review answers, and submit the form.",
    "Never invent questions, options, validations, or submission results.",
    "Ask exactly one question at a time.",
    "Use concise spoken language and short transitions.",
    "If a tool returns an error, explain it briefly and ask one focused follow-up.",
    "When all answers are captured, call review_answers, summarize briefly, and ask whether to submit or change anything.",
    "Only call submit_form after the user clearly confirms submission.",
  ].join("\n");
}

export default function Home() {
  const [state, setState] = useState<LiveState>("idle");
  const [error, setError] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [parsedForm, setParsedForm] = useState<ParsedFormSummary | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const browserStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sinkGainRef = useRef<GainNode | null>(null);
  const playbackTimeRef = useRef(0);
  const activeFormSessionIdRef = useRef<string | null>(null);
  const cancelledToolCallsRef = useRef<Set<string>>(new Set());
  const resumptionHandleRef = useRef<string | null>(null);

  const canStart = useMemo(() => {
    return (
      !!parsedForm &&
      parsedForm.capabilities.supportsConversation &&
      state !== "parsing" &&
      state !== "connecting"
    );
  }, [parsedForm, state]);

  const ensureAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playInlineAudio = useCallback(
    async (base64Data: string, mimeType?: string) => {
      const audioContext = await ensureAudioContext();
      const sampleRate = parseSampleRate(mimeType);
      const pcm16 = base64ToInt16(base64Data);
      const float32 = int16ToFloat32(pcm16);
      const audioBuffer = audioContext.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      const now = audioContext.currentTime;
      const startAt = Math.max(now + 0.01, playbackTimeRef.current);
      source.start(startAt);
      playbackTimeRef.current = startAt + audioBuffer.duration;
    },
    [ensureAudioContext]
  );

  const persistResumptionHandle = useCallback(async (sessionId: string, handle: string) => {
    try {
      await fetch(`/api/form-sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ liveResumptionHandle: handle }),
      });
    } catch (persistError) {
      console.error("Failed to persist resumption handle:", persistError);
    }
  }, []);

  const callBackendTool = useCallback(
    async (sessionId: string, call: FunctionCall): Promise<ToolResult> => {
      const response = await fetch(`/api/form-sessions/${sessionId}/tool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: call.name,
          args: call.args,
          toolCallId: call.id,
        }),
      });

      const payload = (await response.json()) as ToolResult;
      if (!response.ok) {
        throw new Error(payload.error || "Tool request failed.");
      }
      return payload;
    },
    []
  );

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (sinkGainRef.current) {
      sinkGainRef.current.disconnect();
      sinkGainRef.current = null;
    }

    if (browserStreamRef.current) {
      browserStreamRef.current.getTracks().forEach((track) => track.stop());
      browserStreamRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    cancelledToolCallsRef.current.clear();
    playbackTimeRef.current = 0;
  }, []);

  const handleToolCalls = useCallback(
    async (calls: FunctionCall[]) => {
      const liveSession = sessionRef.current;
      const formSessionId = activeFormSessionIdRef.current;

      if (!liveSession || !formSessionId || calls.length === 0) {
        return;
      }

      const responses = await Promise.all(
        calls.map(async (call) => {
          try {
            const result = await callBackendTool(formSessionId, call);
            if (call.id && cancelledToolCallsRef.current.has(call.id)) {
              return null;
            }

            return {
              id: call.id,
              name: call.name,
              response: {
                output: result,
              },
            } satisfies FunctionResponse;
          } catch (toolError) {
            if (call.id && cancelledToolCallsRef.current.has(call.id)) {
              return null;
            }

            return {
              id: call.id,
              name: call.name,
              response: {
                error:
                  toolError instanceof Error ? toolError.message : "Tool request failed.",
              },
            } satisfies FunctionResponse;
          }
        })
      );

      const functionResponses = responses.filter(
        (item): item is NonNullable<typeof item> => item !== null
      ) as FunctionResponse[];
      if (functionResponses.length === 0) {
        return;
      }

      liveSession.sendToolResponse({
        functionResponses,
      });
    },
    [callBackendTool]
  );

  const onLiveMessage = useCallback(
    (message: LiveServerMessage) => {
      const parts = message.serverContent?.modelTurn?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          void playInlineAudio(part.inlineData.data, part.inlineData.mimeType);
        }
      }

      if (message.toolCall?.functionCalls?.length) {
        void handleToolCalls(message.toolCall.functionCalls);
      }

      if (message.toolCallCancellation?.ids?.length) {
        for (const id of message.toolCallCancellation.ids) {
          cancelledToolCallsRef.current.add(id);
        }
      }

      if (message.sessionResumptionUpdate?.newHandle && activeFormSessionIdRef.current) {
        resumptionHandleRef.current = message.sessionResumptionUpdate.newHandle;
        void persistResumptionHandle(
          activeFormSessionIdRef.current,
          message.sessionResumptionUpdate.newHandle
        );
      }
    },
    [handleToolCalls, persistResumptionHandle, playInlineAudio]
  );

  const parseForm = useCallback(async () => {
    if (!formUrl.trim()) {
      setError("Enter a Google Form URL first.");
      return;
    }

    setError("");
    setState("parsing");

    try {
      const response = await fetch("/api/parse-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formUrl.trim() }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to parse form.");
      }

      setParsedForm(payload.data as ParsedFormSummary);
      setCurrentSessionId(null);
      setState("idle");
    } catch (parseError) {
      setParsedForm(null);
      setCurrentSessionId(null);
      setState("error");
      setError(parseError instanceof Error ? parseError.message : "Failed to parse form.");
    }
  }, [formUrl]);

  const startConversation = useCallback(async () => {
    if (!parsedForm) {
      setError("Parse a form before starting live voice.");
      return;
    }

    if (!parsedForm.capabilities.supportsConversation) {
      setError(parsedForm.unsupportedReason || "This form is not supported yet.");
      return;
    }

    setError("");
    setState("connecting");

    try {
      const formSessionResponse = await fetch("/api/form-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formUrl: formUrl.trim() }),
      });
      const formSessionPayload = await formSessionResponse.json();
      if (!formSessionResponse.ok) {
        throw new Error(formSessionPayload.error || "Failed to create form session.");
      }

      const formSessionId = formSessionPayload.sessionId as string;
      activeFormSessionIdRef.current = formSessionId;
      setCurrentSessionId(formSessionId);

      const tokenResponse = await fetch("/api/live-token", { method: "POST" });
      const tokenPayload = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenPayload.token) {
        throw new Error(tokenPayload.error || "Failed to get Live API token.");
      }

      const ai = new GoogleGenAI({
        apiKey: tokenPayload.token as string,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const liveSession = await ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
              prefixPaddingMs: 20,
              silenceDurationMs: 120,
            },
          },
          thinkingConfig: {
            thinkingBudget: 0,
          },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Zephyr" },
            },
          },
          systemInstruction: buildSystemInstruction(),
          tools: [{ functionDeclarations: FORM_AGENT_TOOLS }],
          sessionResumption: {
            handle: resumptionHandleRef.current || undefined,
          },
          contextWindowCompression: {
            triggerTokens: "24000",
            slidingWindow: {
              targetTokens: "16000",
            },
          },
        },
        callbacks: {
          onopen: () => {
            setState("live");
          },
          onmessage: onLiveMessage,
          onerror: (event: ErrorEvent) => {
            setError(event.message || "Live session error.");
            setState("error");
          },
          onclose: () => {
            setState((previous) => (previous === "error" ? previous : "idle"));
          },
        },
      });

      sessionRef.current = liveSession;

      liveSession.sendClientContent({
        turns: [
          "Start the interview. First call get_session_overview, then get_current_question. Greet the user and ask the current question.",
        ],
        turnComplete: true,
      });

      const browserStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      browserStreamRef.current = browserStream;

      const audioContext = await ensureAudioContext();
      const sourceNode = audioContext.createMediaStreamSource(browserStream);
      const processorNode = audioContext.createScriptProcessor(2048, 1, 1);
      const sinkGain = audioContext.createGain();

      sourceRef.current = sourceNode;
      processorRef.current = processorNode;
      sinkGainRef.current = sinkGain;

      sinkGain.gain.value = 0;
      sourceNode.connect(processorNode);
      processorNode.connect(sinkGain);
      sinkGain.connect(audioContext.destination);

      processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
        const currentLiveSession = sessionRef.current;
        if (!currentLiveSession) {
          return;
        }

        const input = event.inputBuffer.getChannelData(0);
        const chunk = new Float32Array(input);
        const downsampled = downsampleTo16k(chunk, audioContext.sampleRate);

        currentLiveSession.sendRealtimeInput({
          audio: {
            data: floatToPcm16Base64(downsampled),
            mimeType: "audio/pcm;rate=16000",
          },
        });
      };
    } catch (startError) {
      cleanup();
      activeFormSessionIdRef.current = null;
      setCurrentSessionId(null);
      setState("error");
      setError(
        startError instanceof Error ? startError.message : "Unable to start live audio session."
      );
    }
  }, [cleanup, ensureAudioContext, formUrl, onLiveMessage, parsedForm]);

  const stopConversation = useCallback(() => {
    cleanup();
    setState("idle");
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-xl">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Cauliform"
            width={120}
            height={120}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Cauliform</h1>
          <p className="text-gray-600 text-center mt-2">
            Tool-driven Gemini Live agent for public Google Forms
          </p>
        </div>

        <div className="border border-amber-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
          <div>
            <label htmlFor="form-url" className="block text-sm font-medium text-gray-700 mb-1">
              Google Form URL
            </label>
            <input
              id="form-url"
              type="url"
              value={formUrl}
              onChange={(event) => setFormUrl(event.target.value)}
              placeholder="https://forms.google.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              disabled={state === "connecting" || state === "live"}
            />
          </div>

          <button
            type="button"
            onClick={parseForm}
            disabled={state === "parsing" || state === "connecting" || state === "live"}
            className="w-full py-3 px-4 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-60"
          >
            {state === "parsing" ? "Parsing form..." : "Parse Form"}
          </button>

          {parsedForm ? (
            <div
              className={`rounded-lg border p-3 text-sm ${
                parsedForm.capabilities.supportsConversation
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <p>
                <strong>{parsedForm.title}</strong>
              </p>
              <p>{parsedForm.questionCount} supported question(s) detected.</p>
              {!parsedForm.capabilities.supportsConversation && parsedForm.unsupportedReason ? (
                <p className="mt-1">{parsedForm.unsupportedReason}</p>
              ) : null}
            </div>
          ) : null}

          {state !== "live" ? (
            <button
              type="button"
              onClick={startConversation}
              disabled={!canStart}
              className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-60"
            >
              {state === "connecting" ? "Connecting..." : "Start Live Form Session"}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopConversation}
              className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
            >
              Stop Session
            </button>
          )}

          <div className="text-sm text-gray-800">
            Status:{" "}
            <span className="font-medium">
              {state === "parsing"
                ? "Parsing"
                : state === "connecting"
                  ? "Connecting"
                  : state === "live"
                    ? "Live"
                    : state === "error"
                      ? "Error"
                      : "Idle"}
            </span>
          </div>

          {currentSessionId ? (
            <div className="text-xs text-gray-500">Session: {currentSessionId}</div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          Live API browser relay with backend-owned form tools and session state
        </p>
      </main>
    </div>
  );
}
