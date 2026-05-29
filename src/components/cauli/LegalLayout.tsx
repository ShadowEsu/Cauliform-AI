import Image from "next/image";
import Link from "next/link";

export function LegalLayout({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-stage">
      <div className="grid-bg" aria-hidden />
      <div className="glow-bg" aria-hidden />

      <header className="legal-header">
        <Link href="/login" className="legal-back">
          ← Back
        </Link>
        <Link href="/login" className="legal-brand">
          <Image src="/cauli-mascot.png" alt="" width={36} height={36} />
          <span>
            Caulif<span className="accent">orm</span>
          </span>
        </Link>
      </header>

      <article className="legal-doc">
        <p className="legal-updated">Last updated: {updated}</p>
        <h1 className="legal-title">{title}</h1>
        {subtitle && <p className="legal-subtitle">{subtitle}</p>}
        <div className="legal-body">{children}</div>
        <footer className="legal-footer">
          <p>
            Questions?{" "}
            <a href="mailto:prestonjaysusanto@gmail.com">prestonjaysusanto@gmail.com</a>
          </p>
          <p className="legal-footer-links">
            <Link href="/terms">Terms of Service</Link>
            <span className="dot" />
            <Link href="/privacy">Privacy Policy</Link>
            <span className="dot" />
            <Link href="/login">Sign in</Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
