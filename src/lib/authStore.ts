export type LocalUser = {
  id: string;
  email: string;
  name?: string;
  provider: "local" | "google";
};

type LocalAccount = {
  id: string;
  email: string;
  password: string;
  name?: string;
  createdAt: number;
};

const KEY_ACCOUNTS = "cauliform.accounts.v1";
const KEY_SESSION = "cauliform.session.v1";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<LocalAccount[]>(localStorage.getItem(KEY_ACCOUNTS));
  return Array.isArray(parsed) ? parsed : [];
}

function setAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(KEY_ACCOUNTS, JSON.stringify(accounts));
}

export function getSessionUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const parsed = safeJsonParse<LocalUser>(localStorage.getItem(KEY_SESSION));
  if (!parsed || typeof parsed !== "object") return null;
  if (!parsed.id || !parsed.email || !parsed.provider) return null;
  return parsed;
}

export function setSessionUser(user: LocalUser | null) {
  if (typeof window === "undefined") return;
  if (!user) localStorage.removeItem(KEY_SESSION);
  else localStorage.setItem(KEY_SESSION, JSON.stringify(user));
}

export function signUpLocal(params: { email: string; password: string; name?: string }) {
  const email = params.email.trim().toLowerCase();
  const password = params.password;
  const name = params.name?.trim();

  if (!email || !password) throw new Error("Email and password are required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const accounts = getAccounts();
  if (accounts.some((a) => a.email === email)) throw new Error("Account already exists.");

  const id = `local_${crypto.randomUUID()}`;
  const account: LocalAccount = {
    id,
    email,
    password,
    name: name || undefined,
    createdAt: Date.now(),
  };

  setAccounts([account, ...accounts]);
  const user: LocalUser = { id, email, name: account.name, provider: "local" };
  setSessionUser(user);
  return user;
}

export function signInLocal(params: { email: string; password: string }) {
  const email = params.email.trim().toLowerCase();
  const password = params.password;
  if (!email || !password) throw new Error("Email and password are required.");

  const accounts = getAccounts();
  const account = accounts.find((a) => a.email === email);
  if (!account || account.password !== password) throw new Error("Invalid email or password.");

  const user: LocalUser = { id: account.id, email: account.email, name: account.name, provider: "local" };
  setSessionUser(user);
  return user;
}

export function signOut() {
  setSessionUser(null);
}

