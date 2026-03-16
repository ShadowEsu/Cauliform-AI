"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { createFormAgentPrompt } from "@/lib/prompts";
import type { FormData } from "@/lib/types";

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

export default function TestPage() {
  const [formUrl, setFormUrl] = useState(
    "https://docs.google.com/forms/d/e/1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ/viewform?usp=dialog"
  );
  const [formData, setFormData] = useState<FormData | null>(null);
  const [parseStatus, setParseStatus] = useState<"idle" | "parsing" | "parsed" | "error">("idle");
  const [parseError, setParseError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

  const handleTranscript = useCallback((role: "user" | "agent", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date() }]);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  const handleLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const { status, isSpeaking, connect, disconnect } = useGeminiLive({
    apiKey,
    onTranscript: handleTranscript,
    onError: handleError,
    onLog: handleLog,
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const handleParseForm = async () => {
    setParseStatus("parsing");
    setParseError("");
    handleLog(`Parsing form: ${formUrl}`);
    try {
      const res = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse form");
      setFormData(data.data);
      setParseStatus("parsed");
      handleLog(`Parsed: "${data.data.title}" — ${data.data.questions.length} questions`);
    } catch (err: any) {
      setParseError(err.message);
      setParseStatus("error");
      handleLog(`Parse error: ${err.message}`);
    }
  };

  const handleStartConversation = async () => {
    if (!formData) return;
    setError("");
    setTranscript([]);
    handleLog("Building system prompt...");
    const systemPrompt = createFormAgentPrompt(formData.title, formData.questions);
    handleLog(`System prompt built (${systemPrompt.length} chars)`);
    await connect(systemPrompt);
  };

  const handleEndConversation = () => {
    disconnect();
  };

  // Quick API test — no mic needed, just verifies WebSocket + audio response
  const handleQuickTest = async () => {
    if (!formData) return;
    setError("");
    setTranscript([]);
    handleLog("=== QUICK API TEST (no mic) ===");
    const systemPrompt = createFormAgentPrompt(formData.title, formData.questions);
    const apiKeyVal = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const model = "gemini-2.5-flash-native-audio-latest";
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKeyVal}`;

    handleLog(`Connecting to: ${wsUrl.replace(apiKeyVal, "***")}`);
    handleLog(`Model: ${model}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        handleLog("WebSocket connected!");
        ws.send(JSON.stringify({
          setup: {
            model: `models/${model}`,
            generationConfig: { responseModalities: ["AUDIO"] },
            systemInstruction: { parts: [{ text: systemPrompt }] },
          },
        }));
        handleLog("Setup message sent");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          handleLog(`Raw message keys: ${Object.keys(data).join(", ")}`);

          if (data.setupComplete) {
            handleLog("Setup complete! Sending greeting prompt...");
            ws.send(JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: "Please start the conversation. Begin with your greeting." }] }],
                turnComplete: true,
              },
            }));
          }

          if (data.error) {
            handleLog(`API ERROR: ${JSON.stringify(data.error)}`);
            setError(JSON.stringify(data.error));
          }

          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
              if (part.text) {
                handleLog(`Text response: ${part.text.slice(0, 200)}`);
                handleTranscript("agent", part.text);
              }
              if (part.inlineData?.data) {
                handleLog(`Audio chunk: ${part.inlineData.mimeType}, ${part.inlineData.data.length} base64 chars`);
              }
            }
          }

          if (data.serverContent?.turnComplete) {
            handleLog("Turn complete! Quick test PASSED.");
            ws.close();
          }
        } catch (parseErr: any) {
          handleLog(`Message parse error: ${parseErr.message}`);
        }
      };

      ws.onerror = () => {
        handleLog("WebSocket error!");
        setError("WebSocket connection failed");
      };

      ws.onclose = (event) => {
        handleLog(`WebSocket closed: code=${event.code}`);
      };
    } catch (err: any) {
      handleLog(`Error: ${err.message}`);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <h1 className="text-xl font-mono font-bold">Cauliform Test Console</h1>
          <span className="ml-auto text-xs font-mono text-gray-500">
            Gemini Live API
          </span>
        </div>

        {/* Step 1: Parse Form */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-mono text-gray-400 mb-3">
            1. Parse Google Form
          </h2>
          <div className="flex gap-2">
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="Google Form URL"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleParseForm}
              disabled={parseStatus === "parsing" || !formUrl}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-mono font-medium transition"
            >
              {parseStatus === "parsing" ? "Parsing..." : "Parse"}
            </button>
          </div>

          {parseError && (
            <p className="mt-2 text-red-400 text-xs font-mono">{parseError}</p>
          )}

          {formData && (
            <div className="mt-3 p-3 bg-gray-800 rounded text-xs font-mono">
              <p className="text-green-400">Parsed: {formData.title}</p>
              <p className="text-gray-500 mt-1">
                {formData.questions.length} questions found
              </p>
              <ul className="mt-2 space-y-1 text-gray-400">
                {formData.questions.map((q, i) => (
                  <li key={q.id}>
                    {i + 1}. [{q.type}] {q.title}
                    {q.required && <span className="text-red-400"> *</span>}
                    {q.options && q.options.length > 0 && (
                      <span className="text-gray-600"> ({q.options.join(", ")})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Step 2: Voice Conversation */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-mono text-gray-400 mb-3">
            2. Voice Conversation
          </h2>

          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-2 h-2 rounded-full ${
                status === "active"
                  ? "bg-green-500 animate-pulse"
                  : status === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : status === "error"
                  ? "bg-red-500"
                  : "bg-gray-600"
              }`}
            />
            <span className="text-xs font-mono text-gray-400">
              {status === "idle" && "Ready to connect"}
              {status === "connecting" && "Connecting to Gemini Live..."}
              {status === "active" && (isSpeaking ? "Agent speaking..." : "Listening...")}
              {status === "ended" && "Conversation ended"}
              {status === "error" && "Error"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            {status === "idle" || status === "ended" || status === "error" ? (
              <>
                <button
                  onClick={handleStartConversation}
                  disabled={!formData}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-mono font-medium transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  Start Conversation
                </button>
                <button
                  onClick={handleQuickTest}
                  disabled={!formData}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-mono font-medium transition"
                >
                  Quick API Test (no mic)
                </button>
              </>
            ) : (
              <button
                onClick={handleEndConversation}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm font-mono font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                End Conversation
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 text-red-400 text-xs font-mono">{error}</p>
          )}

          {/* Audio visualizer */}
          {status === "active" && (
            <div className="mt-4 flex items-center justify-center gap-1 h-12">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeaking ? "bg-green-500" : "bg-gray-600"
                  }`}
                  style={{
                    height: isSpeaking
                      ? `${Math.random() * 32 + 8}px`
                      : "4px",
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Transcript */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-sm font-mono text-gray-400 mb-3">Transcript</h2>
          <div
            ref={transcriptRef}
            className="h-48 overflow-y-auto space-y-2 font-mono text-sm"
          >
            {transcript.length === 0 ? (
              <p className="text-gray-600 text-xs">
                Transcript will appear here during conversation...
              </p>
            ) : (
              transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${
                    entry.role === "agent" ? "text-green-400" : "text-blue-400"
                  }`}
                >
                  <span className="text-gray-600 text-xs shrink-0">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-gray-500 shrink-0">
                    {entry.role === "agent" ? "CAULI" : "YOU"}:
                  </span>
                  <span>{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Logs */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-mono text-gray-400">Debug Logs</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setLogs([])}
                className="text-xs font-mono text-gray-600 hover:text-gray-400 transition"
              >
                Clear
              </button>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs font-mono text-gray-600 hover:text-gray-400 transition"
              >
                {showLogs ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {showLogs && (
            <div
              ref={logsRef}
              className="h-48 overflow-y-auto font-mono text-xs space-y-0.5"
            >
              {logs.length === 0 ? (
                <p className="text-gray-700">No logs yet...</p>
              ) : (
                logs.map((log, i) => (
                  <p
                    key={i}
                    className={
                      log.includes("error") || log.includes("Error")
                        ? "text-red-400"
                        : log.includes("Received audio")
                        ? "text-yellow-600"
                        : log.includes("Sent ")
                        ? "text-gray-700"
                        : "text-gray-500"
                    }
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer debug info */}
        <div className="mt-4 text-xs font-mono text-gray-600">
          <p>API Key: {apiKey ? `${apiKey.slice(0, 10)}...` : "NOT SET"}</p>
          <p>Status: {status} | Form: {formData?.title || "Not loaded"}</p>
        </div>
      </div>
    </div>
  );
}
