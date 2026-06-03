"use client";

import { useAuth } from "@/app/providers";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSessionStats, getSavedForms, getPrefs } from "@/lib/local-store";
import { EmptyState } from "@/components/empty-state";

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "rose" | "amber" | "emerald";
}) {
  const ring =
    accent === "rose"
      ? "from-rose-500/20"
      : accent === "emerald"
        ? "from-emerald-500/20"
        : "from-amber-500/20";

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${ring} to-zinc-900/60 backdrop-blur p-4 md:p-5 animate-fade-up hover-lift transition`}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(() => getSessionStats());
  const [savedCount, setSavedCount] = useState(0);
  const [defaultPhone, setDefaultPhone] = useState("");

  useEffect(() => {
    setStats(getSessionStats());
    setSavedCount(getSavedForms().length);
    setDefaultPhone(getPrefs().defaultPhone ?? "");
  }, []);

  const greeting = useMemo(() => {
    const name = user?.name?.trim();
    if (name) return `Hey ${name.split(" ")[0]} 👋`;
    return "Welcome back";
  }, [user?.name]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 md:p-6 animate-fade-up overflow-hidden relative">
        <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{greeting}</h1>
            <p className="mt-1 text-sm text-zinc-400 max-w-md">
              Paste a form, talk to Cauli, confirm once — done. Works in the browser or as a home-screen app.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition active:scale-[0.98]"
            >
              Voice session →
            </Link>
            <Link
              href="/new-call"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10 transition"
            >
              Phone call
            </Link>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Sessions" value={String(stats.total)} hint="all time" accent="amber" />
          <StatCard label="Today" value={String(stats.today)} accent="rose" />
          <StatCard
            label="Completed"
            value={`${stats.completionRate}%`}
            hint={`${stats.submitted} submitted`}
            accent="emerald"
          />
          <StatCard label="Saved forms" value={String(savedCount)} />
        </div>
      </section>

      {/* Quick actions — mobile-friendly cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/",
            title: "Browser voice",
            desc: "Mic + Gemini Live in your tab",
            emoji: "🎙️",
            color: "border-amber-500/30 bg-amber-500/10",
          },
          {
            href: "/new-call",
            title: "Phone call",
            desc: "Twilio rings your number",
            emoji: "📞",
            color: "border-rose-500/30 bg-rose-500/10",
          },
          {
            href: "/saved-forms",
            title: "Saved forms",
            desc: "Reuse links you trust",
            emoji: "📋",
            color: "border-cyan-500/30 bg-cyan-500/10",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`rounded-2xl border p-4 transition hover-lift active:scale-[0.99] ${card.color}`}
          >
            <span className="text-2xl">{card.emoji}</span>
            <div className="mt-2 font-semibold text-white text-sm">{card.title}</div>
            <p className="text-xs text-zinc-400 mt-0.5">{card.desc}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent sessions</h2>
            <Link href="/sessions" className="text-xs font-semibold text-amber-400 hover:text-amber-300">
              View all →
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No sessions yet"
                description="Complete a voice form and your history will show up here automatically."
                actionLabel="Start voice session"
                actionHref="/"
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.recent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.formTitle}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(s.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.status === "submitted"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 animate-fade-up">
          <h2 className="font-semibold text-white">Profile memory</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Add your phone on the voice page so Cauli remembers name, email, and company across forms.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
            {defaultPhone ? (
              <p className="text-sm text-zinc-200">
                Saved phone: <span className="font-mono text-amber-300">{defaultPhone}</span>
              </p>
            ) : (
              <p className="text-sm text-zinc-500">No phone saved yet — set one in Settings or on your next call.</p>
            )}
            <Link
              href="/settings"
              className="mt-3 inline-block text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              Open settings →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {["fullName", "email", "company", "jobTitle"].map((field) => (
              <div
                key={field}
                className="rounded-lg border border-white/5 bg-white/5 px-2 py-2 text-zinc-400"
              >
                <span className="text-zinc-500">{field}</span>
                <span className="block text-zinc-300 font-medium">auto-learned</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-white/15 bg-zinc-900/40 p-4 text-center text-xs text-zinc-500">
        <p>
          <strong className="text-zinc-400">Install on mobile:</strong> Share → Add to Home Screen (iOS) or Install app (Android) for a full-screen experience.
        </p>
      </section>
    </div>
  );
}
