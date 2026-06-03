/** Client-side persistence for sessions, saved forms, and preferences */

export interface LocalSession {
  id: string;
  formTitle: string;
  formUrl: string;
  phoneNumber?: string;
  questionCount?: number;
  answerCount?: number;
  status: "submitted" | "failed" | "cancelled";
  createdAt: string;
}

export interface SavedForm {
  id: string;
  url: string;
  title: string;
  questionCount: number;
  savedAt: string;
  lastUsedAt?: string;
}

export interface UserPrefs {
  defaultPhone?: string;
  lastFormUrl?: string;
}

const SESSIONS_KEY = "cauliform_sessions";
const FORMS_KEY = "cauliform_saved_forms";
const PREFS_KEY = "cauliform_prefs";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSessions(): LocalSession[] {
  return read<LocalSession[]>(SESSIONS_KEY, []);
}

export function addSession(session: Omit<LocalSession, "id" | "createdAt">) {
  const sessions = getSessions();
  const entry: LocalSession = {
    ...session,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  write(SESSIONS_KEY, [entry, ...sessions].slice(0, 50));
  return entry;
}

export function getSavedForms(): SavedForm[] {
  return read<SavedForm[]>(FORMS_KEY, []);
}

export function saveFormEntry(form: Omit<SavedForm, "id" | "savedAt">) {
  const forms = getSavedForms();
  const existing = forms.find((f) => f.url === form.url);
  if (existing) {
    const updated = forms.map((f) =>
      f.url === form.url
        ? { ...f, ...form, lastUsedAt: new Date().toISOString() }
        : f
    );
    write(FORMS_KEY, updated);
    return existing;
  }
  const entry: SavedForm = {
    ...form,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  };
  write(FORMS_KEY, [entry, ...forms].slice(0, 20));
  return entry;
}

export function removeSavedForm(id: string) {
  write(
    FORMS_KEY,
    getSavedForms().filter((f) => f.id !== id)
  );
}

export function getPrefs(): UserPrefs {
  return read<UserPrefs>(PREFS_KEY, {});
}

export function setPrefs(prefs: Partial<UserPrefs>) {
  write(PREFS_KEY, { ...getPrefs(), ...prefs });
}

export function getSessionStats() {
  const sessions = getSessions();
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s) => new Date(s.createdAt).toDateString() === today
  );
  const submitted = sessions.filter((s) => s.status === "submitted");
  const completionRate =
    sessions.length > 0
      ? Math.round((submitted.length / sessions.length) * 100)
      : 0;

  return {
    total: sessions.length,
    today: todaySessions.length,
    submitted: submitted.length,
    failed: sessions.filter((s) => s.status === "failed").length,
    completionRate,
    recent: sessions.slice(0, 5),
  };
}
