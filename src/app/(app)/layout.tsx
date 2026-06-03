"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/providers";
import { MobileTabBar } from "@/components/mobile-tab-bar";

const DESKTOP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/new-call", label: "Start Call" },
  { href: "/", label: "Voice Agent" },
  { href: "/saved-forms", label: "Saved Forms" },
  { href: "/sessions", label: "History" },
  { href: "/settings", label: "Settings" },
] as const;

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
      {active ? <span className="text-xs text-amber-400">●</span> : null}
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen-safe bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-500">Loading Cauliform…</p>
        </div>
      </div>
    );
  }

  const pageTitle =
    DESKTOP_NAV.find((n) => n.href === pathname)?.label ?? "Cauliform";

  return (
    <div className="min-h-screen-safe bg-zinc-950 text-zinc-100 pb-nav md:pb-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600/18 via-amber-500/14 to-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen-safe max-w-6xl gap-6 px-4 py-4 md:px-6 md:py-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block xl:w-64">
          <div className="sticky top-6 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-4">
            <div className="mb-4 flex items-center gap-2">
              <Image src="/logo-clean.png" alt="" width={36} height={36} className="rounded-lg" />
              <div>
                <div className="text-sm font-semibold text-white">Cauliform</div>
                <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">{user.email}</div>
              </div>
            </div>

            <nav className="space-y-0.5">
              {DESKTOP_NAV.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>

            <div className="mt-4 border-t border-white/10 pt-4">
              <Link
                href="/experience"
                className="block rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition mb-2"
              >
                Try demo (no login)
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/10"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="mb-4 md:mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur px-4 py-3 md:px-5 md:py-4 animate-fade-down">
            <div className="min-w-0">
              <div className="text-base md:text-sm font-semibold text-white truncate">
                {pageTitle}
              </div>
              <div className="text-xs text-zinc-500 hidden sm:block">
                Voice-first forms · Gemini Live
              </div>
            </div>
            <Link
              href="/new-call"
              className="shrink-0 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 active:scale-[0.98] transition shadow-lg shadow-rose-900/30"
            >
              + New call
            </Link>
          </header>

          <main>{children}</main>
        </div>
      </div>

      <MobileTabBar />
    </div>
  );
}
