"use client";

export default function BillingUsagePage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Billing / Usage</div>
      <p className="mt-1 text-sm text-zinc-400">
        Minutes, token spend, call counts, storage usage, and quota monitoring.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Minutes</div>
          <div className="mt-2 text-2xl font-semibold text-white">0</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tokens</div>
          <div className="mt-2 text-2xl font-semibold text-white">0</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Calls</div>
          <div className="mt-2 text-2xl font-semibold text-white">0</div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: per-campaign usage breakdown, Twilio call costs, Gemini token tracking,
        and budget alerts.
      </div>
    </div>
  );
}

