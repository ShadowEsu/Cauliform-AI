"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { isFirebaseConfigured } from "@/lib/env";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const googleReady = useMemo(() => isFirebaseConfigured(), []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur p-8 shadow-2xl animate-fade-up">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Cauliform
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Save sessions, manage forms, and launch voice calls faster.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/60"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className={cx(
              "w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white transition",
              busy ? "opacity-70" : "hover:bg-rose-500"
            )}
          >
            {busy ? "Creating…" : "Create account →"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
            OR CONTINUE WITH
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          disabled={busy || !googleReady}
          onClick={handleGoogle}
          className={cx(
            "w-full rounded-lg border border-white/10 bg-white/5 py-3 font-semibold text-zinc-100 hover:bg-white/10 transition",
            (!googleReady || busy) && "opacity-70 cursor-not-allowed"
          )}
          title={
            googleReady
              ? "Sign up with Google"
              : "Add Firebase env vars to enable Google sign-in"
          }
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-rose-300 hover:text-rose-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

