"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { createFormAgentPrompt, getFormTools } from "@/lib/prompts";
import type { FormData } from "@/lib/types";
import type { SessionAnswer } from "@/lib/cauli-data";
import { Icon } from "./icons";

export type SessionState = {
  phase: "idle" | "parsing" | "speaking" | "listening" | "confirm" | "submitting" | "success" | "error";
  url?: string;
  formTitle?: string;
  formData?: FormData | null;
  qIdx?: number;
  answers?: SessionAnswer[];
  transcript?: string;
  traceStep?: number;
  error?: string;
  startedAt?: number;
};

type Props = {
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
  onBackToHome: () => void;
  onSubmitted: (payload: {
    formUrl: string;
    formTitle: string;
    answers: SessionAnswer[];
    status: "ok" | "fail";
    durationSeconds: number;
    questionCount: number;
    note?: string;
  }) => void;
  apiKey: string;
};

export function SessionSection({
  session,
  setSession,
  onBackToHome,
  onSubmitted,
  apiKey,
}: Props) {
  const phase = session.phase;
  const [wave, setWave] = useState(() => Array(20).fill(8));
  const formUrlRef = useRef(session.url ?? "");
  const formDataRef = useRef<FormData | null>(session.formData ?? null);
  const sessionStartRef = useRef<number | null>(session.startedAt ?? null);
  const collectedAnswersRef = useRef<SessionAnswer[]>([]);

  formUrlRef.current = session.url ?? "";
  formDataRef.current = session.formData ?? null;

  const handleFormSubmit = useCallback(
    async (answers: { questionTitle: string; answer: string }[]) => {
      const mapped = answers.map((a) => ({ q: a.questionTitle, a: a.answer }));
      collectedAnswersRef.current = mapped;
      setSession((s) => ({ ...s, phase: "submitting", answers: mapped, traceStep: 0 }));

      const started = sessionStartRef.current ?? Date.now();
      const durationSeconds = Math.round((Date.now() - started) / 1000);

      try {
        const res = await fetch("/api/submit-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formUrl: formUrlRef.current, responses: answers }),
        });

        if (!res.ok) {
          const data = await res.json();
          setSession((s) => ({ ...s, phase: "error", error: data.error || "Submission failed" }));
          onSubmitted({
            formUrl: formUrlRef.current,
            formTitle: formDataRef.current?.title ?? "Unknown Form",
            answers: mapped,
            status: "fail",
            durationSeconds,
            questionCount: formDataRef.current?.questions.length ?? mapped.length,
            note: data.error || "Submission failed",
          });
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let step = 0;

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
              step++;
              setSession((s) => ({ ...s, traceStep: step }));
              if (event.type === "COMPLETE" || event.status === "COMPLETED") {
                setSession((s) => ({ ...s, phase: "success" }));
                onSubmitted({
                  formUrl: formUrlRef.current,
                  formTitle: formDataRef.current?.title ?? "Unknown Form",
                  answers: mapped,
                  status: "ok",
                  durationSeconds,
                  questionCount: formDataRef.current?.questions.length ?? mapped.length,
                });
                return;
              }
              if (event.type === "ERROR" || event.error) {
                throw new Error(event.error ?? event.message ?? "Submission error");
              }
            } catch {
              /* skip malformed */
            }
          }
        }

        setSession((s) => ({ ...s, phase: "success" }));
        onSubmitted({
          formUrl: formUrlRef.current,
          formTitle: formDataRef.current?.title ?? "Unknown Form",
          answers: mapped,
          status: "ok",
          durationSeconds,
          questionCount: formDataRef.current?.questions.length ?? mapped.length,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Submission failed";
        setSession((s) => ({ ...s, phase: "error", error: msg }));
        onSubmitted({
          formUrl: formUrlRef.current,
          formTitle: formDataRef.current?.title ?? "Unknown Form",
          answers: mapped,
          status: "fail",
          durationSeconds,
          questionCount: formDataRef.current?.questions.length ?? mapped.length,
          note: msg,
        });
      }
    },
    [onSubmitted, setSession]
  );

  const handleTranscript = useCallback(
    (role: "user" | "agent", text: string) => {
      if (role === "agent") {
        setSession((s) => ({
          ...s,
          phase: s.phase === "parsing" ? "speaking" : s.phase === "listening" ? "speaking" : s.phase,
          transcript: text,
        }));
      } else {
        setSession((s) => ({ ...s, phase: "listening", transcript: text }));
      }
    },
    [setSession]
  );

  const { status, isSpeaking, connect, disconnect } = useGeminiLive({
    apiKey,
    onTranscript: handleTranscript,
    onError: (err) => setSession((s) => ({ ...s, phase: "error", error: err })),
    onFormSubmit: handleFormSubmit,
  });

  useEffect(() => {
    if (phase === "idle" || phase === "parsing" || phase === "confirm" || phase === "success" || phase === "error")
      return;
    const t = setInterval(() => {
      const cap = isSpeaking || phase === "speaking" ? 44 : 32;
      setWave((prev) =>
        prev.map((_, i) => {
          const base = cap * (0.45 + Math.random() * 0.55);
          const env = Math.sin(Date.now() / 240 + i * 0.5) * 0.5 + 0.5;
          return Math.max(4, Math.round(base * (0.5 + env * 0.55)));
        })
      );
    }, 220);
    return () => clearInterval(t);
  }, [phase, isSpeaking]);

  useEffect(() => {
    if (isSpeaking) setSession((s) => (s.phase === "listening" ? { ...s, phase: "speaking" } : s));
    if (status === "active" && !isSpeaking && session.phase === "speaking") {
      setSession((s) => ({ ...s, phase: "listening" }));
    }
  }, [isSpeaking, status, session.phase, setSession]);

  const startLiveSession = useCallback(
    async (rawUrl: string) => {
      let url = rawUrl.trim();
      if (!url.startsWith("http")) url = "https://" + url;
      sessionStartRef.current = Date.now();
      setSession({ phase: "parsing", url, answers: [], transcript: "", startedAt: Date.now() });

      try {
        const res = await fetch("/api/parse-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to parse form");

        const formData: FormData = data.data;
        formDataRef.current = formData;
        setSession((s) => ({
          ...s,
          formData,
          formTitle: formData.title,
          phase: "speaking",
        }));

        const systemPrompt = createFormAgentPrompt(formData.title, formData.questions, {});
        await connect(systemPrompt, getFormTools());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not start session";
        setSession({ phase: "error", url, error: msg });
      }
    },
    [connect, setSession]
  );

  const parseStartedRef = useRef(false);

  useEffect(() => {
    if (phase !== "parsing" || !session.url || session.formData || parseStartedRef.current) return;
    parseStartedRef.current = true;
    startLiveSession(session.url);
  }, [phase, session.url, session.formData, startLiveSession]);

  const sessionLive = ["parsing", "speaking", "listening", "confirm", "submitting"].includes(phase);
  const qTotal = session.formData?.questions.length ?? 0;
  const progressPct =
    qTotal > 0 && sessionLive
      ? Math.min(100, Math.round(((session.qIdx ?? 0) / qTotal) * 100))
      : phase === "success"
        ? 100
        : 0;

  const endSession = () => {
    disconnect();
    onBackToHome();
  };

  return (
    <div className="session-screen">
      {progressPct > 0 && (
        <div className="session-progress" aria-hidden="true">
          <div className="fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}
      <div className="session-top">
        <button type="button" className="session-back" onClick={endSession}>
          <Icon name="arrowL" size={16} /> Back home
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {sessionLive && (
            <span className="mem-chip">
              <span className="dot" />
              Memory active
            </span>
          )}
          <span className={"session-status" + (phase === "idle" ? " idle" : "")}>
            <span className="pip" />
            {phaseLabel(phase, status)}
          </span>
        </div>
      </div>

      {phase === "listening" && (
        <span className="barge-in">
          <span className="pip" /> You can speak any time
        </span>
      )}

      <div className="session-body">
        {phase === "idle" && <SessionIdle onStart={startLiveSession} initialUrl={session.url} />}
        {phase === "parsing" && <SessionParsing />}
        {(phase === "speaking" || phase === "listening") && (
          <SessionLiveUI
            phase={phase}
            formTitle={session.formTitle}
            transcript={session.transcript ?? ""}
            wave={wave}
            onEnd={() => {
              disconnect();
              setSession((s) => ({ ...s, phase: "confirm", answers: collectedAnswersRef.current }));
            }}
          />
        )}
        {phase === "confirm" && (
          <SessionConfirm
            answers={session.answers ?? collectedAnswersRef.current}
            onSubmit={() => handleFormSubmit((session.answers ?? []).map((a) => ({ questionTitle: a.q, answer: a.a })))}
            onBack={() => setSession((s) => ({ ...s, phase: "listening" }))}
          />
        )}
        {phase === "submitting" && <SessionSubmitting step={session.traceStep ?? 0} />}
        {phase === "success" && <SessionSuccess onDone={onBackToHome} title={session.formTitle} />}
        {phase === "error" && (
          <SessionError message={session.error ?? "Something went wrong"} onRetry={() => setSession({ phase: "idle" })} />
        )}
      </div>
    </div>
  );
}

function phaseLabel(phase: SessionState["phase"], status: string): string {
  if (phase === "idle") return "Standby";
  if (phase === "parsing") return "Reading form";
  if (phase === "speaking") return "Cauli speaking";
  if (phase === "listening") return status === "active" ? "Listening" : "Connecting";
  if (phase === "confirm") return "Confirm & submit";
  if (phase === "submitting") return "Submitting";
  if (phase === "success") return "Submitted";
  if (phase === "error") return "Error";
  return "Session";
}

function SessionIdle({ onStart, initialUrl }: { onStart: (url: string) => void; initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl?.replace(/^https?:\/\//, "") ?? "");
  return (
    <>
      <div className="mascot-stage breathing">
        <div className="mascot-img">
          <Image src="/cauli-mascot.png" alt="" width={120} height={120} />
        </div>
      </div>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 34, lineHeight: 1.05, margin: "0 0 8px" }}>
          I&apos;m here when you are.
        </h2>
        <p style={{ color: "var(--fg-soft)", margin: 0, fontSize: 15.5 }}>
          Paste a Google Form link and I&apos;ll walk you through it, one question at a time.
        </p>
      </div>
      <div style={{ width: "100%", maxWidth: 540 }}>
        <div className="url-row" style={{ marginTop: 8 }}>
          <span className="prefix">https://</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="docs.google.com/forms/d/…"
            spellCheck={false}
            autoComplete="off"
            onKeyDown={(e) => e.key === "Enter" && url.trim() && onStart(url)}
          />
          <button type="button" className="go" disabled={!url.trim()} onClick={() => onStart(url)}>
            Begin <span className="arr">→</span>
          </button>
        </div>
      </div>
    </>
  );
}

function SessionParsing() {
  return (
    <>
      <div className="mascot-stage speaking">
        <div className="ring" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="mascot-img">
          <Image src="/cauli-mascot.png" alt="" width={120} height={120} />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 32, margin: "0 0 8px" }}>
          Reading your form…
        </h2>
        <p style={{ color: "var(--fg-soft)", margin: 0 }}>A couple of seconds. Then I&apos;ll start asking.</p>
      </div>
    </>
  );
}

