import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: "google" | "facebook" | "x") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const USERS_KEY = "derivix-demo-users";
const SESSION_KEY = "derivix-demo-session";
type LocalAccount = { id: string; email: string; password: string; fullName: string };

function localAccounts(): LocalAccount[] { try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]") as LocalAccount[]; } catch { return []; } }
function localUser(account: Pick<LocalAccount, "id" | "email" | "fullName">) { return { id: account.id, email: account.email, user_metadata: { full_name: account.fullName } } as unknown as User; }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { try { const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as LocalAccount | null; setUser(saved ? localUser(saved) : null); } catch { setUser(null); } setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setUser(data.session?.user ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setUser(nextSession?.user ?? null); setLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);
  async function signIn(email: string, password: string) { if (supabase) { const { error } = await supabase.auth.signInWithPassword({ email, password }); return error ? { error: error.message } : {}; } const account = localAccounts().find((item) => item.email === email.trim().toLowerCase() && item.password === password); if (!account) return { error: "Email or password is incorrect." }; localStorage.setItem(SESSION_KEY, JSON.stringify(account)); setUser(localUser(account)); return {}; }
  async function signUp(email: string, password: string, fullName: string) { if (supabase) { const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }); return error ? { error: error.message } : {}; } const normalized = email.trim().toLowerCase(); if (localAccounts().some((item) => item.email === normalized)) return { error: "An account with this email already exists." }; const account = { id: crypto.randomUUID(), email: normalized, password, fullName: fullName.trim() }; localStorage.setItem(USERS_KEY, JSON.stringify([...localAccounts(), account])); localStorage.setItem(SESSION_KEY, JSON.stringify(account)); setUser(localUser(account)); return {}; }
  async function signOut() { if (supabase) await supabase.auth.signOut(); localStorage.removeItem(SESSION_KEY); setSession(null); setUser(null); }
  async function signInWithProvider(provider: "google" | "facebook" | "x") { if (supabase) await supabase.auth.signInWithOAuth({ provider: provider === "x" ? "twitter" : provider, options: { redirectTo: window.location.origin } }); }
  return <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, signInWithProvider }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
