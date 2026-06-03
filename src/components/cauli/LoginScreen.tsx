"use client";

import { useState } from "react";
import Image from "next/image";
import { GoogleG } from "./icons";

type Props = {
  onGoogle: () => Promise<void>;
  onEmail: (email: string) => Promise<void>;
  error?: string | null;
};

export function LoginScreen({ onGoogle, onEmail, error }: Props) {
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveMemory, setSaveMemory] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const completeGoogle = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await onGoogle();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Sign-in failed");
      setLoading(false);
    }
  };

  const completeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setLocalError(null);
    try {
      await onEmail(email);
      setEmailSent(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not send magic link");
    } finally {
      setLoading(false);
    }
  };

  const err = localError || error;

  return (
    <div className="login-stage">
      <div className="grid-bg" aria-hidden />
      <div className="glow-bg" aria-hidden />
      <div className="login-card">
        <div className="login-mark">
          <Image src="/cauli-mascot.png" alt="Cauli mascot" width={80} height={80} priority />
        </div>
        <h1>
          Welcome to <span className="accent">Cauliform</span>
        </h1>
        <p className="sub">Sign in to keep your memory and history across devices.</p>

        {err && (
          <div style={{ background: "#fdecea", color: "#c0392b", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
            {err}
          </div>
        )}

        {emailSent ? (
          <div style={{ textAlign: "center", color: "var(--fg-soft)", fontSize: 15, lineHeight: 1.5 }}>
            <p style={{ margin: "0 0 12px" }}>
              Check <strong>{email}</strong> for your magic link.
            </p>
            <button type="button" className="login-btn" onClick={() => { setEmailSent(false); setMode("choose"); }}>
              ← Back
            </button>
          </div>
        ) : mode === "choose" ? (
          <>
            <button className="login-btn primary" onClick={completeGoogle} disabled={loading}>
              <GoogleG size={20} />
              {loading ? "Signing in…" : "Continue with Google"}
            </button>
            <button className="login-btn" onClick={() => setMode("email")} disabled={loading}>
              Continue with email
            </button>
            <label className="login-saver">
              <input
                type="checkbox"
                checked={saveMemory}
                onChange={(e) => setSaveMemory(e.target.checked)}
              />
              <span>Save my voice memory across sessions</span>
            </label>
          </>
        ) : (
          <form onSubmit={completeEmail}>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="email"
                placeholder="you@somewhere.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="login-btn primary" disabled={loading || !email.trim()}>
              {loading ? "Sending…" : "Send magic link →"}
            </button>
            <button type="button" className="login-btn" onClick={() => setMode("choose")} disabled={loading}>
              ← Back
            </button>
          </form>
        )}

        <div className="login-foot">
          By continuing you agree to our{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
