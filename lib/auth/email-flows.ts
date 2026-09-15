import { supabase } from "@/lib/supabase";
import { normalizeEmail } from "./auth";

export type EmailFlow = "signup" | "recovery" | "signin";
export const authError = (error: unknown) => typeof error === "string" ? error : error instanceof Error ? error.message : "Something went wrong. Please try again.";
function client() { if (!supabase) throw new Error("Account services are not available right now. Please try again later."); return supabase; }
export function callbackUrl(flow: EmailFlow) { return `${window.location.origin}/auth/callback?flow=${flow}`; }
export function rememberEmail(email: string, flow: EmailFlow) { try { sessionStorage.setItem(`derivix-auth-${flow}`, normalizeEmail(email)); } catch { /* The form remains usable when browser storage is disabled. */ } }
export function pendingEmail(flow: EmailFlow) { try { return sessionStorage.getItem(`derivix-auth-${flow}`) ?? ""; } catch { return ""; } }
export function clearPendingEmail(flow: EmailFlow) { try { sessionStorage.removeItem(`derivix-auth-${flow}`); } catch { /* Storage may be disabled. */ } }

export async function sendEmail(email: string, flow: EmailFlow) {
  const auth = client().auth;
  const address = normalizeEmail(email);
  const result = flow === "recovery"
    ? await auth.resetPasswordForEmail(address, { redirectTo: callbackUrl(flow) })
    : flow === "signup"
      ? await auth.resend({ type: "signup", email: address, options: { emailRedirectTo: callbackUrl(flow) } })
      : await auth.signInWithOtp({ email: address, options: { shouldCreateUser: false, emailRedirectTo: callbackUrl(flow) } });
  if (result.error) throw result.error;
  rememberEmail(address, flow);
}

export async function verifyEmailCode(email: string, token: string, flow: EmailFlow) {
  const { data, error } = await client().auth.verifyOtp({ email: normalizeEmail(email), token: token.trim(), type: flow === "recovery" ? "recovery" : "email" });
  if (error) throw error;
  if (!data.session) throw new Error("The code could not create a session. Request a new email and try again.");
  clearPendingEmail(flow);
}

export async function completeEmailLink(url: string) {
  const link = new URL(url);
  const hash = new URLSearchParams(link.hash.slice(1));
  const error = link.searchParams.get("error_description") || hash.get("error_description");
  if (error) throw new Error(error);
  const auth = client().auth;
  const tokenHash = link.searchParams.get("token_hash");
  const type = link.searchParams.get("type");
  if (tokenHash) {
    if (type !== "email" && type !== "signup" && type !== "recovery" && type !== "magiclink") throw new Error("This verification link is not supported. Request a new email.");
    const result = await auth.verifyOtp({ token_hash: tokenHash, type });
    if (result.error) throw result.error;
  } else if (link.searchParams.has("code")) {
    const result = await auth.exchangeCodeForSession(link.searchParams.get("code")!);
    if (result.error) throw result.error;
  }
  // getSession waits for the SDK to finish consuming implicit-flow URL tokens.
  const { data, error: sessionError } = await auth.getSession();
  if (sessionError) throw sessionError;
  if (!data.session) throw new Error("This link has expired or has already been used. Request a new email to continue.");
  return link.searchParams.get("flow") === "recovery" || type === "recovery" || hash.get("type") === "recovery" ? "recovery" : "verified";
}

export async function savePassword(password: string) {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw error;
}
