"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { LoginScreen } from "@/components/cauli/LoginScreen";
import "@/styles/cauli.css";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInWithEmail } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/app");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="login-stage">
        <p style={{ color: "var(--fg-soft)" }}>Loading…</p>
      </div>
    );
  }

  if (user) return null;

  return <LoginScreen onGoogle={signInWithGoogle} onEmail={signInWithEmail} />;
}
