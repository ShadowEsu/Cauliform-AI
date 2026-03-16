"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { createFormAgentPrompt, getFormTools } from "@/lib/prompts";
import type { FormData } from "@/lib/types";

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

type AppState = "input" | "connecting" | "conversation" | "ended";

export default function HomePage() {
  const [formUrl, setFormUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [appState, setAppState] = useState<AppState>("input");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [showTestGuide, setShowTestGuide] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "failed">("idle");
  const [agentStreamUrl, setAgentStreamUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [knownResponses, setKnownResponses] = useState<Record<string, string>>({});

  const transcriptRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const formUrlRef = useRef(formUrl);
  formUrlRef.current = formUrl;
  const phoneRef = useRef(phoneNumber);
  phoneRef.current = phoneNumber;

  // Fetch API key from server
  useEffect(() => {
    fetch("/api/gemini-token")
      .then((r) => r.json())
      .then((d) => { if (d.key) setApiKey(d.key); })
      .catch(() => {});
  }, []);

  const handleTranscript = useCallback((role: "user" | "agent", text: string) => {
    setTranscript((prev) => [...prev, { role, text, timestamp: new Date() }]);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  const handleLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleFormSubmit = useCallback(async (answers: { questionTitle: string; answer: string }[]) => {
    setSubmissionStatus("submitting");
    setAgentStreamUrl("");
    const log = (msg: string) => setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    log(`=== FORM SUBMISSION STARTED ===`);
    log(`Answers: ${JSON.stringify(answers)}`);

    try {
      const res = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formUrl: formUrlRef.current, responses: answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmissionStatus("failed");
        log(`=== SUBMISSION FAILED: ${data.error || data.details} ===`);
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
            if (event.streamingUrl) {
              setAgentStreamUrl(event.streamingUrl);
              setShowDebug(true);
            }
            if (event.purpose || event.message) log(`[Agent step ${steps}] ${event.purpose ?? event.message}`);
            if (event.type === "COMPLETE" || event.status === "COMPLETED") {
              setSubmissionStatus("success");
              log(`=== FORM SUBMITTED (${steps} steps) ===`);
              // Save profile memory
              if (phoneRef.current) {
                fetch("/api/user-profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phoneNumber: phoneRef.current, answers }),
                }).then(() => log("Profile memory saved")).catch(() => {});
              }
            }
            if (event.type === "ERROR" || event.error) {
              setSubmissionStatus("failed");
              log(`=== ERROR: ${event.error ?? event.message} ===`);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setSubmissionStatus("failed");
      setLogs((prev) => [...prev, `Submission error: ${err.message}`]);
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

  // Update appState based on connection status
  useEffect(() => {
    if (status === "active") setAppState("conversation");
    if (status === "ended" || status === "error") setAppState("ended");
  }, [status]);

  const handleStart = async () => {
    if (!formUrl) { setError("Please enter a Google Form URL"); return; }
    setError("");
    setTranscript([]);
    setLogs([]);
    setSubmissionStatus("idle");
    setAgentStreamUrl("");
    setAppState("connecting");

    try {
      // Parse form
      handleLog("Parsing form...");
      const res = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse form");

      setFormData(data.data);
      handleLog(`Parsed: "${data.data.title}" — ${data.data.questions.length} questions`);

      // Fetch user profile if phone number provided
      let profileResponses: Record<string, string> = {};
      if (phoneNumber) {
        try {
          const profileRes = await fetch(`/api/user-profile?phone=${encodeURIComponent(phoneNumber)}`);
          const profileData = await profileRes.json();
          if (profileData.profile?.commonResponses) {
            profileResponses = profileData.profile.commonResponses;
            setKnownResponses(profileResponses);
            handleLog(`Profile found: ${Object.keys(profileResponses).length} saved fields`);
          } else {
            handleLog("No existing profile — starting fresh");
          }
        } catch {
          handleLog("Profile lookup skipped");
        }
      }

      // Start voice conversation
      const systemPrompt = createFormAgentPrompt(data.data.title, data.data.questions, profileResponses);
      const tools = getFormTools();
      handleLog("Connecting to Gemini Live API...");
      await connect(systemPrompt, tools);
    } catch (err: any) {
      setError(err.message);
      setAppState("input");
    }
  };

  const handleEnd = () => {
    disconnect();
    setAppState("ended");
  };

  const handleReset = () => {
    setAppState("input");
    setFormData(null);
    setTranscript([]);
    setLogs([]);
    setError("");
    setSubmissionStatus("idle");
    setAgentStreamUrl("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-clean.png" alt="Cauliform" width={100} height={100} className="mb-3" />
          <h1 className="text-3xl font-bold text-gray-900">Cauliform</h1>
          <p className="text-gray-500 text-center mt-1 text-sm">
            Fill out any Google Form with your voice
          </p>
        </div>

        {/* Input State */}
        {appState === "input" && (
          <div className="space-y-4">
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="Paste a Google Form URL..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-gray-900"
            />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number (optional — enables memory)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-gray-900"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={handleStart}
              disabled={!formUrl || !apiKey}
              className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              Start Voice Conversation
            </button>

            {/* How to test it */}
            <button
              onClick={() => setShowTestGuide(!showTestGuide)}
              className={`w-full text-xs px-3 py-2 rounded-xl transition ${showTestGuide ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {showTestGuide ? "Hide" : "How to test it"}
            </button>

            {showTestGuide && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-sm text-gray-700 space-y-3">
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium">Copy this test form URL:</p>
                    <button
                      onClick={() => {
                        const url = "https://docs.google.com/forms/d/e/1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ/viewform";
                        navigator.clipboard.writeText(url);
                        setFormUrl(url);
                      }}
                      className="mt-1.5 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition text-gray-600 font-mono break-all leading-relaxed text-left"
                    >
                      https://docs.google.com/forms/d/e/1FAIpQLSeYpuyaG0XcrMvoxGugjTgsqafpGJyH5x5tQDJ7HSXNIyt8tQ/viewform
                      <span className="ml-2 text-amber-600">(tap to copy)</span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <p className="font-medium">Click &quot;Start Voice Conversation&quot; and allow mic access</p>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium">Answer 3 questions by voice:</p>
                    <ul className="text-xs text-gray-500 mt-1 space-y-0.5 list-disc list-inside">
                      <li>What&apos;s your name?</li>
                      <li>How old are you?</li>
                      <li>What grade? (Freshman/Sophomore/Junior/Senior)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <p className="font-medium">Say &quot;yes&quot; when Cauli asks to confirm &amp; submit</p>
                </div>
                <div className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  <div>
                    <p className="font-medium">Verify your submission:</p>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1U6SnVkcx1trpYpRAf6ePO_CagpUHWO5TJoAyWDUqp4s/edit?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition text-amber-700 font-mono break-all leading-relaxed block"
                    >
                      https://docs.google.com/spreadsheets/d/1U6SnVkcx1trpYpRAf6ePO_CagpUHWO5TJoAyWDUqp4s
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Connecting State */}
        {appState === "connecting" && (
          <div className="text-center py-8">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Parsing form & connecting...</p>
          </div>
        )}

        {/* Conversation State */}
        {(appState === "conversation" || appState === "ended") && (
          <div className="space-y-4">
            {/* Form info */}
            {formData && (
              <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-900">{formData.title}</p>
                <p className="text-xs text-amber-700">{formData.questions.length} questions</p>
              </div>
            )}

            {/* Status + controls */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                status === "active" ? (isSpeaking ? "bg-green-500 animate-pulse" : "bg-green-500") :
                status === "connecting" ? "bg-yellow-500 animate-pulse" :
                "bg-gray-400"
              }`} />
              <span className="text-sm text-gray-600">
                {status === "active" && (isSpeaking ? "Agent speaking..." : "Listening...")}
                {status === "ended" && "Conversation ended"}
                {status === "error" && "Error"}
              </span>
              <div className="ml-auto flex gap-2">
                {appState === "conversation" && (
                  <button onClick={handleEnd} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition">
                    End
                  </button>
                )}
                {appState === "ended" && (
                  <button onClick={handleReset} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                    New Form
                  </button>
                )}
              </div>
            </div>

            {/* Audio visualizer */}
            {status === "active" && (
              <div className="flex items-center justify-center gap-1 h-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${isSpeaking ? "bg-amber-500" : "bg-gray-300"}`}
                    style={{ height: isSpeaking ? `${Math.random() * 28 + 6}px` : "4px" }}
                  />
                ))}
              </div>
            )}

            {/* Submission status */}
            {submissionStatus !== "idle" && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                submissionStatus === "submitting" ? "bg-yellow-50 text-yellow-800 border border-yellow-200" :
                submissionStatus === "success" ? "bg-green-50 text-green-800 border border-green-200" :
                "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {submissionStatus === "submitting" && "AI agent is submitting your form..."}
                {submissionStatus === "success" && "Form submitted successfully!"}
                {submissionStatus === "failed" && "Submission failed. Check debug logs."}
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            {/* Debug toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              {showDebug ? "Hide" : "Show"} debug info
            </button>

            {showDebug && (
              <div className="space-y-3">
                {/* Live browser view */}
                {agentStreamUrl && (
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-gray-500">AI Agent — Live Browser</span>
                      {submissionStatus === "submitting" && <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                    </div>
                    <iframe
                      src={agentStreamUrl}
                      className="w-full bg-white"
                      style={{ height: "350px" }}
                      sandbox="allow-same-origin allow-scripts"
                      title="AI Agent Browser View"
                    />
                  </div>
                )}

                {/* Transcript */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Transcript</p>
                  <div ref={transcriptRef} className="h-40 overflow-y-auto space-y-1 text-sm">
                    {transcript.length === 0 ? (
                      <p className="text-gray-400 text-xs">Waiting for conversation...</p>
                    ) : transcript.map((e, i) => (
                      <div key={i} className={e.role === "agent" ? "text-amber-700" : "text-blue-700"}>
                        <span className="text-gray-400 text-xs">{e.timestamp.toLocaleTimeString()} </span>
                        <span className="font-medium">{e.role === "agent" ? "Cauli" : "You"}: </span>
                        {e.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Debug logs */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-500">Debug Logs</p>
                    <button onClick={() => navigator.clipboard.writeText(logs.join("\n"))} className="text-xs text-gray-600 hover:text-gray-400">Copy</button>
                  </div>
                  <div ref={logsRef} className="h-40 overflow-y-auto space-y-0.5 font-mono text-xs">
                    {logs.map((l, i) => (
                      <p key={i} className={l.includes("ERROR") || l.includes("error") ? "text-red-400" : l.includes("===") ? "text-green-400" : "text-gray-500"}>{l}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs mt-8 space-y-1">
          <p>Powered by Gemini Live API</p>
          <Link href="/about" className="text-amber-600 hover:text-amber-800 underline">
            About Cauliform
          </Link>
        </div>
      </div>
    </div>
  );
}
