"use client";

export default function IntegrationsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Integrations</div>
      <p className="mt-1 text-sm text-zinc-400">
        Twilio, Gemini, Google Forms, Firebase, and Cloud Run status.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Twilio</div>
          <p className="mt-1 text-xs text-zinc-400">
            Voice webhook URL, status callbacks, and call reliability checks.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Gemini Live</div>
          <p className="mt-1 text-xs text-zinc-400">
            API key presence, model selection, and usage quotas.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Google Forms</div>
          <p className="mt-1 text-xs text-zinc-400">
            Parser readiness and unsupported question warnings.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Cloud Run</div>
          <p className="mt-1 text-xs text-zinc-400">
            Deploy health, environment variable checks, and uptime.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: automatic config verification + a copy/paste webhook setup helper.
      </div>
    </div>
  );
}

