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
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo-clean.png"
            alt="Cauli"
            width={100}
            height={100}
            className="mb-2"
          />
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">
            Cauli
          </h1>
          <p className="text-stone-500 mt-1">
            Fill out any Google Form with your voice
          </p>
          <Link
            href="/experience"
            className="mt-4 px-5 py-2 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 transition"
          >
            Try it now
          </Link>
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

        {/* Problem */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            The Problem
          </h2>
          <p className="text-stone-600 leading-relaxed">
            Google Forms are everywhere &mdash; surveys, event registrations,
            feedback forms, applications. Yet filling them out requires your full
            attention: you need to stop what you&apos;re doing, pull out your
            device, and manually type responses. This creates friction that leads
            to abandoned forms, incomplete responses, and missed opportunities.
          </p>
          <p className="text-stone-600 leading-relaxed mt-2">
            For users with disabilities, limited mobility, or those constantly on
            the move, traditional form-filling is even more challenging.
          </p>
        </section>

        {/* Solution */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            The Solution
          </h2>
          <p className="text-stone-600 leading-relaxed mb-4">
            Cauli leverages Google&apos;s{" "}
            <strong>Gemini Live API</strong> to create a real-time voice agent
            that fills out forms conversationally:
          </p>
          <ol className="space-y-2 text-stone-600">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>
                <strong>Parses</strong> any Google Form link you provide
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                <strong>Asks</strong> each question conversationally via voice
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>
                <strong>Confirms</strong> your responses before submission
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>
                <strong>Submits</strong> the form automatically via an AI browser
                agent
              </span>
            </li>
          </ol>
        </section>

        {/* Key Features */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Key Features
          </h2>
          <div className="grid gap-3">
            {[
              {
                title: "Voice-First Experience",
                desc: "Natural conversational interface powered by Gemini Live API",
              },
              {
                title: "Real-Time Interaction",
                desc: "Handles interruptions gracefully, just like talking to a human",
              },
              {
                title: "Smart Profile Memory",
                desc: "Remembers common responses (name, email, etc.) across forms",
              },
              {
                title: "Multi-Format Support",
                desc: "Text, multiple choice, checkboxes, dropdowns, and more",
              },
              {
                title: "Confirmation Flow",
                desc: "Reviews all responses before final submission",
              },
              {
                title: "Accessibility-First",
                desc: "Designed for users who prefer or require voice interaction",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white/70 rounded-xl border border-stone-200 p-3"
              >
                <p className="font-medium text-stone-800 text-sm">{f.title}</p>
                <p className="text-stone-500 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Technology Stack
          </h2>
          <div className="bg-white/70 rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["AI / Voice", "Gemini 2.5 Flash Native Audio (Live API)"],
                  ["Frontend", "Next.js, React, TypeScript, Tailwind CSS"],
                  ["Backend", "Next.js API Routes, Vercel"],
                  ["Form Submission", "AI Browser Agent"],
                  ["Database", "Firebase Firestore"],
                  ["Audio", "WebSocket, PCM 16kHz / 24kHz"],
                  ["Tools", "Function Calling (submit_form)"],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-2 text-stone-500 font-medium w-1/3">
                      {k}
                    </td>
                    <td className="px-4 py-2 text-stone-700">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            How It Works
          </h2>
          <div className="bg-stone-900 rounded-xl p-4 font-mono text-xs text-stone-400 space-y-1 leading-relaxed">
            <p className="text-stone-500">// Architecture</p>
            <p>
              <span className="text-amber-400">Browser</span> captures mic audio
              (16kHz PCM)
            </p>
            <p>
              &rarr; streams via <span className="text-amber-400">WebSocket</span>{" "}
              to Gemini Live API
            </p>
            <p>
              &rarr; <span className="text-amber-400">Gemini</span> responds with
              voice (24kHz PCM) + text
            </p>
            <p>
              &rarr; asks form questions{" "}
              <span className="text-amber-400">conversationally</span>
            </p>
            <p>
              &rarr; on confirmation, calls{" "}
              <span className="text-green-400">submit_form</span> tool
            </p>
            <p>
              &rarr; <span className="text-amber-400">AI browser agent</span>{" "}
              fills &amp; submits Google Form
            </p>
            <p>
              &rarr; live browser view shows agent in{" "}
              <span className="text-green-400">action</span>
            </p>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">
            Use Cases
          </h2>
          <div className="space-y-2 text-stone-600 text-sm">
            <p>
              <strong>Students</strong> &mdash; Register for events, complete
              surveys, submit feedback while walking to class
            </p>
            <p>
              <strong>Professionals</strong> &mdash; Fill out expense reports, HR
              forms, or client surveys during commute
            </p>
            <p>
              <strong>Accessibility</strong> &mdash; Voice-first interface for
              users with visual impairments or motor difficulties
            </p>
            <p>
              <strong>Busy Parents</strong> &mdash; Complete school forms, medical
              questionnaires hands-free
            </p>
            <p>
              <strong>Field Workers</strong> &mdash; Submit reports and checklists
              without stopping work
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-3">Team</h2>
          <div className="grid gap-3">
            {[
              {
                name: "Preston",
                role: "Full Stack Developer",
                bg: "Web apps, front-end, minimal design",
              },
{
                name: "Chinat Yu",
                role: "Full Stack Developer",
                bg: "Hackathon winner (TreeHacks), experienced builder",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="bg-white/70 rounded-xl border border-stone-200 p-3"
              >
                <p className="font-medium text-stone-800 text-sm">{t.name}</p>
                <p className="text-amber-700 text-xs">{t.role}</p>
                <p className="text-stone-500 text-xs mt-0.5">{t.bg}</p>
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
            Built for the Gemini Live Agent Challenge, focusing on breaking the
            &ldquo;text box&rdquo; paradigm with immersive, real-time voice
            experiences.
          </p>
        </section>

        {/* Footer */}
        <div className="text-center text-stone-400 text-xs border-t border-stone-200 pt-6">
          <p>Powered by Gemini Live API</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link
              href="/experience"
              className="text-amber-700 hover:text-amber-900 underline"
            >
              Try Cauli
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
