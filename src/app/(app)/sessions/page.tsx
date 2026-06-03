"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessions, type LocalSession } from "@/lib/local-store";
import { EmptyState } from "@/components/empty-state";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [filter, setFilter] = useState<"all" | "submitted" | "failed">("all");

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const filtered =
    filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 md:p-6">
        <h1 className="text-lg font-semibold text-white">Session history</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Every voice form you complete on this device. Cloud history syncs when you use profile memory with a phone number.
        </p>

        <div className="mt-4 flex gap-2">
          {(["all", "submitted", "failed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === f
                  ? "bg-white/15 text-white"
                  : "bg-zinc-950/60 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No sessions yet" : `No ${filter} sessions`}
          description="Start a voice conversation from the home tab or launch a phone call."
          actionLabel="Start voice session"
          actionHref="/"
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-4 hover-lift transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{s.formTitle}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{s.formUrl}</p>
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(s.createdAt).toLocaleString()}
                    {s.answerCount != null && ` · ${s.answerCount} answers`}
                    {s.phoneNumber && ` · ${s.phoneNumber}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    s.status === "submitted"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : s.status === "failed"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-zinc-500/20 text-zinc-400"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/?url=${encodeURIComponent(s.formUrl)}`}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                >
                  Fill again →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
