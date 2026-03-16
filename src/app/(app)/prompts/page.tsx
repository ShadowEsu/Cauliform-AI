"use client";

export default function PromptsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Prompts</div>
      <p className="mt-1 text-sm text-zinc-400">
        Manage system prompts, tone presets, and call scripts.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Tone presets</div>
          <p className="mt-1 text-xs text-zinc-400">
            Friendly, professional, fast-paced, accessibility-first.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Retry behavior</div>
          <p className="mt-1 text-xs text-zinc-400">
            Configure how many retries, delays, and fallback SMS logic.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: prompt templates for different survey styles and multiple live
        agents (panel mode).
      </div>
    </div>
  );
}

