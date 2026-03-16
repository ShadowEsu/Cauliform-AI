"use client";

import { useAuth } from "@/app/providers";
import Link from "next/link";
import { useMemo } from "react";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5">
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
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6">
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

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <StatCard label="Twilio" value="Connected" />
          <StatCard label="Webhook" value="/api/webhook" />
          <StatCard label="Deploy" value="Cloud Run" />
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6">
          <div className="text-lg font-semibold text-white">Quick actions</div>
          <div className="mt-1 text-sm text-zinc-400">
            Common workflows for testing and demos.
          </div>

          <div className="mt-5 grid gap-2">
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              Check health endpoint →
            </a>
            <a
              href="/api/webhook?sessionId=demo"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              Preview TwiML response →
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6">
          <div className="text-lg font-semibold text-white">Recent sessions</div>
          <div className="mt-1 text-sm text-zinc-400">
            Coming next: store call sessions in Firestore.
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-sm text-zinc-400">
            No sessions yet. Start a call to generate your first session.
          </div>
        </div>
      </section>
    </div>
  );
}

