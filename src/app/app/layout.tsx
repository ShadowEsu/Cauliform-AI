import type { Metadata, Viewport } from "next";
import "@/styles/cauli.css";

export const metadata: Metadata = {
  title: "Cauliform — talk your forms in",
  description: "Voice-powered Google Forms with Gemini Live",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cauliform",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f5efe1",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
