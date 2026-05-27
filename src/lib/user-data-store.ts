import type { SessionAnswer, UserData, UserStats } from "@/lib/cauli-data";
import { computeStats, rowToHistory } from "@/lib/cauli-data";
import { createAdminClient } from "@/lib/supabase/admin";

const LOCAL_KEY = "cauliform.userData.v1";

type LocalStore = Record<string, UserData>;

function readLocal(): LocalStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}") as LocalStore;
  } catch {
    return {};
  }
}

function writeLocal(store: LocalStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
}

export function getLocalUserData(userId: string): UserData {
  const store = readLocal();
  return store[userId] ?? { history: [], stats: computeStats([]), savedFields: [] };
}

export function saveLocalSession(
  userId: string,
  session: {
    formUrl: string;
    formTitle: string;
    answers: SessionAnswer[];
    status: "ok" | "fail";
    durationSeconds?: number;
    questionCount?: number;
    note?: string;
  }
) {
  const store = readLocal();
  const current = store[userId] ?? { history: [], stats: computeStats([]), savedFields: [] };
  const id = `local-${Date.now()}`;
  const row = rowToHistory({
    id,
    form_url: session.formUrl,
    form_title: session.formTitle,
    answers: session.answers,
    status: session.status,
    duration_seconds: session.durationSeconds ?? null,
    question_count: session.questionCount ?? session.answers.length,
    note: session.note ?? null,
    created_at: new Date().toISOString(),
  });
  const history = [row, ...current.history];
  const stats = computeStats(
    history.map((h) => ({
      status: h.status,
      duration_seconds: parseDuration(h.duration),
    }))
  );
  store[userId] = { ...current, history, stats };
  writeLocal(store);
}

function parseDuration(d: string): number | null {
  if (d === "—") return null;
  const m = d.match(/(\d+)m\s*(\d+)s/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const s = d.match(/(\d+)s/);
  if (s) return parseInt(s[1], 10);
  return null;
}

export async function fetchUserDataFromDb(userId: string): Promise<UserData | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: sessions, error } = await admin
    .from("form_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchUserDataFromDb:", error.message);
    return null;
  }

  const { data: profile } = await admin.from("profiles").select("common_responses").eq("id", userId).maybeSingle();

  const history = (sessions ?? []).map((row) =>
    rowToHistory({
      id: row.id,
      form_url: row.form_url,
      form_title: row.form_title,
      answers: row.answers,
      status: row.status,
      duration_seconds: row.duration_seconds,
      question_count: row.question_count,
      note: row.note,
      created_at: row.created_at,
    })
  );

  const stats: UserStats = computeStats(sessions ?? []);
  const common = (profile?.common_responses ?? {}) as Record<string, string>;
  const savedFields = Object.entries(common).map(([k, v]) => ({
    k: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
    v,
    tag: "saved",
  }));

  return { history, stats, savedFields };
}

export async function saveSessionToDb(
  userId: string,
  session: {
    formUrl: string;
    formTitle: string;
    answers: SessionAnswer[];
    status: "ok" | "fail";
    durationSeconds?: number;
    questionCount?: number;
    note?: string;
  },
  commonResponses?: Record<string, string>
) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.from("form_sessions").insert({
    user_id: userId,
    form_url: session.formUrl,
    form_title: session.formTitle,
    answers: session.answers,
    status: session.status,
    duration_seconds: session.durationSeconds ?? null,
    question_count: session.questionCount ?? session.answers.length,
    note: session.note ?? null,
  }).select("id").single();

  if (error) throw new Error(error.message);

  if (commonResponses && Object.keys(commonResponses).length > 0) {
    const { data: profile } = await admin.from("profiles").select("common_responses").eq("id", userId).maybeSingle();
    const merged = { ...(profile?.common_responses ?? {}), ...commonResponses };
    await admin.from("profiles").upsert({
      id: userId,
      common_responses: merged,
      updated_at: new Date().toISOString(),
    });
  }

  return data?.id ?? null;
}