function SessionLiveUI({
  phase,
  formTitle,
  transcript,
  wave,
  onEnd,
}: {
  phase: string;
  formTitle?: string;
  transcript: string;
  wave: number[];
  onEnd: () => void;
}) {
  return (
    <>
      <div className={"mascot-stage " + phase}>
        <div className="ring" />
        <div className="ring r2" />
        <div className="ring r3" />
        <div className="mascot-img">
          <Image src="/cauli-mascot.png" alt="" width={120} height={120} />
        </div>
        {phase === "listening" && (
          <div className="listen-mic-dot">
            <Icon name="mic" size={16} />
          </div>
        )}
      </div>
      <div className="question-card">
        <div className="q-counter">{formTitle ?? "Live session"}</div>
        <p className="q-text" style={{ fontSize: 18 }}>
          {transcript || (phase === "speaking" ? "Cauli is speaking…" : "Listening for your answer…")}
        </p>
      </div>
      <div style={{ width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, height: 48, justifyContent: "center", width: "100%" }}>
          {wave.map((h, i) => (
            <span
              key={i}
              style={{
                width: 4,
                background: "var(--accent)",
                borderRadius: 2,
                height: h,
                transition: "height 100ms ease",
                minHeight: 4,
              }}
            />
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={onEnd}>
          <Icon name="pause" size={16} /> End & review
        </button>
      </div>
    </>
  );
}

function SessionConfirm({
  answers,
  onSubmit,
  onBack,
}: {
  answers: SessionAnswer[];
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 540 }}>
      <h2 style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 28, marginBottom: 8 }}>Review answers</h2>
      <p style={{ color: "var(--fg-soft)", marginBottom: 16 }}>Say confirm or tap submit when ready.</p>
      <div className="confirm-list">
        {answers.length === 0 ? (
          <p style={{ color: "var(--mute)" }}>Answers will appear here as Cauli captures them.</p>
        ) : (
          answers.map((a, i) => (
            <div key={i} className="confirm-row">
              <span className="cq">{a.q}</span>
              <span className="ca">{a.a}</span>
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <button type="button" className="btn-primary" onClick={onSubmit}>
          Submit form →
        </button>
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Back to session
        </button>
      </div>
    </div>
  );
}

function SessionSubmitting({ step }: { step: number }) {
  const labels = ["Opening form", "Filling fields", "Reviewing entries", "Clicking submit"];
  return (
    <div style={{ textAlign: "center" }}>
      <div className="mascot-stage speaking">
        <div className="mascot-img">
          <Image src="/cauli-mascot.png" alt="" width={120} height={120} />
        </div>
      </div>
      <h2 style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 28 }}>Submitting…</h2>
      <div className="trace-steps">
        {labels.map((l, i) => (
          <div key={l} className={"trace-step" + (step > i ? " done" : step === i + 1 ? " active" : "")}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionSuccess({ onDone, title }: { onDone: () => void; title?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className="mascot-stage">
        <div className="mascot-img">
          <Image src="/cauli-mascot.png" alt="" width={120} height={120} />
        </div>
      </div>
      <h2 style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 32, marginBottom: 8 }}>Submitted ✓</h2>
      <p style={{ color: "var(--fg-soft)" }}>{title ? `"${title}" is on its way.` : "Your form was submitted."}</p>
      <button type="button" className="btn-primary" style={{ marginTop: 20 }} onClick={onDone}>
        Back home →
      </button>
    </div>
  );
}

function SessionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 420 }}>
      <h2 style={{ color: "var(--fail)", fontFamily: "var(--serif)", fontWeight: 700, fontSize: 28 }}>Session error</h2>
      <p style={{ color: "var(--fg-soft)" }}>{message}</p>
      <button type="button" className="btn-secondary" style={{ marginTop: 16 }} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
