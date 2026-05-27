"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/app" : "/login");
  }, [loading, user, router]);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f2ede4" }}>
      <p style={{ color: "#7a6e64" }}>Loading Cauliform…</p>
    </div>
  );
}
