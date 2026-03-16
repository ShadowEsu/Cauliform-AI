"use client";

const AUTHORS = [
  { name: "Preston", role: "Full Stack / Voice Flows" },
  { name: "cyu60", role: "Backend & Infrastructure" },
  { name: "woomy", role: "Frontend & Design Systems" },
  { name: "Stella", role: "Product & Experiment Design" },
];

export default function AboutPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Made by</div>
      <p className="mt-1 text-sm text-zinc-400">
        Cauliform is a hackathon project built around Twilio, Gemini Live, and Google
        Forms.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {AUTHORS.map((a) => (
          <div
            key={a.name}
            className="rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200"
          >
            <div className="font-semibold text-white">{a.name}</div>
            <div className="text-xs text-zinc-400">{a.role}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Built for the Gemini Live Agent Challenge to explore what AI‑driven phone calls
        can look like when they understand real forms and real people.
      </p>
    </div>
  );
}

