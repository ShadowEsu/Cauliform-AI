"use client";

import { useState } from "react";
import Link from "next/link";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Placeholder: we’ll wire real email reset later (Firebase/Auth backend).
    await new Promise((r) => setTimeout(r, 650));
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur p-8 shadow-2xl">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Cauliform
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            We’ll send a reset link to your email.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            If an account exists for <span className="font-semibold">{email}</span>,
            we sent a reset link.
            <div className="mt-3">
              <Link href="/login" className="text-rose-300 hover:text-rose-200">
                Back to login →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className={cx(
                "w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white transition",
                busy ? "opacity-70" : "hover:bg-rose-500"
              )}
            >
              {busy ? "Sending…" : "Send reset link →"}
            </button>

            <p className="text-center text-sm text-zinc-400">
              Remembered it?{" "}
              <Link href="/login" className="text-rose-300 hover:text-rose-200">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

