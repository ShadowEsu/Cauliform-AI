"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { createFormAgentPrompt, getFormTools } from "@/lib/prompts";
import type { FormData } from "@/lib/types";

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

type Stage = "landing" | "connecting" | "conversation" | "submitting" | "done";

export default function ExperiencePage() {
  const [formUrl, setFormUrl] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [stage, setStage] = useState<Stage>("landing");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "failed">("idle");
  const [agentStreamUrl, setAgentStreamUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const transcriptRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const formUrlRef = useRef(formUrl);
  formUrlRef.current = formUrl;

  useEffect(() => {
    fetch("/api/gemini-token")
      .then((r) => r.json())
      .then((d) => { if (d.key) setApiKey(d.key); })
      .catch(() => {});
  }, []);

  const handleTranscript = useCallback((role: "user" | "agent", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date() }]);
  }, []);

  const handleError = useCallback((err: string) => setError(err), []);
  const handleLog = useCallback((msg: string) => setLogs((prev) => [...prev, msg]), []);

  const handleFormSubmit = useCallback(async (answers: { questionTitle: string; answer: string }[]) => {
    setSubmissionStatus("submitting");
    setStage("submitting");
    setAgentStreamUrl("");
    const log = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    log(`Submitting ${answers.length} answers...`);

    try {
      const res = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formUrl: formUrlRef.current, responses: answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmissionStatus("failed");
        log(`Failed: ${data.error}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setSubmissionStatus("failed"); return; }

      const decoder = new TextDecoder();
      let buffer = "";
      let steps = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            steps++;
            if (event.streamingUrl) setAgentStreamUrl(event.streamingUrl);
            if (event.purpose || event.message) log(`[Step ${steps}] ${event.purpose ?? event.message}`);
            if (event.type === "COMPLETE" || event.status === "COMPLETED") {
              setSubmissionStatus("success");
              setStage("done");
              log(`Submitted in ${steps} steps`);
            }
            if (event.type === "ERROR" || event.error) {
              setSubmissionStatus("failed");
              log(`Error: ${event.error ?? event.message}`);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setSubmissionStatus("failed");
      setLogs((prev) => [...prev, `Error: ${err.message}`]);
    }
  }, []);

  const { status, isSpeaking, connect, disconnect } = useGeminiLive({
    apiKey,
    onTranscript: handleTranscript,
    onError: handleError,
    onLog: handleLog,
    onFormSubmit: handleFormSubmit,
  });

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);
  useEffect(() => {
    if (status === "active" && stage === "connecting") setStage("conversation");
  }, [status, stage]);

  const handleStart = async () => {
    if (!formUrl) { setError("Please paste a Google Form link"); return; }
    setError("");
    setTranscript([]);
    setLogs([]);
    setSubmissionStatus("idle");
    setAgentStreamUrl("");
    setStage("connecting");

    try {
      handleLog("Parsing form...");
      const res = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse form");
      setFormData(data.data);
      handleLog(`"${data.data.title}" — ${data.data.questions.length} questions`);

      const prompt = createFormAgentPrompt(data.data.title, data.data.questions);
      await connect(prompt, getFormTools());
    } catch (err: any) {
      setError(err.message);
      setStage("landing");
    }
  };

  const handleReset = () => {
    disconnect();
    setStage("landing");
    setFormData(null);
    setTranscript([]);
    setLogs([]);
    setError("");
    setSubmissionStatus("idle");
    setAgentStreamUrl("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "linear-gradient(180deg, #f5e6d3 0%, #fdf6ee 50%, #fff 100%)" }}>
      <div className="w-full max-w-md">

        {/* ─── Landing ─── */}
        {stage === "landing" && (
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="Cauli" width={140} height={140} className="mb-2 drop-shadow-lg" />
            <h1 className="text-4xl font-bold text-stone-800 tracking-tight">Cauli</h1>
            <p className="text-stone-500 mt-1 mb-8 text-center">Fill out any Google Form with your voice</p>

            <div className="w-full space-y-3">
              <input
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="Paste Google Form link..."
                className="w-full px-4 py-3.5 bg-white/80 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition text-stone-800 placeholder:text-stone-400 shadow-sm"
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                onClick={handleStart}
                disabled={!formUrl || !apiKey}
                className="w-full py-3.5 bg-stone-800 text-white font-semibold rounded-2xl hover:bg-stone-700 disabled:bg-stone-300 disabled:text-stone-500 transition shadow-md flex items-center justify-center gap-2.5"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                Start Conversation
              </button>
            </div>
          </div>
        )}

        {/* ─── Connecting ─── */}
        {stage === "connecting" && (
          <div className="flex flex-col items-center py-12">
            <Image src="/logo.png" alt="Cauli" width={80} height={80} className="mb-4 opacity-80" />
            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mb-4" />
            <p className="text-stone-500">Connecting to Cauli...</p>
          </div>
        )}

        {/* ─── Conversation ─── */}
        {(stage === "conversation" || stage === "submitting" || stage === "done") && (
          <div className="flex flex-col items-center">
            <Image src="/logo.png" alt="Cauli" width={70} height={70} className="mb-2" />

            {/* Form title */}
            {formData && (
              <p className="text-sm text-stone-500 mb-4">{formData.title}</p>
            )}

            {/* Visualizer */}
            {status === "active" && (
              <div className="flex items-center justify-center gap-[3px] h-16 mb-4">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full transition-all duration-100"
                    style={{
                      height: isSpeaking ? `${Math.random() * 40 + 8}px` : "4px",
                      backgroundColor: isSpeaking ? "#d97706" : "#d6d3d1",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Status text */}
            <p className="text-sm text-stone-500 mb-6">
              {status === "active" && (isSpeaking ? "Cauli is speaking..." : "Listening...")}
              {stage === "submitting" && "Submitting your form..."}
              {stage === "done" && submissionStatus === "success" && "All done!"}
              {submissionStatus === "failed" && "Something went wrong"}
            </p>

            {/* Success check */}
            {stage === "done" && submissionStatus === "success" && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {stage === "conversation" && (
                <button onClick={() => { disconnect(); setStage("done"); }} className="px-5 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition">
                  End Call
                </button>
              )}
              {(stage === "done" || submissionStatus === "failed") && (
                <button onClick={handleReset} className="px-5 py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition">
                  Start Over
                </button>
              )}
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            {/* Debug toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="mt-6 text-xs text-stone-400 hover:text-stone-600 transition"
            >
              {showDebug ? "Hide" : "Show"} details
            </button>

            {showDebug && (
              <div className="w-full mt-3 space-y-3">
                {/* Browser embed */}
                {agentStreamUrl && (
                  <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                    <div className="bg-stone-100 px-3 py-1.5 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-stone-500">AI Agent — Live View</span>
                      {stage === "submitting" && <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                    </div>
                    <iframe
                      src={agentStreamUrl}
                      className="w-full bg-white"
                      style={{ height: "300px" }}
                      sandbox="allow-same-origin allow-scripts"
                      title="AI Agent"
                    />
                  </div>
                )}

                {/* Transcript */}
                <div className="bg-white/80 rounded-xl border border-stone-200 p-3 shadow-sm">
                  <p className="text-xs font-medium text-stone-400 mb-2">Transcript</p>
                  <div ref={transcriptRef} className="h-36 overflow-y-auto space-y-1 text-sm">
                    {transcript.length === 0 ? (
                      <p className="text-stone-300 text-xs">Waiting...</p>
                    ) : transcript.map((e, i) => (
                      <div key={i} className={e.role === "agent" ? "text-amber-800" : "text-blue-800"}>
                        <span className="text-stone-400 text-xs">{e.timestamp.toLocaleTimeString()} </span>
                        <span className="font-medium">{e.role === "agent" ? "Cauli" : "You"}: </span>
                        {e.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logs */}
                <div className="bg-stone-900 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-stone-500">Logs</p>
                    <button onClick={() => navigator.clipboard.writeText(logs.join("\n"))} className="text-xs text-stone-600 hover:text-stone-400">Copy</button>
                  </div>
                  <div ref={logsRef} className="h-32 overflow-y-auto space-y-0.5 font-mono text-xs">
                    {logs.map((l, i) => (
                      <p key={i} className={l.includes("ERROR") || l.includes("error") ? "text-red-400" : l.includes("===") || l.includes("Submitted") ? "text-green-400" : "text-stone-500"}>{l}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-stone-400 text-xs mt-10">
          Powered by Gemini Live API
        </p>
      </div>
    </div>
  );
}
