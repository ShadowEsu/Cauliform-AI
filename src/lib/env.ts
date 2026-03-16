export function getPublicEnv(name: string) {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length ? v.trim() : undefined;
}

export function isFirebaseConfigured() {
  return Boolean(
    getPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY") &&
      getPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN") &&
      getPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") &&
      getPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID")
  );
}

