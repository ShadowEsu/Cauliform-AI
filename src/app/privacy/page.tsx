import type { Metadata } from "next";
import { LegalLayout } from "@/components/cauli/LegalLayout";
import "@/styles/cauli.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Cauliform",
  description: "How Cauliform collects, uses, and protects your information.",
};

const UPDATED = "May 27, 2026";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="We built Cauliform to reduce form friction—not to build a profile of you you didn't ask for. This policy explains what we collect and why."
      updated={UPDATED}
    >
      <h2>1. Overview</h2>
      <p>
        This Privacy Policy describes how <strong>Cauliform</strong> (“we,” “us”) handles
        information when you use our website and voice form-filling service. It applies to data
        collected through <strong>cauliform.app</strong> and related deployments (including
        Firebase-hosted builds).
      </p>
      <p>
        Questions? Contact{" "}
        <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>.
      </p>

      <h2>2. Information we collect</h2>

      <h3>Account information</h3>
      <p>When you sign in (Google or email magic link), we receive and store:</p>
      <ul>
        <li>Email address;</li>
        <li>Display name and profile photo (if provided by your sign-in provider);</li>
        <li>A unique account identifier from our auth provider (Supabase).</li>
      </ul>

      <h3>Session and form data</h3>
      <p>When you use Cauliform, we may store:</p>
      <ul>
        <li>Google Form URLs you submit;</li>
        <li>Form titles and parsed question metadata;</li>
        <li>Text transcripts and confirmed answers from your sessions;</li>
        <li>Submission status (success or failure), duration, and timestamps;</li>
        <li>Optional saved “memory” fields (e.g., name, email) you choose to reuse across forms.</li>
      </ul>

      <h3>Voice audio</h3>
      <p>
        <strong>We do not store raw voice recordings</strong> on Cauliform servers after your session
        ends. Audio is streamed in real time to <strong>Google Gemini Live</strong> for speech
        understanding and response generation. Google&apos;s processing is subject to{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&apos;s Privacy Policy
        </a>
        .
      </p>

      <h3>Technical data</h3>
      <p>We automatically collect limited technical information, such as:</p>
      <ul>
        <li>Browser type, device type, and general usage logs;</li>
        <li>IP address (may be processed by our hosting and auth providers);</li>
        <li>Cookies or similar tokens required for authentication and session security.</li>
      </ul>

      <h2>3. How we use information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Authenticate you and maintain your account;</li>
        <li>Run voice form sessions and submit answers you confirm;</li>
        <li>Show your history, stats, and saved memory in the app;</li>
        <li>Improve reliability, security, and product experience;</li>
        <li>Respond to support requests and legal obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell your personal information. We do not use your data for
        third-party advertising.
      </p>

      <h2>4. Legal bases (EEA/UK users)</h2>
      <p>If you are in the European Economic Area or UK, we process personal data based on:</p>
      <ul>
        <li><strong>Contract</strong> — to provide the service you requested;</li>
        <li><strong>Consent</strong> — where required (e.g., microphone access in your browser);</li>
        <li><strong>Legitimate interests</strong> — security, fraud prevention, and product improvement, balanced against your rights.</li>
      </ul>

      <h2>5. How we share information</h2>
      <p>We share data only with service providers that help us operate Cauliform, including:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and database hosting (
          <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          );
        </li>
        <li>
          <strong>Google (Gemini Live)</strong> — real-time voice AI processing;
        </li>
        <li>
          <strong>Google / Firebase</strong> — application hosting and infrastructure (where deployed);
        </li>
        <li>
          <strong>Form submission automation</strong> — when you confirm, an automated browser agent may
          fill and submit the target Google Form (processing is limited to that submission);
        </li>
        <li>
          <strong>Twilio</strong> (optional) — only if you use phone-based call features, when enabled.
        </li>
      </ul>
      <p>
        We may also disclose information if required by law, to protect rights and safety, or in
        connection with a merger or acquisition (with notice where required).
      </p>

      <h2>6. Data retention</h2>
      <ul>
        <li>
          <strong>Account data</strong> — kept while your account is active. You may request deletion
          by contacting us.
        </li>
        <li>
          <strong>Session history and memory</strong> — stored until you delete them from Account
          settings or delete your account.
        </li>
        <li>
          <strong>Server logs</strong> — typically retained for a limited period (e.g., 30–90 days)
          for security and debugging.
        </li>
        <li>
          <strong>Voice audio</strong> — not retained by Cauliform after the live session ends.
        </li>
      </ul>

      <h2>7. Your choices and rights</h2>
      <p>Depending on where you live, you may have the right to:</p>
      <ul>
        <li>Access, correct, or delete personal data we hold about you;</li>
        <li>Export your data in a portable format;</li>
        <li>Object to or restrict certain processing;</li>
        <li>Withdraw consent where processing is consent-based;</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        In the app, you can clear saved memory from <strong>Account → Privacy &amp; data</strong>.
        To delete your account or request a full data export, email{" "}
        <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>.
      </p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard measures including HTTPS, authenticated API routes, and
        row-level security on user data in our database. No method of transmission or storage is
        100% secure; we cannot guarantee absolute security.
      </p>

      <h2>9. Children&apos;s privacy</h2>
      <p>
        Cauliform is not directed at children under 13. We do not knowingly collect personal
        information from children under 13. If you believe a child has provided us data, contact us
        and we will delete it promptly.
      </p>

      <h2>10. International transfers</h2>
      <p>
        Our service providers may process data in the United States and other countries. Where
        required, we rely on appropriate safeguards (such as standard contractual clauses) for
        cross-border transfers.
      </p>

      <h2>11. California privacy rights (CCPA/CPRA)</h2>
      <p>
        California residents may request to know, delete, or correct personal information, and to
        opt out of “sale” or “sharing” (we do not sell personal information). Submit requests to{" "}
        <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>. We will not
        discriminate against you for exercising these rights.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The “Last updated” date at the top will change,
        and material updates may be communicated in the app or by email. Please review this page
        periodically.
      </p>

      <h2>13. Contact</h2>
      <p>
        <strong>Cauliform</strong>
        <br />
        Email:{" "}
        <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>
      </p>
    </LegalLayout>
  );
}
