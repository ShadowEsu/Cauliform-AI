"use client";

import { useEffect, useMemo, useState } from "react";
import { isFirebaseConfigured } from "@/lib/env";

type ReliabilityConfig = {
  maxRetries: number;
  retryBackoffSeconds: number;
  dailyCallLimit: number;
};

const STORAGE_KEY = "cauliform_reliability_config";

function loadReliabilityConfig(): ReliabilityConfig {
  if (typeof window === "undefined") {
    return { maxRetries: 2, retryBackoffSeconds: 30, dailyCallLimit: 50 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { maxRetries: 2, retryBackoffSeconds: 30, dailyCallLimit: 50 };
    const parsed = JSON.parse(raw) as Partial<ReliabilityConfig>;
    return {
      maxRetries: parsed.maxRetries ?? 2,
      retryBackoffSeconds: parsed.retryBackoffSeconds ?? 30,
      dailyCallLimit: parsed.dailyCallLimit ?? 50,
    };
  } catch {
    return { maxRetries: 2, retryBackoffSeconds: 30, dailyCallLimit: 50 };
  }
}

export default function SettingsPage() {
  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);
  const [reliability, setReliability] = useState<ReliabilityConfig>(() =>
    loadReliabilityConfig()
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reliability));
  }, [reliability]);

  const handleChange =
    (field: keyof ReliabilityConfig) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
      setReliability((prev) => ({ ...prev, [field]: value }));
    };

  const handleSave = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reliability));
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Settings</div>
      <p className="mt-1 text-sm text-zinc-400">
        Configure integrations and call reliability defaults. These settings are local to
        this browser for now.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold text-white">Firebase (Google Auth)</div>
          <div className="mt-1 text-sm text-zinc-400">
            Status:{" "}
            <span className={firebaseReady ? "text-emerald-300" : "text-amber-300"}>
              {firebaseReady ? "Configured" : "Not configured"}
            </span>
          </div>
          {!firebaseReady ? (
            <div className="mt-3 text-xs text-zinc-500">
              Add these env vars to enable Google sign-in:
              <div className="mt-2 space-y-1 font-mono">
                <div>NEXT_PUBLIC_FIREBASE_API_KEY</div>
                <div>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</div>
                <div>NEXT_PUBLIC_FIREBASE_PROJECT_ID</div>
                <div>NEXT_PUBLIC_FIREBASE_APP_ID</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold text-white">Twilio Webhook</div>
          <div className="mt-1 text-sm text-zinc-400">
            Voice URL: <span className="text-zinc-200">/api/webhook</span>
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            For production, set Twilio Voice webhook to:
            <div className="mt-2 font-mono text-zinc-300">
              https://YOUR_CLOUD_RUN_URL/api/webhook
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950/40 p-4">
        <div className="text-sm font-semibold text-white">Call reliability defaults</div>
        <p className="mt-1 text-sm text-zinc-400">
          Configure how many times Cauliform should retry failed calls and how aggressively
          to rate-limit campaigns. Backend logic can read these settings later.
        </p>

        <div className="mt-4 space-y-3 text-sm">
          <div>
            <label className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Max retries per call</span>
              <input
                type="number"
                min={0}
                max={5}
                value={reliability.maxRetries}
                onChange={handleChange("maxRetries")}
                className="w-20 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-right text-sm text-white"
              />
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              0 means no automatic retries. Common values are 1–3.
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Retry backoff (seconds)</span>
              <input
                type="number"
                min={5}
                max={600}
                value={reliability.retryBackoffSeconds}
                onChange={handleChange("retryBackoffSeconds")}
                className="w-24 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-right text-sm text-white"
              />
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              How long to wait before retrying a failed call.
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Daily call limit per project</span>
              <input
                type="number"
                min={0}
                max={10000}
                value={reliability.dailyCallLimit}
                onChange={handleChange("dailyCallLimit")}
                className="w-28 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-right text-sm text-white"
              />
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              Soft cap for how many calls to place per day across all forms.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
          >
            Save reliability config
          </button>
          {savedAt ? (
            <div className="text-xs text-zinc-500">Saved at {savedAt}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

