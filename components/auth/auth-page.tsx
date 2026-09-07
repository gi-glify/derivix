import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth/store";
import { LoadingButton } from "@/components/ui/loading-button";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp, signInWithProvider } = useAuth();
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
      } else {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
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
          <button 
            onClick={() => signInWithProvider("google")}
            className="flex items-center justify-center rounded-xl border border-brand-line bg-white p-3 transition-all hover:bg-gray-50 dark:border-brand-line dark:bg-brand-ink dark:hover:bg-brand-ink/50"
            title="Sign in with Google"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
          </button>
          <button 
            onClick={() => signInWithProvider("facebook")}
            className="flex items-center justify-center rounded-xl border border-brand-line bg-white p-3 transition-all hover:bg-gray-50 dark:border-brand-line dark:bg-brand-ink dark:hover:bg-brand-ink/50"
            title="Sign in with Facebook"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_2023.png" className="h-5 w-5" alt="Facebook" />
          </button>
          <button 
            onClick={() => signInWithProvider("x")}
            className="flex items-center justify-center rounded-xl border border-brand-line bg-white p-3 transition-all hover:bg-gray-50 dark:border-brand-line dark:bg-brand-ink dark:hover:bg-brand-ink/50"
            title="Sign in with X"
          >
            <img src="https://abs.twimg.com/est_theme/generic_logo.png" className="h-5 w-5" alt="X" />
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
