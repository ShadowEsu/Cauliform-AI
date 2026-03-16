"use client";

export default function HelpPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-6 animate-fade-up">
      <div className="text-lg font-semibold text-white">How Cauliform works</div>
      <p className="mt-1 text-sm text-zinc-400">
        A quick guide to running AI-powered phone surveys.
      </p>

      <ol className="mt-5 space-y-3 text-sm text-zinc-300 list-decimal list-inside">
        <li>
          <span className="font-semibold text-white">Paste a Google Form URL</span> on
          the <span className="font-semibold">New call</span> page. We parse the form
          structure and show you the title and question count.
        </li>
        <li>
          <span className="font-semibold text-white">Enter your phone number.</span>{" "}
          Twilio will call this number when the session starts.
        </li>
        <li>
          <span className="font-semibold text-white">Answer the call.</span> The agent
          will read each question and listen to your spoken answer using Gemini and
          Twilio speech recognition.
        </li>
        <li>
          <span className="font-semibold text-white">Confirm your responses.</span> For
          important fields, the agent can repeat back what it heard and ask you to
          confirm.
        </li>
        <li>
          <span className="font-semibold text-white">Submit & review.</span> Once the
          form is completed, Cauliform submits it back to Google Forms and records a
          session entry in your dashboard.
        </li>
      </ol>

      <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950/40 p-4 text-xs text-zinc-400 space-y-2">
        <p>
          <span className="font-semibold text-zinc-200">Tips for reliable calls:</span>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use an E.164 formatted phone number (e.g. +1 415 555 0123).</li>
          <li>Ensure <code className="font-mono">TWILIO_PHONE_NUMBER</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_APP_URL</code> are set correctly in
            your environment or Cloud Run.</li>
          <li>Test the <code className="font-mono">/api/health</code> and{" "}
            <code className="font-mono">/api/webhook</code> endpoints before a live demo.</li>
        </ul>
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Need help? Email{" "}
        <a
          href="mailto:prestonjaysusanto@gmail.com"
          className="text-rose-300 hover:text-rose-200"
        >
          prestonjaysusanto@gmail.com
        </a>
        .
      </p>
    </div>
  );
}

