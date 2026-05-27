"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app");
  }, [router]);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f2ede4" }}>
      <p style={{ color: "#7a6e64" }}>Redirecting to Cauliform…</p>
    </div>
  );
}
