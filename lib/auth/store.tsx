import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: "google" | "facebook" | "x") => Promise<{ error?: string }>;
  updateProfile: (input: { fullName: string; phone: string; country: string }) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const configurationMessage = "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages → Settings → Environment variables, then redeploy.";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setConfigurationError(configurationMessage); setLoading(false); return; }
    supabase.auth.getSession().then(({ data, error }) => { if (error) setConfigurationError(error.message); setSession(data.session); setUser(data.session?.user ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setUser(nextSession?.user ?? null); setLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: configurationMessage };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }
  async function signUp(email: string, password: string, fullName: string) {
    if (!supabase) return { error: configurationMessage };
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    return error ? { error: error.message } : {};
  }
  async function signOut() { if (supabase) await supabase.auth.signOut(); setSession(null); setUser(null); }
  async function signInWithProvider(provider: "google" | "facebook" | "x") { if (!supabase) return { error: configurationMessage }; const { error } = await supabase.auth.signInWithOAuth({ provider: provider === "x" ? "twitter" : provider, options: { redirectTo: window.location.origin } }); return error ? { error: error.message } : {}; }
  async function updateProfile(input: { fullName: string; phone: string; country: string }) { if (!supabase || !user) return { error: configurationMessage }; const { error: profileError } = await supabase.from("profiles").update({ full_name: input.fullName.trim(), phone: input.phone.trim() || null, country: input.country.trim() }).eq("id", user.id); if (profileError) return { error: profileError.message }; const { data, error: authError } = await supabase.auth.updateUser({ data: { full_name: input.fullName.trim() } }); if (!authError && data.user) setUser(data.user); return authError ? { error: authError.message } : {}; }

  return <AuthContext.Provider value={{ session, user, loading, configurationError, signIn, signUp, signOut, signInWithProvider, updateProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
