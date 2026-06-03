"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import type { RouteId, UserData } from "@/lib/cauli-data";
import { EMPTY_STATS, NAV, initials } from "@/lib/cauli-data";
import { getLocalUserData, saveLocalSession } from "@/lib/user-data-store";
import { isSupabaseConfigured } from "@/lib/env";
import { Icon } from "./icons";
import { HomeSection } from "./HomeSection";
import { HistorySection } from "./HistorySection";
import { AccountSection } from "./AccountSection";
import { CapabilitiesSection, AboutSection, SupportSection } from "./LearnSections";
import { SessionSection, type SessionState } from "./SessionSection";

export function CauliApp() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [route, setRoute] = useState<RouteId>("home");
  const [session, setSession] = useState<SessionState>({ phase: "idle" });
  const [userData, setUserData] = useState<UserData>({
    history: [],
    stats: EMPTY_STATS,
    savedFields: [],
  });
  const [apiKey, setApiKey] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const res = await fetch("/api/user-data", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as UserData & { source?: string };
        if (data.source === "supabase" || data.source === "supabase-empty" || isSupabaseConfigured()) {
          setUserData({
            history: data.history ?? [],
            stats: data.stats ?? EMPTY_STATS,
            savedFields: data.savedFields ?? [],
          });
          return;
        }
      }
      setUserData(getLocalUserData(user.id));
    } catch {
      setUserData(getLocalUserData(user.id));
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    loadUserData();
  }, [user, loading, router, loadUserData]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/gemini-token")
      .then((r) => r.json())
      .then((d) => {
        if (d.key) setApiKey(d.key);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "") as RouteId;
      if (NAV.some((n) => n.id === h)) setRoute(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const navTo = (id: RouteId) => {
    setRoute(id);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startSession = (url: string) => {
    setSession({ phase: url ? "parsing" : "idle", url, answers: [], transcript: "" });
    navTo("session");
  };

  const handleSubmitted = useCallback(
    async (payload: {
      formUrl: string;
      formTitle: string;
      answers: { q: string; a: string }[];
      status: "ok" | "fail";
      durationSeconds: number;
      questionCount: number;
      note?: string;
    }) => {
      if (!user) return;

      try {
        await fetch("/api/user-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            formUrl: payload.formUrl,
            formTitle: payload.formTitle,
            answers: payload.answers,
            status: payload.status,
            durationSeconds: payload.durationSeconds,
            questionCount: payload.questionCount,
            note: payload.note,
          }),
        });
      } catch {
        saveLocalSession(user.id, payload);
      }

      await loadUserData();
    },
    [user, loadUserData]
  );

  const sessionLive = ["parsing", "speaking", "listening", "confirm", "submitting"].includes(session.phase);

  if (loading || !user) {
    return (
      <div className="login-stage">
        <p style={{ color: "var(--fg-soft)" }}>Loading…</p>
      </div>
    );
  }

  const ini = initials(user);
  const tabNav = NAV.filter((n) => n.tab);
  const sidebarLearn = NAV.filter((n) => n.section === "learn");

  return (
    <div className="app" data-screen-label={`Cauliform / ${route}`}>
      <div className="grid-bg" aria-hidden />
      <div className="glow-bg" aria-hidden />

      <aside className="sidebar">
        <div className="side-brand">
          <div className="mark">
            <Image src="/cauli-mascot.png" alt="" width={44} height={44} />
          </div>
          <div>
            <div className="name">
              Caulif<span className="accent">orm</span>
            </div>
            <span className="tag">voice → forms</span>
          </div>
        </div>
        <div className="nav-section">Workspace</div>
        <nav className="nav">
          {tabNav.map((n) => (
            <button
              key={n.id}
              type="button"
              className={"nav-item" + (route === n.id ? " active" : "")}
              onClick={() => navTo(n.id)}
            >
              <span className="icon">
                <Icon name={n.id as "home"} size={20} />
              </span>
              <span className="label">{n.label}</span>
              {n.id === "session" && sessionLive && <span className="badge">LIVE</span>}
            </button>
          ))}
        </nav>
        <div className="nav-section">Product</div>
        <nav className="nav">
          {sidebarLearn.map((n) => (
            <button
              key={n.id}
              type="button"
              className={"nav-item" + (route === n.id ? " active" : "")}
              onClick={() => navTo(n.id)}
            >
              <span className="icon">
                <Icon name={n.id as "capabilities"} size={20} />
              </span>
              <span className="label">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-footer">
          <div className="side-user" onClick={() => navTo("account")} role="button" tabIndex={0}>
            <div className="avatar">{ini}</div>
            <div className="who">
              <div className="n">{user.name}</div>
              <div className="e">{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        {dataLoading && route === "home" ? (
          <div className="page-enter">
            <p className="lead">Loading your workspace…</p>
          </div>
        ) : (
          <>
            {route === "home" && (
              <HomeSection
                user={user}
                onNavigate={(id) => navTo(id as RouteId)}
                onStartSession={startSession}
                history={userData.history}
                stats={userData.stats}
              />
            )}
            {route === "session" && (
              <SessionSection
                session={session}
                setSession={setSession}
                onBackToHome={() => {
                  setSession({ phase: "idle" });
                  navTo("home");
                }}
                onSubmitted={handleSubmitted}
                apiKey={apiKey}
              />
            )}
            {route === "history" && (
              <HistorySection
                history={userData.history}
                onNavigate={(id) => navTo(id as RouteId)}
                onStartSession={startSession}
              />
            )}
            {route === "account" && (
              <AccountSection
                user={user}
                savedFields={userData.savedFields}
                onSignOut={async () => {
                  await logout();
                  router.replace("/login");
                }}
                onNavigate={(id) => navTo(id as RouteId)}
              />
            )}
            {route === "capabilities" && <CapabilitiesSection />}
            {route === "about" && <AboutSection />}
            {route === "support" && <SupportSection />}
          </>
        )}
      </main>

      <nav className="tabbar" aria-label="Main navigation">
        {tabNav.map((n) => (
          <button
            key={n.id}
            type="button"
            className={
              "tab" +
              (route === n.id ? " active" : "") +
              (n.id === "session" && sessionLive ? " session-live" : "")
            }
            onClick={() => navTo(n.id)}
            aria-label={n.label}
            aria-current={route === n.id ? "page" : undefined}
          >
            <span className="live-glow" />
            <span className="live-dot" />
            <span className="icon">
              <Icon name={n.id as "home"} size={22} />
            </span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
