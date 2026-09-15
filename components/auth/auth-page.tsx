import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { validateRegistration, normalizeEmail } from "@/lib/auth/auth";
import { authError, rememberEmail } from "@/lib/auth/email-flows";
import { AuthShell } from "./auth-shell";
import { PasswordInput } from "./password-input";
function GoogleIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.21Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.59a5.86 5.86 0 0 1 0-3.18V7.89H3.3a9.5 9.5 0 0 0 0 8.22l3.24-2.52Z"/><path fill="#EA4335" d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.5 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.52C7.31 8.1 9.46 6.38 12 6.38Z"/></svg>; }
function FacebookIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M13.7 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.6V13h2.7v8h3.4Z"/></svg>; }
function XIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M18.9 3H22l-6.77 7.74L23.2 21h-6.24l-4.89-6.39L6.48 21H3.36l7.24-8.28L3 3h6.4l4.42 5.84L18.9 3Zm-1.1 15.9h1.73L8.48 4.99H6.62L17.8 18.9Z"/></svg>; }

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp, signInWithProvider, configurationError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const register = mode === "register";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(""); setBusy(true);
    try {
      if (register) {
        const validation = validateRegistration({ email, password, fullName, confirmPassword });
        if (validation) throw new Error(validation);
        const result = await signUp(email, password, fullName);
        if (result.error) throw new Error(result.error);
        if (result.needsVerification) {
          rememberEmail(email, "signup");
          navigate("/auth/verify-email", { state: { email: normalizeEmail(email), sent: true } });
        } else navigate("/app", { replace: true });
      } else {
        const result = await signIn(email, password);
        if (result.error) throw new Error(result.error);
        navigate("/app", { replace: true });
      }
    } catch (err) { setError(authError(err)); } finally { setBusy(false); }
  }
  async function social(provider: "google" | "facebook" | "x") {
    setError(""); setBusy(true);
    try { const result = await signInWithProvider(provider); if (result.error) throw new Error(result.error); }
    catch (err) { setError(authError(err)); } finally { setBusy(false); }
  }

  return <AuthShell title={register ? "Make your next move." : "Welcome back."} description={register ? "Create your account and build your confidence in the markets." : "Sign in to pick up where you left off."}>
    <div className="auth-social">{([{ id: "google", label: "Google", icon: <GoogleIcon /> }, { id: "facebook", label: "Facebook", icon: <FacebookIcon /> }, { id: "x", label: "X", icon: <XIcon /> }] as const).map(provider => <button key={provider.id} type="button" disabled={busy} onClick={() => void social(provider.id)} aria-label={`Continue with ${provider.label}`}>{provider.icon}<span>{provider.label}</span></button>)}</div>
    <div className="auth-divider"><span>or continue with email</span></div>
    <form onSubmit={submit} className="auth-form" aria-busy={busy}>
      <fieldset disabled={busy}>
        {register && <div className="auth-field"><label htmlFor="full-name">Full name</label><input id="full-name" className="auth-input" autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" /></div>}
        <div className="auth-field"><label htmlFor="email">Email address</label><input id="email" className="auth-input" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <PasswordInput required value={password} onChange={e => setPassword(e.target.value)} autoComplete={register ? "new-password" : "current-password"} minLength={register ? 8 : undefined} placeholder={register ? "At least 8 characters" : "Enter your password"} />
        {register ? <PasswordInput label="Confirm password" required autoComplete="new-password" minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Enter your password again" /> : <div className="auth-forgot"><Link to="/auth/forgot-password">Forgot password?</Link></div>}
        {(error || configurationError) && <p className="auth-error" role="alert">{error || "Account services are not available right now. Please try again later."}</p>}
        <button type="submit" className="auth-primary" disabled={busy || !!configurationError}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}<ArrowRight size={16} /></button>
      </fieldset>
    </form>
    {!register && <Link to="/auth/email-signin" className="auth-secondary"><Mail size={16} /> Sign in with an email link or code</Link>}
    <p className="auth-switch">{register ? "Already have an account?" : "New to Derivix?"} <Link to={register ? "/auth/login" : "/auth/register"}>{register ? "Sign in" : "Create an account"}</Link></p>
  </AuthShell>;
}
