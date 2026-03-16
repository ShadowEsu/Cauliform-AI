import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        background:
          "linear-gradient(180deg, #f5e6d3 0%, #fdf6ee 50%, #fff 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <p className="text-center text-amber-700 text-xs font-medium tracking-widest uppercase mb-6">
          Google AI &ndash; Gemini Live Agent Challenge
        </p>
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo-clean.png"
            alt="Cauliform AI"
            width={100}
            height={100}
            className="mb-2"
          />
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">
            Cauliform AI
          </h1>
          <p className="text-stone-500 mt-1 text-center max-w-md">
            Fill out any Google Form with your voice. Paste a form URL, and a
            Gemini-powered voice agent walks through every question
            conversationally &mdash; then submits answers back to the original
            Google Form.
          </p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/"
              className="px-5 py-2 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition"
            >
              Try Live Demo
            </Link>
            <a
              href="https://github.com/ShadowEsu/Cauliform-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-white text-stone-700 text-sm font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition"
            >
              View Source
            </a>
          </div>
        </div>

        {/* Demo Video */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">Demo</h2>
          <div className="rounded-xl overflow-hidden border border-stone-200">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src="https://www.youtube.com/embed/N7ZOtOqVaf8"
                title="Cauliform Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            How It Works
          </h2>
          <p className="text-stone-500 text-sm mb-4">
            Four steps. Zero typing.
          </p>
          <div className="space-y-3">
            {[
              {
                step: "01",
                title: "Paste a Form URL",
                desc: "Drop any Google Form link. Cauliform fetches and parses the HTML to extract every question, option, and required flag.",
              },
              {
                step: "02",
                title: "Gemini Builds a Prompt",
                desc: "The system auto-generates a Gemini Live prompt that understands your form\u2019s structure \u2014 questions, types, validation rules, everything.",
              },
              {
                step: "03",
                title: "Talk Through It",
                desc: "A real-time voice agent interviews you question by question \u2014 in the browser or over a phone call via Twilio.",
              },
              {
                step: "04",
                title: "Auto-Submit",
                desc: "When done, an AI browser agent fills out and submits the original Google Form. The form owner\u2019s workflow stays untouched.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white/70 rounded-xl border border-stone-200 p-4 flex gap-4"
              >
                <span className="shrink-0 w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                  {s.step}
                </span>
                <div>
                  <p className="font-medium text-stone-800 text-sm">
                    {s.title}
                  </p>
                  <p className="text-stone-500 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Technology
          </h2>
          <p className="text-stone-500 text-sm mb-4">
            Built on Google Cloud. A multi-service system: Next.js + Gemini Live
            + Twilio + Cloud Run + Artifact Registry.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                category: "AI & Voice",
                items: [
                  "Gemini Live API",
                  "gemini-2.5-flash-native-audio",
                  "WebSocket streaming",
                  "Real-time transcripts",
                ],
              },
              {
                category: "Cloud Infrastructure",
                items: [
                  "Google Cloud Run",
                  "Artifact Registry",
                  "Cloud Build",
                  "IAM & Service Accounts",
                ],
              },
              {
                category: "Frontend",
                items: [
                  "Next.js (App Router)",
                  "React + TypeScript",
                  "Tailwind CSS",
                  "Custom voice console",
                ],
              },
              {
                category: "Telephony",
                items: [
                  "Twilio Programmable Voice",
                  "TwiML webhooks",
                  "Outbound calling",
                  "Status callbacks",
                ],
              },
            ].map((t) => (
              <div
                key={t.category}
                className="bg-white/70 rounded-xl border border-stone-200 p-3"
              >
                <p className="font-medium text-stone-800 text-sm mb-1">
                  {t.category}
                </p>
                <ul className="text-stone-500 text-xs space-y-0.5">
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Flow */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Architecture Flow
          </h2>
          <div className="bg-stone-900 rounded-xl p-4 font-mono text-xs text-stone-400 space-y-1 leading-relaxed">
            <p>
              <span className="text-amber-400">Browser UI</span>{" "}
              <span className="text-stone-600">(Landing + Console)</span>
            </p>
            <p>
              &rarr; <span className="text-amber-400">Cloud Run</span>{" "}
              <span className="text-stone-600">(Next.js API Routes)</span>
            </p>
            <p>
              &rarr; <span className="text-amber-400">Gemini Live</span>{" "}
              <span className="text-stone-600">(WebSocket Audio)</span>
            </p>
            <p>
              &rarr; <span className="text-amber-400">Twilio</span>{" "}
              <span className="text-stone-600">(Voice Calls)</span>
            </p>
            <p>
              &rarr; <span className="text-green-400">Google Forms</span>{" "}
              <span className="text-stone-600">(Parse &amp; Submit)</span>
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            The Team
          </h2>
          <p className="text-stone-500 text-sm mb-4">
            Two students. One sprint. A two-person studio that shipped a real
            multi-service system on Google Cloud.
          </p>
          <div className="grid gap-3">
            {[
              {
                name: "Chinat Yu",
                school: "Stanford University",
                role: "Backend · Cloud Run · Twilio · IAM",
                details: [
                  "Google Cloud infrastructure & IAM",
                  "Twilio voice integration",
                  "Docker & Artifact Registry",
                  "Cloud Build CI/CD pipeline",
                ],
              },
              {
                name: "Preston",
                school: "Diablo Valley College",
                role: "Frontend · UX · Gemini Live Integration",
                details: [
                  "Landing page & dashboard UI",
                  "Voice console (/test) experience",
                  "Gemini Live WebSocket hook",
                  "Cauliform brand & design system",
                ],
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white/70 rounded-xl border border-stone-200 p-4"
              >
                <p className="font-medium text-stone-800 text-sm">{t.name}</p>
                <p className="text-amber-700 text-xs">{t.school}</p>
                <p className="text-stone-500 text-xs mt-1 font-medium">
                  {t.role}
                </p>
                <ul className="text-stone-500 text-xs mt-1 space-y-0.5">
                  {t.details.map((d) => (
                    <li key={d}>&bull; {d}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Challenges */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Challenges We Hit
          </h2>
          <div className="grid gap-3">
            {[
              {
                title: "IAM & Service Accounts",
                desc: "Had to grant Storage Admin, Artifact Registry Admin, and Logs Writer to Cloud Build\u2019s compute service account.",
              },
              {
                title: "WebSocket Auth with Gemini",
                desc: "Agent kept closing with code 1008 (\u2018unregistered callers\u2019) \u2014 fixed by wiring /api/gemini-token to fetch the key before opening the WebSocket.",
              },
              {
                title: "Region & Image Confusion",
                desc: "Pushed to gcr.io in us-central1 while deploying in us-west1. Moving to Artifact Registry in us-west1 fixed \u2018image not found\u2019 errors.",
              },
              {
                title: "Twilio + Cloud Run URLs",
                desc: "Removed all localhost refs, computed correct base URLs, and ensured TwiML responses had the right Content-Type: text/xml.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-white/70 rounded-xl border border-stone-200 p-3"
              >
                <p className="font-medium text-stone-800 text-sm">{c.title}</p>
                <p className="text-stone-500 text-xs mt-0.5">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What We're Proud Of */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            What We&apos;re Proud Of
          </h2>
          <ul className="space-y-2 text-stone-600 text-sm">
            <li>&bull; Shipped a real multi-service system as a 2-person team</li>
            <li>
              &bull; Test Console with form parsing, live transcript, debug logs,
              and AI form submission
            </li>
            <li>
              &bull; UI that feels like a product &mdash; clean landing page,
              dashboard with smooth animations
            </li>
            <li>
              &bull; End-to-end: voice &rarr; parse &rarr; converse &rarr;
              submit, all on Google Cloud
            </li>
          </ul>
        </section>

        {/* What We Learned */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            What We Learned
          </h2>
          <ul className="space-y-2 text-stone-600 text-sm">
            <li>
              &bull; IAM, service accounts, and regions matter as much as
              application code
            </li>
            <li>
              &bull; Designing for Gemini Live = streams, events, WebSockets
              &mdash; not REST
            </li>
            <li>
              &bull; With two people, ruthless prioritization beats feature
              completeness
            </li>
          </ul>
        </section>

        {/* Roadmap */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Roadmap
          </h2>
          <p className="text-stone-500 text-sm mb-4">What&apos;s Next</p>
          <div className="grid gap-3">
            {[
              {
                title: "Production Reliability",
                desc: "Retries, per-form throttling, dashboards for failed calls",
              },
              {
                title: "Analytics & Transcripts",
                desc: "Completion rates, drop-off questions, average call length \u2014 stored in Firestore or BigQuery",
              },
              {
                title: "Multi-Language",
                desc: "Run the same form across different languages for educators and global teams",
              },
              {
                title: "One-Click Deploy",
                desc: "Paste form \u2192 connect Twilio \u2192 deploy in two clicks. Designed for non-technical users.",
              },
            ].map((r) => (
              <div
                key={r.title}
                className="bg-white/70 rounded-xl border border-stone-200 p-3"
              >
                <p className="font-medium text-stone-800 text-sm">{r.title}</p>
                <p className="text-stone-500 text-xs mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hackathon */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Hackathon
          </h2>
          <p className="text-stone-600 text-sm">
            <strong>Category:</strong> Live Agents &mdash; Real-time voice
            interaction using Gemini Live API
          </p>
          <p className="text-stone-500 text-sm mt-1">
            Built for the Gemini Live Agent Challenge 2026, focusing on breaking
            the &ldquo;text box&rdquo; paradigm with immersive, real-time voice
            experiences.
          </p>
        </section>

        {/* Footer */}
        <div className="text-center text-stone-400 text-xs border-t border-stone-200 pt-6">
          <p>Cauliform AI &mdash; Google AI Gemini Live Agent Challenge 2026</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link
              href="/"
              className="text-amber-700 hover:text-amber-900 underline"
            >
              Live Demo
            </Link>
            <a
              href="https://github.com/ShadowEsu/Cauliform-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-900 underline"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
