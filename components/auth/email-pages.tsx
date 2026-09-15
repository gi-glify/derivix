import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { authError, clearPendingEmail, completeEmailLink, pendingEmail, savePassword, sendEmail, verifyEmailCode, type EmailFlow } from "@/lib/auth/email-flows";
import { AuthShell } from "./auth-shell";
import { PasswordInput } from "./password-input";

export function EmailRequestPage({ flow }: { flow: "recovery" | "signin" }) {
  const [email, setEmail] = useState(() => pendingEmail(flow));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const recovery = flow === "recovery";
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try { await sendEmail(email, flow); navigate(`/auth/otp?flow=${flow}`, { state: { email: email.trim().toLowerCase(), sent: true } }); }
    catch (err) { setError(authError(err)); } finally { setBusy(false); }
  }
  return <AuthShell title={recovery ? "Forgot your password?" : "Your inbox is the key."} description={recovery ? "Enter your account email and we’ll send instructions to reset your password." : "We’ll email a secure sign-in link. If your email includes a code, you can enter it on the next screen."}>
    <form className="auth-form" onSubmit={submit} aria-busy={busy}><div className="auth-field"><label htmlFor="request-email">Email address</label><input id="request-email" className="auth-input" type="email" autoComplete="email" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-primary" disabled={busy}>{busy ? "Sending…" : recovery ? "Send reset instructions" : "Send sign-in email"}<ArrowRight size={16} /></button></form><Link to="/auth/login" className="auth-secondary"><ArrowLeft size={15} /> Back to sign in</Link>
  </AuthShell>;
}

export function EmailVerificationPage({ signup = false }: { signup?: boolean }) {
  const [params] = useSearchParams();
  const flow: EmailFlow = signup ? "signup" : params.get("flow") === "recovery" ? "recovery" : "signin";
  return <VerificationForm key={flow} flow={flow} />;
}

function VerificationForm({ flow }: { flow: EmailFlow }) {
  const { state } = useLocation();
  const [email, setEmail] = useState<string>(() => state?.email ?? pendingEmail(flow));
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(state?.sent ? 60 : 0);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!cooldown) return;
    const timeout = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setError(""); setNotice(""); setBusy(true);
    try { await verifyEmailCode(email, token, flow); navigate(flow === "recovery" ? "/auth/reset-password" : "/auth/verified", { replace: true }); }
    catch (err) { setError(authError(err)); } finally { setBusy(false); }
  }
  async function resend() {
    if (busy || cooldown || !email) return;
    setError(""); setNotice(""); setBusy(true);
    try { await sendEmail(email, flow); setCooldown(60); setNotice("A new email has been requested. Check your inbox and spam folder."); }
    catch (err) { setError(authError(err)); } finally { setBusy(false); }
  }
  if (!loading && user && flow !== "recovery") return <VerifiedPage />;
  return <AuthShell title={flow === "signup" ? "Verify your email." : "Check your inbox."} description={flow === "signup" ? "One last step. Open the confirmation link in your email to activate your account." : "If your email is eligible, you’ll receive a secure link. Open it to continue, or enter the code included in your email."}>
    <div className="auth-mail-note"><Mail size={22} /><div><strong>{email || "Your account email"}</strong><p>Can’t find it? Check your spam or junk folder.</p></div></div>
    <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
      <div className="auth-field"><label htmlFor="verify-email">Email address</label><input id="verify-email" className="auth-input" type="email" autoComplete="email" required value={email} onChange={e => { setEmail(e.target.value); setToken(""); }} /></div>
      <div className="auth-field"><label htmlFor="verification-code">Verification code</label><input id="verification-code" className="auth-input auth-code" type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={token} onChange={e => setToken(e.target.value.replace(/\D/g, ""))} placeholder="Enter your code" aria-describedby="code-hint" /><p id="code-hint" className="auth-hint">Use the code exactly as shown in your email. If it contains only a link, use that link instead.</p></div>
      {error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="auth-success" role="status">{notice}</p>}
      <button className="auth-primary" disabled={busy || token.length < 6}>{busy ? "Please wait…" : "Verify and continue"}<ArrowRight size={16} /></button>
    </fieldset></form>
    <button type="button" className="auth-secondary" disabled={busy || cooldown > 0 || !email} onClick={() => void resend()}><RefreshCw size={14} />{cooldown ? `Resend email in ${cooldown}s` : "Resend email"}</button><Link className="auth-home" to={flow === "recovery" ? "/auth/forgot-password" : flow === "signup" ? "/auth/register" : "/auth/email-signin"}><ArrowLeft size={13} /> Use a different email</Link>
  </AuthShell>;
}

export function ResetPasswordPage() {
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true); setError("");
    try { await savePassword(password); clearPendingEmail("recovery"); setSaved(true); setPassword(""); setConfirm(""); }
    catch (err) { setError(authError(err)); } finally { setBusy(false); }
  }
  return <AuthShell title={saved ? "Password updated." : "A fresh start."} description={saved ? "Your new password is saved. You can now continue to your workspace." : "Choose a strong password that you haven’t used before."}>
    {loading ? <p role="status" className="auth-hint">Checking your reset link…</p> : saved ? <><CheckCircle2 className="mb-6 text-brand-limeDeep" size={36} /><Link to="/app" className="auth-primary">Continue to workspace <ArrowRight size={16} /></Link></> : !session ? <><p role="alert" className="auth-error">Open the reset link from your email or verify a recovery code first. If the link has expired, request a new one.</p><Link to="/auth/forgot-password" className="auth-primary">Request a new reset link</Link></> : <form className="auth-form" onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}><PasswordInput label="New password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /><PasswordInput label="Confirm new password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Enter your new password again" />{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-primary" disabled={busy}>{busy ? "Saving…" : "Save new password"}<ArrowRight size={16} /></button></fieldset></form>}
  </AuthShell>;
}

export function VerifiedPage() {
  const { user, loading } = useAuth();
  return <AuthShell title={loading ? "Checking your account…" : user ? "You’re all set." : "Let’s get you signed in."} description={user ? "Your email is verified and your workspace is ready." : "Open the confirmation link in your inbox, then sign in to continue."}>{user && <CheckCircle2 className="mb-6 text-brand-limeDeep" size={36} />}<Link to={user ? "/app" : "/auth/login"} className="auth-primary">{user ? "Open workspace" : "Back to sign in"}<ArrowRight size={16} /></Link></AuthShell>;
}

export function AuthCallbackPage() {
  const [url] = useState(() => window.location.href);
  const request = useRef<Promise<string> | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const recovery = new URL(url).searchParams.get("flow") === "recovery" || new URL(url).searchParams.get("type") === "recovery";
  useEffect(() => {
    let active = true;
    request.current ??= completeEmailLink(url);
    request.current.then(result => { if (active) navigate(result === "recovery" ? "/auth/reset-password" : "/auth/verified", { replace: true }); }).catch(err => { if (active) { setError(authError(err)); window.history.replaceState(window.history.state, "", window.location.pathname); } });
    return () => { active = false; };
  }, [url, navigate]);
  return <AuthShell title={error ? "Let’s try that again." : "Confirming your link…"} description={error ? "Email links can expire and can only be used once." : "We’re securely checking your account. This will only take a moment."}>{error ? <><p className="auth-error" role="alert">{error}</p><Link to={recovery ? "/auth/forgot-password" : "/auth/login"} className="auth-primary">{recovery ? "Request a new reset link" : "Back to sign in"}<ArrowRight size={16} /></Link></> : <p role="status" className="auth-hint">Please wait…</p>}</AuthShell>;
}
