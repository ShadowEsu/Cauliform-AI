"use client";

const STEPS = ["Paste", "Connect", "Talk", "Confirm", "Done"] as const;

export function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between gap-1 w-full max-w-sm mx-auto">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full transition ${
                done
                  ? "bg-amber-500"
                  : active
                    ? "bg-amber-500 ring-4 ring-amber-500/25 animate-pulse"
                    : "bg-stone-300"
              }`}
            />
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${
                active || done ? "text-amber-700" : "text-stone-400"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
