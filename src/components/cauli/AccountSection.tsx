"use client";

import { useState } from "react";
import type { AppUser } from "@/lib/cauli-data";
import { ACCOUNT_TABS, initials } from "@/lib/cauli-data";
import { GoogleG, Icon } from "./icons";

type Props = {
  user: AppUser;
  savedFields: { k: string; v: string; tag: string }[];
  onSignOut: () => void;
  onNavigate: (id: string) => void;
};

export function AccountSection({ user, savedFields, onSignOut, onNavigate }: Props) {
  const [tab, setTab] = useState<string>("profile");

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="crumbs">
          <span>Cauliform</span>
          <span className="dot" />
          <span>Account</span>
          <span className="dot" />
          <span style={{ color: "var(--fg-soft)" }}>{tab}</span>
        </div>
      </div>

      <h1 className="display">
        Your <em>account.</em>
      </h1>
      <p className="lead">
        Settings, saved memory, voice preferences, and your plan. Everything Cauli knows is here.
      </p>

      <div className="account-shell">
        <aside className="acct-nav">
          {ACCOUNT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"acct-tab" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              <span>{t.label}</span>
              <span className="caret">→</span>
            </button>
          ))}
          <button type="button" className="acct-tab danger" onClick={onSignOut}>
            <span>Sign out</span>
            <span className="caret">↗</span>
          </button>
        </aside>

        <div className="acct-pane">
          {tab === "profile" && <AcctProfile user={user} />}
          {tab === "memory" && <AcctMemory savedFields={savedFields} />}
          {tab === "voice" && <AcctVoice />}
          {tab === "notifs" && <AcctNotifs />}
          {tab === "privacy" && <AcctPrivacy />}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div className="kicker">Learn more</div>
        <div className="learn-grid">
          <button type="button" className="learn-card" onClick={() => onNavigate("capabilities")}>
            <span className="kicker">03</span>
            <span className="lc-title">Capabilities</span>
            <span className="lc-sub">What Cauli can do, end to end.</span>
            <span className="lc-arrow">Read →</span>
          </button>
          <button type="button" className="learn-card" onClick={() => onNavigate("about")}>
            <span className="kicker">04</span>
            <span className="lc-title">About</span>
            <span className="lc-sub">Why we built it &amp; our principles.</span>
            <span className="lc-arrow">Read →</span>
          </button>
          <button type="button" className="learn-card" onClick={() => onNavigate("support")}>
            <span className="kicker">05</span>
            <span className="lc-title">Support</span>
            <span className="lc-sub">FAQs and how to reach us.</span>
            <span className="lc-arrow">Read →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PaneCard({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pane-card">
      <div className="pane-card-hd">
        <div>
          <h3>{title}</h3>
          {sub && <p className="pane-sub">{sub}</p>}
        </div>
      </div>
      <div className="pane-card-bd">{children}</div>
    </div>
  );
}

function AcctProfile({ user }: { user: AppUser }) {
  const ini = initials(user);
  const joined = new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" });
  return (
    <PaneCard title="Profile" sub="How Cauli addresses you and where we email session summaries.">
      <div className="profile-row">
        <div className="big-avatar">{ini}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="big-name">{user.name}</div>
          <div className="big-email">{user.email}</div>
          <div className="profile-tags">
            <span className="chip-mini">
              <span className="dot-ok" /> Verified
            </span>
            <span className="chip-mini">Joined {joined}</span>
          </div>
        </div>
      </div>
      <Field label="Display name" value={user.name} />
      <Field label="Email" value={user.email} hint="primary" />
    </PaneCard>
  );
}

function AcctMemory({ savedFields }: { savedFields: { k: string; v: string; tag: string }[] }) {
  return (
    <PaneCard title="Saved memory" sub="Answers Cauli remembers from past sessions.">
      {savedFields.length === 0 ? (
        <p style={{ color: "var(--fg-soft)", fontSize: 14, margin: 0 }}>
          No saved fields yet. Complete a form session and common answers like your name or email will appear here.
        </p>
      ) : (
        <div className="memory-grid">
          {savedFields.map((f) => (
            <div key={f.k} className="mem-field">
              <div className="mem-k">{f.k}</div>
              <div className="mem-v">{f.v}</div>
              <div className="mem-tag">{f.tag}</div>
            </div>
          ))}
        </div>
      )}
    </PaneCard>
  );
}

function AcctVoice() {
  return (
    <PaneCard title="Voice preferences" sub="How Cauli speaks and listens.">
      <Toggle label="Read questions aloud" desc="Cauli speaks each question before listening." defaultOn />
      <Toggle label="Confirm before submit" desc="Review all answers before the browser agent submits." defaultOn />
    </PaneCard>
  );
}

function AcctNotifs() {
  return (
    <PaneCard title="Notifications" sub="Email summaries after each session.">
      <Toggle label="Session summary email" desc="Get a recap when a form is submitted." defaultOn={false} />
    </PaneCard>
  );
}

function AcctPrivacy() {
  return (
    <PaneCard title="Privacy & data" sub="Your data stays yours.">
      <p style={{ color: "var(--fg-soft)", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>
        Voice audio is not stored. Only form answers you confirm are saved to your account history.
        Read our full{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-deep)" }}>
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-deep)" }}>
          Terms of Service
        </a>
        .
      </p>
      <button type="button" className="ghost-btn danger">
        Delete all saved memory
      </button>
    </PaneCard>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="field-row">
      <div className="field-label">{label}</div>
      <div className="field-value">
        <span>{value}</span>
        {hint && (
          <span style={{ color: "var(--mute)", fontSize: 12, marginLeft: 8, fontWeight: 400 }}>{hint}</span>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  defaultOn = true,
}: {
  label: string;
  desc?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {desc && <div className="toggle-desc">{desc}</div>}
      </div>
      <button
        type="button"
        className={"toggle" + (on ? " on" : "")}
        onClick={() => setOn(!on)}
        role="switch"
        aria-checked={on}
      >
        <span className="knob" />
      </button>
    </div>
  );
}
