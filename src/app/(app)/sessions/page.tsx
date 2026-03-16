"use client";

export default function SessionsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Sessions</div>
      <p className="mt-1 text-sm text-zinc-400">
        Full call history with filters for completed, failed, dropped, and retrying.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: session list with status, duration, transcript, AI summary, result,
        and replay/download actions.
      </div>
    </div>
  );
}

