"use client";

export default function PlansPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Choose your Cauliform plan
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          Three plans designed for different types of builders. This is a preview only;
          billing is not enabled yet.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Pro */}
          <div className="rounded-2xl border border-rose-500/50 bg-gradient-to-b from-rose-600/35 via-rose-600/10 to-zinc-950/60 p-5 shadow-[0_0_40px_rgba(244,63,94,0.45)]">
            <div className="text-xs font-semibold tracking-[0.3em] text-rose-100 uppercase">
              Pro
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-50">
              Cauliform Pro
            </div>
            <div className="mt-3 text-3xl font-bold text-zinc-50">$23.99</div>
            <div className="text-xs text-rose-100/80 mb-3">per month</div>
            <ul className="space-y-1.5 text-xs text-rose-50">
              <li>• Multiple live agents per survey</li>
              <li>• Active recall memory across forms</li>
              <li>• Reliability & retry controls</li>
            </ul>
          </div>

          {/* Education */}
          <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-zinc-950/60 p-5">
            <div className="text-xs font-semibold tracking-[0.3em] text-emerald-100 uppercase">
              Education
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-50">
              Cauliform Education
            </div>
            <div className="mt-3 text-3xl font-bold text-emerald-50">$0</div>
            <div className="text-xs text-emerald-100/80 mb-3">free for 1 year</div>
            <ul className="space-y-1.5 text-xs text-emerald-50">
              <li>• For approved schools, classes, and non-profits</li>
              <li>• Same features as Pro for classroom use</li>
              <li>• Perfect for research studies and course surveys</li>
            </ul>
          </div>

          {/* Business */}
          <div className="rounded-2xl border border-sky-400/50 bg-gradient-to-b from-sky-500/30 via-sky-500/10 to-zinc-950/60 p-5">
            <div className="text-xs font-semibold tracking-[0.3em] text-sky-100 uppercase">
              Business
            </div>
            <div className="mt-1 text-sm font-semibold text-sky-50">
              Cauliform AI Business
            </div>
            <div className="mt-3 text-3xl font-bold text-sky-50">$200</div>
            <div className="text-xs text-sky-100/80 mb-3">per month</div>
            <ul className="space-y-1.5 text-xs text-sky-50">
              <li>• Advanced multi-agent sessions</li>
              <li>• Priority support and SLA</li>
              <li>• Designed for teams running real campaigns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

