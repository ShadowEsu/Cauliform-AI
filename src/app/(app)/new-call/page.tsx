"use client";

import { useState } from "react";

type CallState = "idle" | "parsing" | "calling" | "in_progress" | "error";

export default function NewCallPage() {
  const [formUrl, setFormUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string | null>(null);

  async function startCall(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFormTitle(null);

    if (!formUrl || !phoneNumber) {
      setError("Please enter a form URL and phone number.");
      return;
    }

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
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Start a call</div>
      <p className="mt-1 text-sm text-zinc-400">
        Paste a Google Form URL, enter your number, and Cauliform will call you.
      </p>

      <form onSubmit={startCall} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Google Form URL</label>
          <input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://docs.google.com/forms/..."
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300 mb-1">Phone number</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 555 123 4567"
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {formTitle && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
            Form: <span className="font-semibold">{formTitle}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={callState === "parsing" || callState === "calling"}
          className="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white hover:bg-rose-500 disabled:opacity-70"
        >
          {callState === "parsing"
            ? "Parsing form…"
            : callState === "calling"
              ? "Calling…"
              : callState === "in_progress"
                ? "Call started"
                : "Call me →"}
        </button>
      </form>
    </div>
  );
}

