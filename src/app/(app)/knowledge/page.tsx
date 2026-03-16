"use client";

export default function KnowledgePage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Knowledge</div>
      <p className="mt-1 text-sm text-zinc-400">
        FAQ and context the voice agent can use during calls.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: add a knowledge base (policies, class info, customer context) so
        agents can answer questions while filling surveys.
      </div>
    </div>
  );
}

