"use client";

import { useState } from "react";
import Image from "next/image";
import type { AppUser, HistoryItem, UserStats } from "@/lib/cauli-data";
import { EXAMPLE_CHIPS, firstName } from "@/lib/cauli-data";

type Props = {
  user: AppUser;
  onNavigate: (id: string) => void;
  onStartSession: (url: string) => void;
  history: HistoryItem[];
  stats: UserStats;
};

export function HomeSection({ user, onNavigate, onStartSession, history, stats }: Props) {
  const [url, setUrl] = useState("");
  const hasHistory = history.length > 0;
  const lastForm = history[0];
  const fname = firstName(user);
  const hour = new Date().getHours();
  const tod =
    hour < 5 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const todCopy: Record<string, string> = {
    morning: "What's on your plate today?",
    afternoon: "Let's knock one out.",
    evening: "One more form before you're done?",
    night: "Still at it? Cauli's got you.",
  };

  const startWithUrl = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) return;
    onStartSession(url.trim());
  };

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="crumbs">
          <span>Cauliform</span>
          <span className="dot" />
          <span>Home</span>
        </div>
        <div className="status-pill">
          <span className="pip" /> All systems normal
        </div>
      </div>

      <h1 className="display">
        Hi, <span className="accent">{fname}</span> <span className="wave-emoji">👋</span>
        <br />
        {hasHistory ? (
          <>
            Ready to <em>talk</em> a form in?
          </>
        ) : (
          <>
            Let&apos;s <em>save</em> you some typing.
          </>
        )}
      </h1>
      <p className="lead">
        {hasHistory
          ? todCopy[tod]
          : "Paste any public Google Form link. Cauli reads it aloud, listens to your answers, and submits when you confirm."}
      </p>

      <div className="home-hero">
        {hasHistory && lastForm && (
          <div className="quick-restart" onClick={() => onStartSession(lastForm.url)} role="button" tabIndex={0}>
            <div className="qr-label">Quick restart</div>
            <div className="qr-title">{lastForm.title}</div>
            <div className="qr-sub">{lastForm.url}</div>
            <div className="qr-row">
              <div className="qr-meta">
                {lastForm.when} · {lastForm.questions} questions
              </div>
              <button type="button" className="qr-btn">
                Re-open →
              </button>
            </div>
          </div>
        )}

        {!hasHistory ? (
          <div className="new-hero-card">
            <div className="mascot-mini">
              <Image src="/cauli-mascot.png" alt="" width={48} height={48} />
            </div>
            <h3>Try Cauli in 30 seconds.</h3>
            <p>Paste a Google Form URL below or tap Session to get started.</p>
            <form className="url-block" onSubmit={startWithUrl} style={{ marginTop: 16 }}>
              <div className="url-row">
                <span className="prefix">https://</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="docs.google.com/forms/d/…"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button type="submit" className="go" disabled={!url.trim()}>
                  Start <span className="arr">→</span>
                </button>
              </div>
            </form>
            <div className="demo-chip-row" style={{ marginTop: 12 }}>
              {EXAMPLE_CHIPS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="demo-chip"
                  onClick={() => onNavigate("session")}
                >
                  <span className="demo-chip-emo">{c.emo}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form className="url-block" onSubmit={startWithUrl}>
            <div className="url-block-hd">
              <span className="kicker">Paste form URL</span>
              <span className="kicker" style={{ color: "var(--faint)" }}>
                step 1 of 3
              </span>
            </div>
            <div className="url-row">
              <span className="prefix">https://</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="docs.google.com/forms/d/…"
                spellCheck={false}
                autoComplete="off"
              />
              <button type="submit" className="go" disabled={!url.trim()}>
                Start session <span className="arr">→</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="impact-card">
        <div className="impact-label">
          <span>Your Cauli impact</span>
          <span style={{ color: "var(--accent)" }}>✦</span>
        </div>
        <h2 className="impact-headline">
          {stats.filled > 0 ? (
            <>
              You&apos;ve saved{" "}
              <span className="num">
                {stats.hrs}h {stats.mins}m
              </span>{" "}
              {stats.hrs >= 8 ? "— that's a full workday." : "of typing so far."}
            </>
          ) : (
            <>
              You&apos;ve saved <span className="num">0h 0m</span> — your first form starts here.
            </>
          )}
        </h2>
        <p className="impact-sub">
          {stats.filled > 0
            ? `Across ${stats.filled} forms. Roughly ${Math.round(stats.filled * 2.4)} fewer dropdowns clicked.`
            : "Complete a session and your stats will show up here."}
        </p>
        <div className="impact-meter-row">
          <div className="imc">
            <div className="v">{stats.filled}</div>
            <div className="k">Forms filled</div>
          </div>
          <div className="imc">
            <div className="v">{stats.rate}%</div>
            <div className="k">Success rate</div>
          </div>
          <div className="imc">
            <div className="v">
              {stats.avgM}m {String(stats.avgS).padStart(2, "0")}s
            </div>
            <div className="k">Avg. session</div>
          </div>
        </div>
      </div>

      {hasHistory && (
        <>
          <div className="section-head">
            <h2 className="section">Recent activity</h2>
            <button type="button" className="link-btn" onClick={() => onNavigate("history")}>
              View all →
            </button>
          </div>
          <div className="activity-list">
            {history.slice(0, 4).map((h) => (
              <div className="act-row" key={h.id} onClick={() => onNavigate("history")} role="button" tabIndex={0}>
                <div>
                  <div className="act-title">{h.title}</div>
                  <div className="act-sub">{h.url}</div>
                </div>
                <div className="act-when">{h.when}</div>
                <div className="act-dur">
                  {h.duration} · {h.questions}q
                </div>
                <div>
                  <StatusPill status={h.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "ok" | "fail" }) {
  if (status === "ok")
    return (
      <span className="status ok">
        <span className="pip" />
        Submitted
      </span>
    );
  return (
    <span className="status fail">
      <span className="pip" />
      Failed
    </span>
  );
}
