"use client";

export default function SavedFormsPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Saved Forms</div>
      <p className="mt-1 text-sm text-zinc-400">
        Keep reusable Google Form imports and parsed schemas.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Parsed schema preview</div>
          <p className="mt-1 text-xs text-zinc-400">
            Show question count, types, required fields, and unsupported question warnings.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-300">
          <div className="font-semibold text-white">Readiness checks</div>
          <p className="mt-1 text-xs text-zinc-400">
            Validate the form can be completed by voice before starting a call.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
        Coming soon: save form URLs from calls, keep parsed schemas, and map fields to
        autofill profiles.
      </div>
    </div>
  );
}

