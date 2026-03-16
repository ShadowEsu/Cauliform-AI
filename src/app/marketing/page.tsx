"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type CallState =
  | "idle"
  | "parsing"
  | "calling"
  | "in_progress"
  | "success"
  | "error";

export default function MarketingPage() {
  const [formUrl, setFormUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const [formTitle, setFormTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formUrl || !phoneNumber) {
      setError("Please fill in all fields");
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
      if (!parseResponse.ok) {
        throw new Error(parseData.error || "Failed to parse form");
      }

      setFormTitle(parseData.data.title);

      setCallState("calling");
      const callResponse = await fetch("/api/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formUrl, phoneNumber }),
      });

      const callData = await callResponse.json();
      if (!callResponse.ok) {
        throw new Error(callData.error || "Failed to start call");
      }

      setCallState("in_progress");
    } catch (err) {
      setCallState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-rose-950 flex items-center justify-center px-4 py-10">
      <main className="w-full max-w-5xl animate-fade-up text-zinc-100">
        {/* Top nav */}
        <div className="mb-8 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="h-6 w-6 rounded-lg bg-rose-600 flex items-center justify-center text-xs font-semibold">
              C
            </span>
            <span className="font-semibold tracking-tight text-zinc-100">
              Cauliform
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-zinc-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/login" className="text-zinc-300 hover:text-white">
              Login
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          {/* Hero + form */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
              Turn any Google Form
              <br />
              into a <span className="text-rose-400">phone call.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm sm:text-base text-zinc-400">
              Paste a form link, enter a number, and let an AI agent powered by Gemini
              Live call you to fill out every question. Hands-free, accessible, and built
              for real surveys.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur p-5 shadow-xl">
              {callState === "idle" || callState === "error" ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="formUrl"
                      className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2"
                    >
                      Google Form URL
                    </label>
                    <input
                      id="formUrl"
                      type="url"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://docs.google.com/forms/d/..."
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/70"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-2"
                    >
                      Your phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 415 555 0123"
                      className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/70"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-rose-300 bg-rose-900/40 border border-rose-500/40 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 hover:bg-rose-500 transition flex items-center justify-center gap-2"
                  >
                    <span>Call me with this form</span>
                  </button>

                  {formTitle && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Parsed form: <span className="text-zinc-200">{formTitle}</span>
                    </p>
                  )}
                </form>
              ) : (
                <div className="text-center py-8">
                  {callState === "parsing" && (
                    <>
                      <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-sm text-zinc-300">Parsing your form…</p>
                    </>
                  )}

                  {callState === "calling" && (
                    <>
                      <div className="animate-pulse w-16 h-16 rounded-full bg-rose-500/30 mx-auto mb-4" />
                      <p className="text-sm text-zinc-100 font-medium">
                        Calling you now…
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Please answer to start the voice survey.
                      </p>
                    </>
                  )}

                  {callState === "in_progress" && (
                    <>
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-sm text-zinc-100 font-medium">
                        Call in progress
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Filling out: {formTitle}
                      </p>
                      <button
                        onClick={() => setCallState("idle")}
                        className="mt-4 text-xs font-semibold text-rose-300 hover:text-rose-200"
                      >
                        Start another form
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Built with Twilio Voice + Gemini Live. Your number is only used to place
              this demo call.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Why Cauliform
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-200">
                <li>• Complete surveys while walking, commuting, or cooking.</li>
                <li>• Accessibility‑first: great for screen‑free experiences.</li>
                <li>• Reuse your profile across multiple forms.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Tech stack
              </div>
              <ul className="mt-3 space-y-1 text-xs text-zinc-300">
                <li>• Twilio Voice for outbound calls</li>
                <li>• Gemini Live API for conversation</li>
                <li>• Next.js on Google Cloud Run</li>
              </ul>
              <a
                href="https://github.com/ShadowEsu/Cauliform-AI"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-semibold text-rose-300 hover:text-rose-200"
              >
                View GitHub repo →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

