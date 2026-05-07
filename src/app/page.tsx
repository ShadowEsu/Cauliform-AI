"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { createFormAgentPrompt, getFormTools } from "@/lib/prompts";
import type { FormData } from "@/lib/types";
import { useAuth } from "@/app/providers";

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

type AppState = "input" | "connecting" | "conversation" | "ended";

export default function HomePage() {
  const { user } = useAuth();
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
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Fetch API key from server
  useEffect(() => {
    // If user is not logged in, we can't get the token (protected API)
    if (!user) return;

    // Use session token if available for authentication
    fetch("/api/gemini-token")
      .then((r) => r.json())
      .then((d) => { if (d.key) setApiKey(d.key); })
      .catch(() => {});
  }, [user]);

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
              // Save profile memory + call session
              if (phoneRef.current) {
                fetch("/api/user-profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    phoneNumber: phoneRef.current,
                    answers,
                    formUrl: formUrlRef.current,
                    formTitle: formDataRef.current?.title || "Unknown Form",
                    status: "submitted",
                  }),
                }).then(() => log("Profile memory + call session saved")).catch(() => {});
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
    if (!user) { setError("Please log in to use the voice agent"); return; }
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
      const targetPhone = phoneNumber || "";
      if (targetPhone) {
        try {
          const profileRes = await fetch(`/api/user-profile?phone=${encodeURIComponent(targetPhone)}`);
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white flex flex-col items-center p-4">
      {/* Navigation Header */}
      <nav className="w-full max-w-5xl flex items-center justify-between py-6 mb-8">
        <div className="flex items-center gap-2">
          <Image src="/logo-clean.png" alt="Cauliform" width={32} height={32} />
          <span className="font-bold text-xl tracking-tight text-gray-900">Cauliform</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Dashboard</Link>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">{user.email}</span>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Login</Link>
              <Link href="/signup" className="text-sm font-semibold px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <div className="w-full max-w-xl">
        {/* Hero Section */}
        {appState === "input" && (
          <div className="text-center mb-10 animate-fade-up">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
              Talk to your <br />
              <span className="text-amber-600">Google Forms.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
              Transform any form into a natural voice conversation. Hands-free, eyes-free, effort-free.
            </p>
          </div>
        )}

        {/* Input State Card */}
        {appState === "input" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xl shadow-amber-900/5 mb-10 animate-fade-up">
            <div className="space-y-4">
              <div className="group relative">
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="Paste a Google Form URL..."
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition text-gray-900 pr-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </div>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone number (enables memory)"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition text-gray-900"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={!formUrl || (user ? false : true)}
                className="w-full py-4 px-6 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-gray-900/20"
              >
                {!user ? "Login to Start" : (
                  <>
                    <svg className="w-5 h-5 animate-pulse text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                    Launch Voice Agent
                  </>
                )}
              </button>

              <button
                onClick={() => setShowTestGuide(!showTestGuide)}
                className="w-full text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-amber-600 transition pt-2"
              >
                {showTestGuide ? "Close Guide" : "New here? View Guide"}
              </button>
            </div>

            {showTestGuide && (
              <div className="mt-8 space-y-4 border-t border-gray-100 pt-6 animate-fade-down">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">1</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Paste your form URL</p>
                    <p className="text-xs text-gray-500 mt-1">We&apos;ll analyze the questions instantly.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Authorize the Agent</p>
                    <p className="text-xs text-gray-500 mt-1">Our agent needs microphone access to talk to you.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Submit with your voice</p>
                    <p className="text-xs text-gray-500 mt-1">Review your answers and say &quot;Confirm&quot; to submit.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Grid */}
        {appState === "input" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-20">
            <div className="p-5 bg-white rounded-2xl border border-gray-200">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Real-time Gemini Live</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Latency-free voice interactions powered by Google&apos;s latest multimodal models.</p>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-gray-200">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Cyber Defense Layers</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Rate limiting, encrypted memory, and secure auth keep your form data private.</p>
            </div>
          </div>
        )}

        {/* Connecting State */}
        {appState === "connecting" && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-xl shadow-amber-900/5 animate-pulse">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-amber-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connecting to Cauli...</h3>
            <p className="text-gray-500 text-sm">Analyzing form structure and warming up the agent.</p>
          </div>
        )}

        {/* Conversation State */}
        {(appState === "conversation" || appState === "ended") && (
          <div className="space-y-4 animate-fade-up">
            {/* Form info header */}
            {formData && (
              <div className="px-5 py-4 bg-gray-900 text-white rounded-2xl shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Active Session</p>
                  <p className="font-bold truncate max-w-[200px]">{formData.title}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-400">{formData.questions.length} Fields</p>
                   {status === "active" && <div className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" />}
                </div>
              </div>
            )}

            {/* Conversation Area */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-2xl shadow-amber-900/5 min-h-[400px] flex flex-col">
              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-2 mb-10">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                  status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                  {status === "active" ? (isSpeaking ? "Agent Speaking" : "Listening...") : "Connection Closed"}
                </div>
              </div>

              {/* Central Interaction Point */}
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {status === "active" ? (
                  <>
                    <div className="flex items-end justify-center gap-1.5 h-16 mb-8">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full transition-all duration-150 ${isSpeaking ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-gray-200"}`}
                          style={{ height: isSpeaking ? `${Math.random() * 60 + 10}%` : "15%" }}
                        />
                      ))}
                    </div>
                    <p className="text-gray-500 italic max-w-xs">&quot;{transcript[transcript.length - 1]?.text || "Hello! How can I help you today?"}&quot;</p>
                  </>
                ) : (
                  <div className="text-gray-400 py-10">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    <p>Conversation Ended</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-auto pt-8 flex items-center justify-center gap-4">
                 {appState === "conversation" && (
                  <button
                    onClick={handleEnd}
                    className="group px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-white" />
                    End Call
                  </button>
                )}
                {appState === "ended" && (
                  <button onClick={handleReset} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg active:scale-95">
                    Start New Call
                  </button>
                )}
              </div>
            </div>

            {/* Submission status alert */}
            {submissionStatus !== "idle" && (
              <div className={`px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-bounce ${
                submissionStatus === "submitting" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                submissionStatus === "success" ? "bg-green-50 text-green-800 border border-green-200" :
                "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {submissionStatus === "submitting" && <div className="w-4 h-4 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />}
                {submissionStatus === "submitting" && "AI agent is submitting your form responses..."}
                {submissionStatus === "success" && "✓ Form successfully submitted to Google!"}
                {submissionStatus === "failed" && "✕ Submission failed. Review logs for details."}
              </div>
            )}

            {/* Collapsible Debug Tools */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
               <button
                onClick={() => setShowDebug(!showDebug)}
                className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition"
               >
                 <span>Developer Debug Console</span>
                 <svg className={`w-4 h-4 transition ${showDebug ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </button>

               {showDebug && (
                 <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                    {/* Live Browser (if submitting) */}
                    {agentStreamUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                        <div className="bg-gray-100 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Autonomous Browser Agent</span>
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <iframe src={agentStreamUrl} className="w-full h-[300px]" title="AI Browser" />
                      </div>
                    )}

                    {/* Full Transcript */}
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conversation Transcript</p>
                       <div ref={transcriptRef} className="max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-2">
                         {transcript.map((e, i) => (
                           <div key={i} className={`flex gap-2 ${e.role === "agent" ? "text-amber-700" : "text-blue-700"}`}>
                             <span className="font-bold shrink-0">{e.role === "agent" ? "Agent:" : "User:"}</span>
                             <span>{e.text}</span>
                           </div>
                         ))}
                       </div>
                    </div>

                    {/* Internal Logs */}
                    <div className="space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Events</p>
                       <div ref={logsRef} className="max-h-40 overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl p-3 font-mono text-[10px] space-y-1">
                          {logs.map((l, i) => (
                            <p key={i} className={l.includes("ERROR") ? "text-red-400" : "text-gray-500"}>{l}</p>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center mt-12 pb-10">
          <Link href="/about" className="text-xs font-bold text-gray-400 hover:text-amber-600 transition uppercase tracking-widest">
            Project Architecture & Team
          </Link>
        </div>
      </div>
    </div>
  );
}
