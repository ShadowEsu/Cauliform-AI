"use client";

import { useMemo } from "react";
import { isFirebaseConfigured } from "@/lib/env";

export default function SettingsPage() {
  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">Settings</div>
      <p className="mt-1 text-sm text-zinc-400">
        Configure integrations and environment variables.
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
    </div>
  );
}

