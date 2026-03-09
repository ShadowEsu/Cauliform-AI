import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "node:crypto";

import { cookies } from "next/headers";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const OAUTH_STATE_COOKIE = "cauliform_google_oauth_state";
const SESSION_COOKIE = "cauliform_google_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type GoogleUserSession = {
  sessionId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
};

type PublicGoogleSession = {
  user: GoogleUserSession["user"];
  expiresAt: number;
};

export async function getGoogleOAuthConfig() {
  const envClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const envClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const envRedirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!envClientId || !envClientSecret || !envRedirectUri) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI in .env.local."
    );
  }

  return {
    clientId: envClientId,
    clientSecret: envClientSecret,
    redirectUri: envRedirectUri,
  };
}

export async function buildGoogleAuthorizationUrl() {
  const { clientId, redirectUri } = await getGoogleOAuthConfig();
  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/forms.body.readonly",
      "https://www.googleapis.com/auth/forms.responses.readonly",
    ].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCodeForSession(code: string, state: string) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (!expectedState || expectedState !== state) {
    throw new Error("Invalid OAuth state.");
  }

  cookieStore.delete(OAUTH_STATE_COOKIE);

  const { clientId, clientSecret, redirectUri } = await getGoogleOAuthConfig();
  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange Google OAuth code.");
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
  };

  const userResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    throw new Error("Failed to fetch Google account profile.");
  }

  const userPayload = (await userResponse.json()) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };

  const sessionId = randomUUID();
  const expiresAt = Date.now() + tokenPayload.expires_in * 1000;

  const session: GoogleUserSession = {
    sessionId,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token,
    expiresAt,
    user: {
      id: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      picture: userPayload.picture,
    },
  };

  cookieStore.set(SESSION_COOKIE, encryptSessionCookie(session), {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return sessionId;
}

export async function clearGoogleSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentGoogleSession(): Promise<GoogleUserSession | null> {
  const session = await getSessionFromCookie();
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session;
}

export async function getPublicGoogleSession(): Promise<PublicGoogleSession | null> {
  const session = await getCurrentGoogleSession();
  if (!session) {
    return null;
  }

  return {
    user: session.user,
    expiresAt: session.expiresAt,
  };
}

async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawCookie) {
    return null;
  }

  return decryptSessionCookie(rawCookie);
}

function encryptSessionCookie(payload: GoogleUserSession) {
  const iv = randomBytes(12);
  const key = getCookieEncryptionKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encoded = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(encoded), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const body = Buffer.concat([iv, authTag, encrypted]).toString("base64url");
  const signature = createHmac("sha256", getCookieSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function decryptSessionCookie(value: string): GoogleUserSession | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getCookieSecret()).update(body).digest("base64url");
  if (expected !== signature) {
    return null;
  }

  try {
    const data = Buffer.from(body, "base64url");
    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const encrypted = data.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getCookieEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
      "utf8"
    );
    return JSON.parse(decrypted) as GoogleUserSession;
  } catch {
    return null;
  }
}

function getCookieSecret() {
  return process.env.AUTH_COOKIE_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "cauliform-dev-secret";
}

function getCookieEncryptionKey() {
  return createHash("sha256").update(getCookieSecret()).digest();
}

function isSecureCookie() {
  return process.env.NODE_ENV === "production";
}
