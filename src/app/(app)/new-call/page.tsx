"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedForms, getPrefs, setPrefs, type SavedForm } from "@/lib/local-store";

type CallState = "idle" | "parsing" | "calling" | "in_progress" | "error";

export default function NewCallPage() {
  const [formUrl, setFormUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);

  useEffect(() => {
    const prefs = getPrefs();
    if (prefs.defaultPhone) setPhoneNumber(prefs.defaultPhone);
    if (prefs.lastFormUrl) setFormUrl(prefs.lastFormUrl);
    setSavedForms(getSavedForms());
  }, []);

  async function startCall(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormTitle(null);

    if (!formUrl || !phoneNumber) {
      setError("Please enter a form URL and phone number.");
      return;
    }

    setPrefs({ defaultPhone: phoneNumber, lastFormUrl: formUrl });

    try {
      setCallState("parsing");
      const parseResponse = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });
      const parseData = await parseResponse.json();
      if (!parseResponse.ok) throw new Error(parseData.error || "Failed to parse form");
      setFormTitle(parseData.data?.title || "Untitled form");
      setQuestionCount(parseData.data?.questions?.length ?? 0);

      setCallState("calling");
      const callResponse = await fetch("/api/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formUrl, phoneNumber }),
      });
      const callData = await callResponse.json();
      if (!callResponse.ok) throw new Error(callData.error || "Failed to start call");

      setCallState("in_progress");
    } catch (err) {
      setCallState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 md:p-6">
        <h1 className="text-lg font-semibold text-white">Phone call</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Twilio rings your phone — answer and talk through the form with Cauli. Or use{" "}
          <Link href="/" className="text-amber-400 hover:text-amber-300 font-medium">
            browser voice
          </Link>{" "}
          for instant mic access.
        </p>

        {savedForms.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Saved forms
            </p>
            <div className="flex flex-wrap gap-2">
              {savedForms.slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormUrl(f.url)}
                  className="rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-amber-500/40 hover:text-amber-200 transition max-w-[200px] truncate"
                >
                  {f.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={startCall} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Google Form URL</label>
            <input
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">Your phone number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            <p className="mt-1 text-xs text-zinc-600">
              Enables profile memory — Cauli can confirm your name & email on future forms.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {formTitle && callState !== "idle" && callState !== "error" && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
              <span className="text-emerald-200 font-semibold">{formTitle}</span>
              {questionCount != null && (
                <span className="text-emerald-400/80"> · {questionCount} questions</span>
              )}
            </div>
          )}

          {callState === "in_progress" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 mb-2 animate-pulse">
                <span className="text-2xl">📞</span>
              </div>
              <p className="text-sm font-semibold text-amber-100">Your phone should be ringing!</p>
              <p className="text-xs text-amber-200/70 mt-1">Answer and follow Cauli&apos;s voice prompts.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={callState === "parsing" || callState === "calling"}
            className="w-full rounded-xl bg-rose-600 px-4 py-3.5 font-bold text-white hover:bg-rose-500 disabled:opacity-70 active:scale-[0.98] transition shadow-lg shadow-rose-900/40"
          >
            {callState === "parsing"
              ? "Parsing form…"
              : callState === "calling"
                ? "Calling you now…"
                : callState === "in_progress"
                  ? "Call in progress"
                  : "Call me →"}
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 text-center text-xs text-zinc-500">
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
          <span className="text-lg">1</span>
          <p className="mt-1 text-zinc-400">We parse your form</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
          <span className="text-lg">2</span>
          <p className="mt-1 text-zinc-400">Twilio calls you</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
          <span className="text-lg">3</span>
          <p className="mt-1 text-zinc-400">Gemini guides the form</p>
        </div>
      </div>
    </div>
  );
}
