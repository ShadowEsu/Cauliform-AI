import type { Metadata } from "next";
import { LegalLayout } from "@/components/cauli/LegalLayout";
import "@/styles/cauli.css";

export const metadata: Metadata = {
  title: "Terms of Service — Cauliform",
  description: "Terms of Service for Cauliform voice-powered Google Forms.",
};

const UPDATED = "May 27, 2026";

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="These terms govern your use of Cauliform. By creating an account or using the service, you agree to them."
      updated={UPDATED}
    >
      <h2>1. Who we are</h2>
      <p>
        <strong>Cauliform</strong> (“Cauliform,” “we,” “us,” or “our”) provides a voice-first
        web application that helps you complete public Google Forms by speaking your answers.
        The service is operated by the Cauliform project team. Contact:{" "}
        <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>.
      </p>

      <h2>2. What Cauliform does</h2>
      <p>Cauliform:</p>
      <ul>
        <li>Parses publicly accessible Google Form URLs you provide;</li>
        <li>Conducts a real-time voice conversation powered by Google&apos;s Gemini Live API;</li>
        <li>May pre-fill fields using answers you have saved to your account (“memory”);</li>
        <li>Submits completed responses to the original Google Form on your behalf after you confirm.</li>
      </ul>
      <p>
        Cauliform is an assistive tool. <strong>You remain responsible</strong> for reviewing every
        answer before submission and for the accuracy of information sent to form owners.
      </p>

      <h2>3. Eligibility and accounts</h2>
      <p>
        You must be at least <strong>13 years old</strong> (or the minimum age required in your
        country) to use Cauliform. If you are under 18, you should use the service only with
        permission from a parent or guardian.
      </p>
      <p>
        You sign in with Google or email via our authentication provider (Supabase). You agree to
        provide accurate information and to keep your account credentials secure. You are responsible
        for all activity under your account.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Cauliform to submit false, misleading, or fraudulent information on any form;</li>
        <li>Access forms or data you do not have permission to use;</li>
        <li>Attempt to bypass Google Form access controls, CAPTCHAs, or sign-in requirements;</li>
        <li>Reverse engineer, scrape, or overload our systems or third-party APIs;</li>
        <li>Use the service for unlawful, harassing, or harmful purposes;</li>
        <li>Resell or commercially exploit the service without our written consent.</li>
      </ul>
      <p>
        We may suspend or terminate accounts that violate these rules or that pose a security or
        abuse risk.
      </p>

      <h2>5. Google Forms and third parties</h2>
      <p>
        Google Forms, Google Sign-In, Gemini, and other third-party services have their own terms
        and policies. Your use of those services through Cauliform is also subject to their rules.
        We are not affiliated with Google LLC. Form owners—not Cauliform—control how your
        submitted data is used once it reaches their form.
      </p>

      <h2>6. Voice sessions and submissions</h2>
      <p>
        Microphone access is required for voice sessions. By starting a session, you consent to
        real-time audio processing for that session. You should use Cauliform only in environments
        where you are comfortable being heard and where recording laws allow.
      </p>
      <p>
        Before any automated submission, Cauliform presents a <strong>review step</strong>. Submitting
        without carefully reviewing your answers is at your own risk.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        Cauliform&apos;s name, branding, software, and design are owned by us or our licensors. You
        receive a limited, non-exclusive, revocable license to use the service for personal or
        internal business purposes in accordance with these terms.
      </p>
      <p>
        You retain ownership of the content you provide (your voice responses and form answers). You
        grant us a license to process that content solely to operate and improve the service.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        Cauliform is provided <strong>“as is”</strong> and <strong>“as available.”</strong> We do
        not guarantee that voice recognition will be error-free, that every form type will be
        supported, or that submissions will always succeed. Form layouts, required fields, and
        third-party restrictions may change without notice.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Cauliform and its operators will not be liable for
        indirect, incidental, special, consequential, or punitive damages, or for lost profits,
        data, or opportunities arising from your use of the service.
      </p>
      <p>
        Our total liability for any claim related to the service will not exceed the greater of
        <strong> USD $100</strong> or the amount you paid us in the twelve months before the claim
        (if any). Some jurisdictions do not allow certain limitations; in those cases, our
        liability is limited to the maximum permitted by law.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Cauliform and its operators from claims, damages,
        and expenses (including reasonable legal fees) arising from your misuse of the service,
        your submitted form content, or your violation of these terms or applicable law.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms from time to time. We will post the revised version on this page
        and update the “Last updated” date. Material changes may also be communicated by email or
        in-app notice. Continued use after changes take effect constitutes acceptance.
      </p>

      <h2>12. Termination</h2>
      <p>
        You may stop using Cauliform at any time and may delete your saved memory from Account
        settings. We may suspend or end access for any reason, including inactivity or breach of
        these terms.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These terms are governed by the laws of the <strong>State of California, United States</strong>,
        without regard to conflict-of-law rules. Disputes will be resolved in the state or federal
        courts located in California, unless applicable law requires otherwise.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about these terms, email{" "}
        <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
