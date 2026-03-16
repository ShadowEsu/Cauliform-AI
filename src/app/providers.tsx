"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LocalUser } from "@/lib/authStore";
import { getSessionUser, setSessionUser, signInLocal, signOut, signUpLocal } from "@/lib/authStore";
import { getFirebaseAuth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from "firebase/auth";

type AuthContextValue = {
  user: LocalUser | null;
  loading: boolean;
  signUp: (params: { email: string; password: string; name?: string }) => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from local session
    setUser(getSessionUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    // If Firebase is configured, mirror Google auth state into our session user.
    const fa = getFirebaseAuth();
    if (!fa) return;
    const unsub = onAuthStateChanged(fa, (u) => {
      if (!u?.email) return;
      const next: LocalUser = {
        id: `google_${u.uid}`,
        email: u.email.toLowerCase(),
        name: u.displayName || undefined,
        provider: "google",
      };
      setSessionUser(next);
      setUser(next);
    });
    return () => unsub();
  }, []);

  const signUp = useCallback(async (params: { email: string; password: string; name?: string }) => {
    const u = signUpLocal(params);
    setUser(u);
  }, []);

  const signIn = useCallback(async (params: { email: string; password: string }) => {
    const u = signInLocal(params);
    setUser(u);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const fa = getFirebaseAuth();
    if (!fa) throw new Error("Google sign-in is not configured yet.");
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(fa, provider);
    if (!result.user.email) throw new Error("Google sign-in failed.");
    const u: LocalUser = {
      id: `google_${result.user.uid}`,
      email: result.user.email.toLowerCase(),
      name: result.user.displayName || undefined,
      provider: "google",
    };
    setSessionUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    const fa = getFirebaseAuth();
    if (fa) {
      try {
        await fbSignOut(fa);
      } catch {
        // ignore
      }
    }
    signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signUp, signIn, signInWithGoogle, logout }),
    [user, loading, signUp, signIn, signInWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

