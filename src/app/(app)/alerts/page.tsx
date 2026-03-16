"use client";

export default function AlertsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Alerts</div>
      <p className="mt-1 text-sm text-zinc-400">
        Webhook failures, low completion rate, Twilio errors, and missing env vars.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: alert feed and health checks (Twilio connectivity, webhook reachability,
        Gemini quota, and Cloud Run status).
      </div>
    </div>
  );
}

