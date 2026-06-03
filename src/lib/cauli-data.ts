export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: "google" | "email";
};

export type SessionAnswer = { q: string; a: string };

export type HistoryItem = {
  id: string;
  title: string;
  url: string;
  when: string;
  group: string;
  duration: string;
  questions: number;
  status: "ok" | "fail";
  note?: string;
  qa: SessionAnswer[];
};

export type UserStats = {
  filled: number;
  hrs: number;
  mins: number;
  rate: number;
  avgM: number;
  avgS: number;
};

export const EMPTY_STATS: UserStats = {
  filled: 0,
  hrs: 0,
  mins: 0,
  rate: 0,
  avgM: 0,
  avgS: 0,
};

export type UserData = {
  history: HistoryItem[];
  stats: UserStats;
  savedFields: { k: string; v: string; tag: string }[];
};

export function displayName(user: Pick<AppUser, "name" | "email">): string {
  const n = user.name?.trim();
  if (n) return n;
  const local = user.email.split("@")[0] ?? "there";
  return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function firstName(user: Pick<AppUser, "name" | "email">): string {
  return displayName(user).split(" ")[0] ?? "there";
}

export function initials(user: Pick<AppUser, "name" | "email">): string {
  return displayName(user)
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatWhen(d: Date): { when: string; group: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (d >= startOfToday) return { when: `Today, ${time}`, group: "Today" };
  if (d >= startOfYesterday) return { when: `Yesterday, ${time}`, group: "Yesterday" };
  if (d >= startOfWeek) {
    return {
      when: d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      group: "This week",
    };
  }
  return {
    when: d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    group: "Earlier",
  };
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function computeStats(
  sessions: { status: string; duration_seconds?: number | null }[]
): UserStats {
  if (sessions.length === 0) return { ...EMPTY_STATS };
  const ok = sessions.filter((s) => s.status === "ok");
  const totalSec = ok.reduce((acc, s) => acc + (s.duration_seconds ?? 0), 0);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const avgSec = ok.length ? Math.round(totalSec / ok.length) : 0;
  return {
    filled: ok.length,
    hrs,
    mins,
    rate: sessions.length ? Math.round((ok.length / sessions.length) * 100) : 0,
    avgM: Math.floor(avgSec / 60),
    avgS: avgSec % 60,
  };
}

export function rowToHistory(row: {
  id: string;
  form_url: string;
  form_title: string;
  answers: SessionAnswer[] | null;
  status: string;
  duration_seconds?: number | null;
  question_count?: number | null;
  note?: string | null;
  created_at: string;
}): HistoryItem {
  const created = new Date(row.created_at);
  const { when, group } = formatWhen(created);
  const shortUrl = row.form_url.replace(/^https?:\/\//, "").slice(0, 48);
  return {
    id: row.id,
    title: row.form_title,
    url: shortUrl + (row.form_url.length > 48 ? "…" : ""),
    when,
    group,
    duration: formatDuration(row.duration_seconds),
    questions: row.question_count ?? row.answers?.length ?? 0,
    status: row.status === "ok" ? "ok" : "fail",
    note: row.note ?? undefined,
    qa: Array.isArray(row.answers) ? row.answers : [],
  };
}

export const HISTORY_GROUP_ORDER = ["Today", "Yesterday", "This week", "Earlier"];

export const NAV = [
  { id: "home", num: "01", label: "Home", section: "main", tab: true },
  { id: "session", num: "02", label: "Session", section: "main", tab: true },
  { id: "history", num: "03", label: "History", section: "main", tab: true },
  { id: "account", num: "04", label: "Account", section: "main", tab: true },
  { id: "capabilities", num: "05", label: "Capabilities", section: "learn", tab: false },
  { id: "about", num: "06", label: "About", section: "learn", tab: false },
  { id: "support", num: "07", label: "Support", section: "learn", tab: false },
] as const;

export type RouteId = (typeof NAV)[number]["id"];

export const ACCOUNT_TABS = [
  { id: "profile", label: "Profile" },
  { id: "memory", label: "Memory" },
  { id: "voice", label: "Voice" },
  { id: "notifs", label: "Notifications" },
  { id: "privacy", label: "Privacy & data" },
] as const;

export const EXAMPLE_CHIPS = [
  { emo: "🎟️", label: "Event RSVP" },
  { emo: "🛠️", label: "Hackathon submission" },
  { emo: "🎓", label: "Class feedback" },
  { emo: "🍕", label: "Dietary survey" },
];

export const CAPABILITIES = [
  {
    glyph: "✦",
    title: "Parse any public Google Form",
    body: "Cauli scrapes the form page and pulls out the title, every question, every option, and which fields are required.",
    tags: ["parse", "schema", "required-aware"],
  },
  {
    glyph: "◐",
    title: "Real-time voice Q&A",
    body: "Your mic streams to Gemini Live. Cauli reads each question aloud, listens for your answer, and re-asks anything it didn't catch.",
    tags: ["gemini-live", "barge-in", "low-latency"],
  },
  {
    glyph: "◇",
    title: "Confirm, then auto-submit",
    body: "After the last question, Cauli summarizes everything captured and waits for your okay before submitting.",
    tags: ["review-step", "agent", "sse-events"],
  },
  {
    glyph: "❍",
    title: "Saved memory",
    body: "Cauli remembers answers you give most often — name, email, school — and pre-fills them on future forms.",
    tags: ["opt-in", "profile-prefill"],
  },
  {
    glyph: "◈",
    title: "Live submission trace",
    body: "Watch the browser agent move through your form — fields filling, dropdowns opening, the submit click.",
    tags: ["sse", "step-trace", "debuggable"],
  },
  {
    glyph: "◉",
    title: "Works hands-free",
    body: "Designed for moments you can't type — driving home, walking between classes, hands wet from cooking.",
    tags: ["accessibility", "voice-first"],
  },
];

export const FAQS = [
  {
    q: "What kinds of Google Forms can Cauli fill out?",
    a: "Any public form — meaning anyone with the link can submit. Forms restricted to a specific Google Workspace are flagged before the session starts.",
  },
  {
    q: "Where does my voice go? Is it stored?",
    a: "Audio streams directly to Gemini Live for the duration of the session and is not retained by Cauliform. Transcripts are stored in your account only when you complete a session.",
  },
  {
    q: "What happens if Cauli mishears me?",
    a: "The review step at the end reads every captured answer back before submitting. You can also interrupt during the session.",
  },
  {
    q: "Can I use Cauliform offline?",
    a: "No — Cauli needs the network for the voice model and the browser agent that does the submitting.",
  },
];

export const PRINCIPLES = [
  { n: "01", h: "Voice as the primary surface", b: "Forms are the friction tax of being a citizen, a student, an employee. Voice removes that tax." },
  { n: "02", h: "Show, don't summarize", b: "When the agent submits on your behalf, you see the steps. Transparency beats a green checkmark." },
  { n: "03", h: "Memory only if you ask", b: "You can wipe saved memory from Account settings at any time." },
];
