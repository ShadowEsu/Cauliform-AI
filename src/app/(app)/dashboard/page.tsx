"use client";

import { useAuth } from "@/app/providers";
import Link from "next/link";
import { useMemo } from "react";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 animate-fade-up">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const name = user?.name?.trim();
    if (name) return `Welcome back, ${name.split(" ")[0]}.`;
    return "Welcome back.";
  }, [user?.name]);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <section
        className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
        style={{ animationDelay: "20ms" }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-semibold text-white">{greeting}</div>
            <p className="mt-1 text-sm text-zinc-400">
              Turn any Google Form into a phone call—fast, accessible, and hands-free.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/new-call"
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Start a call →
            </Link>
            <Link
              href="/marketing"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              Open landing
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <div style={{ animationDelay: "40ms" }} className="animate-fade-up">
            <StatCard label="Calls today" value="0" />
          </div>
          <div style={{ animationDelay: "60ms" }} className="animate-fade-up">
            <StatCard label="Completion rate" value="0%" />
          </div>
          <div style={{ animationDelay: "80ms" }} className="animate-fade-up">
            <StatCard label="Avg. call length" value="0:00" />
          </div>
          <div style={{ animationDelay: "100ms" }} className="animate-fade-up">
            <StatCard label="Failed calls" value="0" />
          </div>
          <div style={{ animationDelay: "120ms" }} className="animate-fade-up">
            <StatCard label="Active forms" value="0" />
          </div>
        </div>
      </section>

      {/* Main panels */}
      <section className="grid gap-3 lg:grid-cols-2">
        {/* Calls / sessions */}
        <div
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
          style={{ animationDelay: "140ms" }}
        >
          <div className="text-lg font-semibold text-white">Calls</div>
          <div className="mt-1 text-sm text-zinc-400">
            Full session history, duration, transcript, and outcome.
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            No sessions yet. When calls run, this panel will show a table of recent
            sessions with status, length, transcript summary, and replay actions.
          </div>
        </div>

        {/* Forms */}
        <div
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          <div className="text-lg font-semibold text-white">Forms</div>
          <div className="mt-1 text-sm text-zinc-400">
            Saved Google Forms, parsed question preview, and readiness checks.
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            As you parse forms on the New call page, we&apos;ll list them here with
            supported question types and warnings for anything we can&apos;t yet handle.
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {/* Contacts / profiles */}
        <div
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <div className="text-lg font-semibold text-white">Contacts</div>
          <div className="mt-1 text-sm text-zinc-400">
            Saved phone numbers, autofill memory, preferred language, and past completions.
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            Future sessions will populate this with profiles keyed by phone number, so
            Cauliform can autofill repeated fields like name, email, and organization.
          </div>
        </div>

        {/* Analytics */}
        <div
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <div className="text-lg font-semibold text-white">Analytics</div>
          <div className="mt-1 text-sm text-zinc-400">
            Call trends, completion rate, drop-off points, and time per form.
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            This panel will show charts for call volume, completion %, and average call
            length once session data is wired into Firestore.
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {/* Failures / debug */}
        <div
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
          style={{ animationDelay: "220ms" }}
        >
          <div className="text-lg font-semibold text-white">Failures</div>
          <div className="mt-1 text-sm text-zinc-400">
            Failed calls, webhook issues, and retry queue.
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            Once wired, this panel will show any Twilio errors, webhook exceptions, and
            which sessions are queued for automatic retries.
          </div>
        </div>

        {/* Profiles / autofill */}
        <div
          className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          <div className="text-lg font-semibold text-white">Saved profiles</div>
          <div className="mt-1 text-sm text-zinc-400">
            Autofill settings and memory for repeat callers.
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            Here you&apos;ll see a list of profiles Cauliform can use to prefill
            questions like name, email, and company on future calls.
          </div>
        </div>
      </section>
    </div>
  );
}

