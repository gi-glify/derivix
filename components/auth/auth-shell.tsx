import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({ title, description, eyebrow = "Your Derivix account", children }: { title: string; description: string; eyebrow?: string; children: ReactNode }) {
  return <main className="auth-page">
    <header className="auth-header"><Link to="/" aria-label="Derivix home"><Logo compact /></Link><ThemeToggle /></header>
    <div className="auth-layout">
      <aside className="auth-story"><span className="landing-eyebrow">Built around your next move</span><h2>A clear mind.<br />A clearer market.</h2><p>Your charts, your positions, your progress. One focused space to find your trading rhythm.</p><div className="auth-art" aria-hidden="true">{[30,48,37,61,44,72,56,81,68,91,75,100,83,112,97,124,109].map((height, i) => <span key={i} style={{ height, marginBottom: i * 5, background: i % 3 === 0 ? "#e26976" : "#aacf68" }} />)}</div><div className="auth-story-footer"><span><ShieldCheck size={15} /> Secure account access</span><ChartNoAxesCombined size={22} /></div></aside>
      <section className="auth-content"><div className="auth-heading"><p>{eyebrow}</p><h1>{title}</h1><div>{description}</div></div>{children}<p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</p><Link to="/" className="auth-home">Back to Derivix <ArrowUpRight size={13} /></Link></section>
    </div>
  </main>;
}
