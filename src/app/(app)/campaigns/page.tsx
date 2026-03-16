"use client";

export default function CampaignsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Campaigns</div>
      <p className="mt-1 text-sm text-zinc-400">
        Group calls by demo, customer, class project, or form type.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: create campaigns, attach forms + contact lists, and track outcomes
        across a cohort.
      </div>
    </div>
  );
}

