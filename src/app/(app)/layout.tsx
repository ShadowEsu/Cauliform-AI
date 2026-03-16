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

            <div className="mt-4 border-t border-white/10 pt-4 space-y-3 text-xs text-zinc-500">
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
              <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-600/40 via-rose-600/10 to-transparent p-4 shadow-[0_0_40px_rgba(244,63,94,0.45)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold tracking-[0.3em] text-rose-100 uppercase">
                      Cauliform Pro
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-50">
                      For solo builders & students
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-zinc-100 bg-black/20 border border-white/20 rounded-full px-3 py-1">
                      $23.99 / mo
                    </div>
                    <div className="mt-1 text-[10px] text-rose-100/80">
                      Multi‑agent calls
                    </div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5 text-[11px] text-rose-50">
                  <li>• Multiple live agents per survey</li>
                  <li>• Active recall memory across forms</li>
                  <li>• Reliability & retry controls</li>
                </ul>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-zinc-950/80 px-3 py-1.5 text-[11px] font-semibold text-rose-100 border border-white/30 hover:bg-zinc-900"
                >
                  Upgrade to Cauliform Pro
                </button>
                <div className="mt-3 grid gap-2 text-[11px] text-rose-50/90">
                  <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2">
                    <div className="font-semibold text-emerald-100">
                      Cauliform Education
                    </div>
                    <div className="mt-0.5 text-[10px] text-emerald-50/90">
                      Free for 1 year for approved schools, classes, and non-profits.
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-2">
                    <div className="font-semibold text-sky-100">
                      Cauliform AI Business
                    </div>
                    <div className="mt-0.5 text-[10px] text-sky-50/90">
                      Access to advanced multi‑agent sessions and priority support —{" "}
                      <span className="font-semibold">$200 / mo</span>.
                    </div>
                  </div>
                </div>
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

