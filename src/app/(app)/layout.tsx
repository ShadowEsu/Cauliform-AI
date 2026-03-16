"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/providers";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={[
        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-white/10 text-white"
          : "text-zinc-300 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <span className="font-medium">{label}</span>
      {active ? <span className="text-xs text-zinc-400">●</span> : null}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/18 via-amber-500/14 to-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-64 flex-shrink-0 md:block">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-4">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Cauliform
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                Voice Dashboard
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Signed in as <span className="text-zinc-300">{user.email}</span>
              </div>
            </div>

            <nav className="space-y-1">
              <NavLink href="/dashboard" label="Dashboard" />
              <NavLink href="/saved-forms" label="Saved Forms" />
              <NavLink href="/prompts" label="Prompts" />
              <NavLink href="/integrations" label="Integrations" />
              <NavLink href="/billing" label="Billing / Usage" />
              <NavLink href="/new-call" label="Start a Call" />
              <NavLink href="/settings" label="Settings" />
              <NavLink href="/help" label="Help" />
              <NavLink href="/about" label="Made by" />
              <NavLink href="/marketing" label="Landing" />
            </nav>

            <div className="mt-4 border-t border-white/10 pt-4 space-y-4 text-xs text-zinc-500">
              <button
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
              >
                Log out
              </button>
              <p className="leading-snug">
                Support:{" "}
                <a
                  href="mailto:prestonjaysusanto@gmail.com"
                  className="text-zinc-300 hover:text-white"
                >
                  prestonjaysusanto@gmail.com
                </a>
              </p>
              <div className="space-y-4 text-[11px]">
                {/* Pro */}
                <div className="w-full rounded-2xl border border-rose-500/50 bg-gradient-to-b from-rose-600/50 via-rose-600/15 to-zinc-950/70 p-5 shadow-[0_0_50px_rgba(244,63,94,0.6)] text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.3em] text-rose-100 uppercase">
                        Plan
                      </div>
                      <div className="mt-1 text-base font-semibold text-zinc-50">
                        Cauliform Pro
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => router.push("/plans")}
                        className="inline-flex items-center justify-center text-[10px] font-semibold text-zinc-100 bg-black/40 border border-white/30 rounded-full px-3 py-1 min-w-[84px] cursor-pointer hover:bg-black/60 hover:border-white/60 transition"
                      >
                        See details
                      </button>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-[12px] text-rose-50">
                    <li>• Multiple live agents per survey</li>
                    <li>• Active recall memory across forms</li>
                    <li>• Reliability & retry controls</li>
                  </ul>
                </div>

                {/* Education */}
                <div className="w-full rounded-2xl border border-emerald-400/50 bg-gradient-to-b from-emerald-500/35 via-emerald-500/12 to-zinc-950/70 p-5 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.3em] text-emerald-100 uppercase">
                        Plan
                      </div>
                      <div className="mt-1 text-base font-semibold text-emerald-50">
                        Cauliform Education
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => router.push("/plans")}
                        className="inline-flex items-center justify-center text-[10px] font-semibold text-emerald-100 bg-black/40 border border-emerald-300/60 rounded-full px-3 py-1 min-w-[84px] cursor-pointer hover:bg-black/60 hover:border-emerald-200/80 transition"
                      >
                        See details
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] text-emerald-50/90">
                    For approved schools, classes, and non-profits using Cauliform in
                    teaching or research.
                  </p>
                </div>

                {/* Business */}
                <div className="w-full rounded-2xl border border-sky-400/50 bg-gradient-to-b from-sky-500/35 via-sky-500/12 to-zinc-950/70 p-5 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.3em] text-sky-100 uppercase">
                        Plan
                      </div>
                      <div className="mt-1 text-base font-semibold text-sky-50">
                        Cauliform AI Business
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => router.push("/plans")}
                        className="inline-flex items-center justify-center text-[10px] font-semibold text-sky-100 bg-black/40 border border-sky-300/60 rounded-full px-3 py-1 min-w-[84px] cursor-pointer hover:bg-black/60 hover:border-sky-200/80 transition"
                      >
                        See details
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] text-sky-50/90">
                    Access to advanced multi‑agent sessions, team usage, and priority
                    support for real campaigns.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/plans")}
                  className="w-full rounded-lg bg-zinc-950/90 px-3 py-2 text-[11px] font-semibold text-zinc-100 border border-white/30 hover:bg-zinc-900 cursor-pointer"
                >
                  See full plans page
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur px-5 py-4 animate-fade-down">
            <div>
              <div className="text-sm font-semibold text-white">
                Build voice-first form experiences
              </div>
              <div className="text-xs text-zinc-500">
                Twilio + Gemini Live + Cloud Run
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/new-call"
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                New call
              </Link>
              <Link
                href="/marketing"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
              >
                View landing
              </Link>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

