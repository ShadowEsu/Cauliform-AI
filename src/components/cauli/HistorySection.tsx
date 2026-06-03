"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { HistoryItem } from "@/lib/cauli-data";
import { HISTORY_GROUP_ORDER } from "@/lib/cauli-data";
import { Icon } from "./icons";

type Props = {
  history: HistoryItem[];
  onNavigate: (id: string) => void;
  onStartSession: (url: string) => void;
};

export function HistorySection({ history, onNavigate, onStartSession }: Props) {
  const [filter, setFilter] = useState<"all" | "ok" | "fail">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return history.filter((h) => {
      if (filter !== "all" && h.status !== filter) return false;
      if (query.trim() && !(h.title + " " + h.url).toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [history, filter, query]);

  const grouped = useMemo(() => {
    const g: Record<string, HistoryItem[]> = {};
    filtered.forEach((h) => {
      (g[h.group] = g[h.group] || []).push(h);
    });
    return g;
  }, [filtered]);

  const totals = {
    all: history.length,
    ok: history.filter((h) => h.status === "ok").length,
    fail: history.filter((h) => h.status === "fail").length,
  };

  if (history.length === 0) {
    return (
      <div className="page-enter">
        <div className="topbar">
          <div className="crumbs">
            <span>Cauliform</span>
            <span className="dot" />
            <span>History</span>
          </div>
        </div>
        <h1 className="display">
          A ledger of <em>conversations.</em>
        </h1>
        <p className="lead">Every form Cauli fills for you will appear here.</p>
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="mini-mascot">
            <Image src="/cauli-mascot.png" alt="" width={56} height={56} />
          </div>
          <h3>No sessions yet.</h3>
          <p>Complete your first voice session and it&apos;ll show up here with the full transcript.</p>
          <button type="button" className="btn-primary" onClick={() => onNavigate("session")}>
            Start a session →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="topbar">
        <div className="crumbs">
          <span>Cauliform</span>
          <span className="dot" />
          <span>History</span>
          <span className="dot" />
          <span style={{ color: "var(--fg-soft)" }}>
            {filtered.length} of {history.length}
          </span>
        </div>
      </div>

      <h1 className="display">
        A ledger of <em>conversations.</em>
      </h1>
      <p className="lead">
        Every form Cauli has filled for you. Tap any row to see the Q&amp;A transcript.
      </p>

      <div className="section-head" style={{ marginTop: 22 }}>
        <div className="filters">
          <button
            type="button"
            className={"filter-chip" + (filter === "all" ? " active" : "")}
            onClick={() => setFilter("all")}
          >
            All <span className="count">· {totals.all}</span>
          </button>
          <button
            type="button"
            className={"filter-chip" + (filter === "ok" ? " active" : "")}
            onClick={() => setFilter("ok")}
          >
            Submitted <span className="count">· {totals.ok}</span>
          </button>
          <button
            type="button"
            className={"filter-chip" + (filter === "fail" ? " active" : "")}
            onClick={() => setFilter("fail")}
          >
            Failed <span className="count">· {totals.fail}</span>
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or URL…"
          className="search-box"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <div className="mini-mascot">
            <Image src="/cauli-mascot.png" alt="" width={56} height={56} />
          </div>
          <h3>Nothing here.</h3>
          <p>No sessions match those filters.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : (
        HISTORY_GROUP_ORDER.filter((g) => grouped[g]).map((g) => (
          <div className="hist-group" key={g}>
            <div className="hist-group-label">
              <span>{g}</span>
              <span style={{ color: "var(--faint)" }}>{grouped[g].length}</span>
              <span className="line" />
            </div>
            <div className="hist-group-list">
              {grouped[g].map((h) => (
                <HistRow
                  key={h.id}
                  h={h}
                  open={openId === h.id}
                  onToggle={() => setOpenId(openId === h.id ? null : h.id)}
                  onRetry={() => onStartSession(h.url)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function HistRow({
  h,
  open,
  onToggle,
  onRetry,
}: {
  h: HistoryItem;
  open: boolean;
  onToggle: () => void;
  onRetry: () => void;
}) {
  return (
    <div className={"hist-row" + (open ? " open" : "")}>
      <button type="button" className="hist-row-main" onClick={onToggle}>
        <div className="hist-left">
          <div className="hist-title">{h.title}</div>
          <div className="hist-sub">{h.url}</div>
        </div>
        <div className="hist-meta">
          <span>{h.when}</span>
          <span>
            {h.duration} · {h.questions}q
          </span>
          <span className={"status " + h.status}>
            <span className="pip" />
            {h.status === "ok" ? "Submitted" : "Failed"}
          </span>
        </div>
        <Icon name="chevD" size={18} />
      </button>
      {open && (
        <div className="hist-detail">
          {h.note && <p className="hist-note">{h.note}</p>}
          {h.qa.length > 0 ? (
            <div className="hist-qa">
              {h.qa.map((qa, i) => (
                <div key={i} className="hist-qa-row">
                  <span className="q">{qa.q}</span>
                  <span className="a">{qa.a}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--mute)", fontSize: 13 }}>No Q&amp;A captured for this session.</p>
          )}
          {h.status === "fail" && (
            <button type="button" className="btn-secondary" onClick={onRetry} style={{ marginTop: 12 }}>
              <Icon name="refresh" size={16} /> Retry session
            </button>
          )}
        </div>
      )}
    </div>
  );
}
