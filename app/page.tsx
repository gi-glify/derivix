import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MarketPreview } from "@/components/marketing/market-preview";
import { Footer } from "@/components/marketing/footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileCTA } from "@/components/app/mobile-cta";

const features = [
  { icon: BarChart3, title: "Complete Market Visibility", text: "Monitor global markets and your portfolio value from one focused, high-performance workspace." },
  { icon: WalletCards, title: "Seamless Funding", text: "A transparent ledger and transaction trail make every fund movement clear and audited." },
  { icon: ShieldCheck, title: "Advanced Risk Control", text: "Built-in safeguard tools and position alerts help you execute trades with disciplined precision." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-canvas text-brand-ink selection:bg-brand-lime selection:text-brand-ink overflow-x-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-semibold text-brand-muted md:flex">
          <a href="#platform" className="hover:text-brand-ink transition-colors">Platform</a>
          <a href="#features" className="hover:text-brand-ink transition-colors">Features</a>
          <a href="#security" className="hover:text-brand-ink transition-colors">Security</a>
        </div >
        <div className="flex items-center gap-3 text-sm font-semibold">
          <ThemeToggle />
          <Link to="/auth/login" className="hidden px-4 py-2 text-brand-muted hover:text-brand-ink transition-colors sm:block">Sign in</Link>
          <Link to="/app" className="hidden rounded-full bg-brand-ink px-5 py-3 text-white transition-all hover:bg-brand-limeDeep active:scale-95 sm:block">
            Start Trading <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
        </div >
      </nav>

      <section className="landing-hero mx-auto grid max-w-[1440px] items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:pb-24 lg:pt-16">
        <div className="text-center lg:text-left" data-aos="fade-up">
          <div className="landing-eyebrow mb-7">Your edge starts with clarity</div>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-brand-ink sm:text-5xl lg:text-7xl">
            See the market.<br /><span className="text-brand-limeDeep">Find your rhythm.</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto lg:mx-0 text-base leading-7 text-brand-muted sm:text-lg">
            A focused workspace for learning the markets. Explore detailed charts, test your strategies, and follow every position in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link to="/app" className="rounded-full bg-brand-lime px-7 py-3.5 text-sm font-bold text-brand-ink shadow-lg shadow-brand-lime/30 transition-all hover:bg-brand-limeDeep hover:-translate-y-0.5 active:scale-95">
              Open your workspace <ArrowRight className="ml-2 inline h-4 w-4" />
            </Link>
            <a href="#features" className="px-6 py-3.5 text-sm font-bold text-brand-muted hover:text-brand-ink transition-colors">
              How it works
            </a >
          </div >
          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-[11px] font-semibold text-brand-muted">
            <span className="flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-brand-lime" /> Secure & Encrypted</span>
            <span className="flex items-center gap-2"><WalletCards className="h-3.5 w-3.5 text-brand-lime" /> Flexible account funding</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-brand-lime" /> Advanced Risk Tools</span>
          </div >
        </div >
        <div id="platform" className="relative" data-aos="fade-left" data-aos-delay="200">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand-lime/20 blur-3xl" />
          <div className="relative">
            <MarketPreview />

          </div >
        </div >
      </section>

      <section id="features" className="border-y border-brand-line bg-white px-6 py-20 lg:px-10 dark:bg-[#1b2321]/50">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl text-center mx-auto" data-aos="fade-up">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-limeDeep">Built for your next move</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">Everything you need to move with purpose.</h2>
          </div >
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }, idx) => (
              <div 
                key={title} 
                data-aos="fade-up" 
                data-aos-delay={idx * 100}
                className="group rounded-2xl border border-brand-line bg-brand-canvas p-7 transition-all hover:border-brand-lime hover:shadow-soft"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-lime/20 text-brand-limeDeep transition-colors group-hover:bg-brand-lime group-hover:text-brand-ink">
                  <Icon className="h-6 w-6" />
                </div >
                <h3 className="mt-6 text-xl font-bold text-brand-ink">{title}</h3>
                <p className="mt-3 leading-7 text-brand-muted">{text}</p>
              </div >
            ))}
          </div >
        </div >
      </section>

      <section id="security" className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16 text-sm text-brand-muted sm:flex-row sm:items-center sm:justify-between lg:px-10" data-aos="fade-up">
        <p className="max-w-md">Derivix is a focused trading workspace for market learning, portfolio planning, and disciplined execution.</p>
        <span className="font-bold text-brand-ink">Trade beyond limits<span className="ml-1 text-brand-lime">●</span></span>
      </section>
      <Footer />
      <MobileCTA />
    </main>
  );
}
