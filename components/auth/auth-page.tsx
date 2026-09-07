import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth/store";
import { LoadingButton } from "@/components/ui/loading-button";

function GoogleIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.21Z"/><path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.52A9.74 9.74 0 0 0 12 21.5Z"/><path fill="#FBBC05" d="M6.54 13.59a5.86 5.86 0 0 1 0-3.18V7.89H3.3a9.5 9.5 0 0 0 0 8.22l3.24-2.52Z"/><path fill="#EA4335" d="M12 6.38c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.5 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.52C7.31 8.1 9.46 6.38 12 6.38Z"/></svg>; }
function FacebookIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M13.7 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.6V13h2.7v8h3.4Z"/></svg>; }
function XIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M18.9 3H22l-6.77 7.74L23.2 21h-6.24l-4.89-6.39L6.48 21H3.36l7.24-8.28L3 3h6.4l4.42 5.84L18.9 3Zm-1.1 15.9h1.73L8.48 4.99H6.62L17.8 18.9Z"/></svg>; }

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/app");
      } else {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        navigate("/app");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-canvas px-6 py-6 dark:bg-brand-ink">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to="/"><Logo /></Link>
        <ThemeToggle />
      </div >
      
      <div className="mx-auto flex max-w-md flex-col justify-center py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-limeDeep">
            <LockKeyhole className="h-5 w-5" />
          </div >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-limeDeep">Secure Access</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-ink dark:text-brand-ink">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-brand-muted">
            {mode === "login" 
              ? "Sign in to continue to your Derivix workspace." 
              : "Set up your trading account and start exploring the markets."}
          </p>
        </div >

        {/* Social Logins */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <button type="button"
            onClick={() => signInWithProvider("google")}
            className="flex items-center justify-center rounded-xl border border-brand-line bg-white p-3 transition-all hover:bg-gray-50 dark:border-brand-line dark:bg-brand-ink dark:hover:bg-brand-ink/50"
            title="Sign in with Google"
          >
            <GoogleIcon />
          </button>
          <button type="button"
            onClick={() => signInWithProvider("facebook")}
            className="flex items-center justify-center rounded-xl border border-brand-line bg-white p-3 transition-all hover:bg-gray-50 dark:border-brand-line dark:bg-brand-ink dark:hover:bg-brand-ink/50"
            title="Sign in with Facebook"
          >
            <FacebookIcon />
          </button>
          <button type="button"
            onClick={() => signInWithProvider("x")}
            className="flex items-center justify-center rounded-xl border border-brand-line bg-white p-3 transition-all hover:bg-gray-50 dark:border-brand-line dark:bg-brand-ink dark:hover:bg-brand-ink/50"
            title="Sign in with X"
          >
            <XIcon />
          </button>
        </div >

        <div className="relative mb-8 text-center">
          <hr className="border-brand-line" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-canvas px-4 text-xs font-medium text-brand-muted dark:bg-brand-ink">
            Or continue with email
          </span>
        </div >

        <form onSubmit={submit} className="rounded-3xl border border-brand-line bg-white p-6 shadow-soft dark:border-brand-line dark:bg-brand-ink">
          {mode === "register" && (
            <label className="mb-5 block text-sm font-bold text-brand-ink dark:text-brand-ink">
              Full name
              <input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required
                className="mt-2 w-full rounded-xl border border-brand-line bg-transparent px-4 py-3 font-medium outline-none focus:border-brand-lime dark:border-brand-line dark:text-brand-ink" 
              />
            </label>
          )}
          <label className="mb-5 block text-sm font-bold text-brand-ink dark:text-brand-ink">
            Email
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              required
              className="mt-2 w-full rounded-xl border border-brand-line bg-transparent px-4 py-3 font-medium outline-none focus:border-brand-lime dark:border-brand-line dark:text-brand-ink" 
            />
          </label>
          <label className="mb-5 block text-sm font-bold text-brand-ink dark:text-brand-ink">
            Password
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              required
              className="mt-2 w-full rounded-xl border border-brand-line bg-transparent px-4 py-3 font-medium outline-none focus:border-brand-lime dark:border-brand-line dark:text-brand-ink" 
            />
          </label>
          {mode === "register" && (
            <label className="mb-5 block text-sm font-bold text-brand-ink dark:text-brand-ink">
              Confirm password
              <input 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                type="password" 
                required
                className="mt-2 w-full rounded-xl border border-brand-line bg-transparent px-4 py-3 font-medium outline-none focus:border-brand-lime dark:border-brand-line dark:text-brand-ink" 
              />
            </label>
          )}
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-500 dark:bg-red-900/20">{error}</p>}
          <LoadingButton 
            isLoading={isLoading} 
            className="w-full rounded-xl bg-brand-lime px-5 py-3.5 text-sm font-bold text-brand-ink transition-all hover:bg-brand-limeDeep"
          >
            {mode === "login" ? "Sign in" : "Create account"}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </LoadingButton>
          <p className="mt-6 text-center text-sm text-brand-muted">
            {mode === "login" ? "New to Derivix?" : "Already have an account?"}{" "}
            <Link to={mode === "login" ? "/auth/register" : "/auth/login"} className="font-bold text-brand-limeDeep hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </form>
      </div >
    </main>
  );
}
