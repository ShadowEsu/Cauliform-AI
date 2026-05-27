"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppUser } from "@/lib/cauli-data";
import { displayName } from "@/lib/cauli-data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function mapUser(u: User): AppUser {
  const meta = u.user_metadata ?? {};
  const name =
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    displayName({ name: "", email: u.email ?? "" });

  return {
    id: u.id,
    email: u.email ?? "",
    name,
    avatarUrl: (meta.avatar_url as string | undefined) || (meta.picture as string | undefined),
    provider: u.app_metadata?.provider === "google" ? "google" : "email",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const refreshUser = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u ? mapUser(u) : null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refreshUser();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshUser]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=/app`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error) throw error;
  }, [supabase]);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const redirectTo = `${window.location.origin}/auth/callback?next=/app`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }, [supabase]);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      logout,
      refreshUser,
    }),
    [user, loading, signInWithGoogle, signInWithEmail, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {!isSupabaseConfigured() && !loading && (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-100 text-amber-900 text-xs text-center py-1.5 px-3 border-b border-amber-200">
          Supabase env vars missing — Google sign-in will not work until configured.
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}
