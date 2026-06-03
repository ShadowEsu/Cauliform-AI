"use client";

import { CAPABILITIES, FAQS, PRINCIPLES } from "@/lib/cauli-data";

export function CapabilitiesSection() {
  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="crumbs">
          <span>Cauliform</span>
          <span className="dot" />
          <span>Capabilities</span>
        </div>
      </div>
      <h1 className="display">
        What Cauli <em>does.</em>
      </h1>
      <p className="lead">End-to-end voice form filling — parse, talk, confirm, submit.</p>
      <div className="cap-grid">
        {CAPABILITIES.map((c) => (
          <div key={c.title} className="cap-card">
            <span className="cap-glyph">{c.glyph}</span>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <div className="cap-tags">
              {c.tags.map((t) => (
                <span key={t} className="cap-tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutSection() {
  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="crumbs">
          <span>Cauliform</span>
          <span className="dot" />
          <span>About</span>
        </div>
      </div>
      <h1 className="display">
        Built for <em>hands-free</em> life.
      </h1>
      <p className="lead">
        Cauliform turns Google Forms into voice conversations powered by Gemini Live.
      </p>
      <div className="principles">
        {PRINCIPLES.map((p) => (
          <div key={p.n} className="principle">
            <span className="principle-n">{p.n}</span>
            <h3>{p.h}</h3>
            <p>{p.b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupportSection() {
  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="crumbs">
          <span>Cauliform</span>
          <span className="dot" />
          <span>Support</span>
        </div>
      </div>
      <h1 className="display">
        Questions? <em>Answers.</em>
      </h1>
      <p className="lead">
        Reach us at{" "}
        <a href="mailto:prestonjaysusanto@gmail.com" style={{ color: "var(--accent)" }}>
          prestonjaysusanto@gmail.com
        </a>
      </p>
      <div className="faq-list">
        {FAQS.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
