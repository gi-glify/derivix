import { useLocation } from "react-router-dom";
import { Link } from "@/components/router-link";
import { BarChart3, BriefcaseBusiness, ChartCandlestick, CircleHelp, LayoutDashboard, ListTodo, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const navigation = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Practice markets", href: "/app/markets", icon: BarChart3 },
  { label: "Market explorer", href: "/app/market-explorer", icon: ChartCandlestick },
  { label: "Trade", href: "/app/trade", icon: ChartCandlestick },
  { label: "Positions", href: "/app/positions", icon: BriefcaseBusiness },
  { label: "Wallet", href: "/app/deposit", icon: Wallet },
  { label: "Transactions", href: "/app/transactions", icon: ListTodo },
  { label: "Verification", href: "/app/kyc", icon: ShieldCheck },
  { label: "Profile", href: "/app/profile", icon: Settings2 },
];

export function Sidebar() {
  const { pathname } = useLocation();
  return <aside className="fixed inset-y-0 left-0 z-50 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-[#e4e9e2] bg-white px-5 py-7 lg:flex"><div className="px-3"><Logo compact /></div><div className="mt-10 flex items-center gap-2 rounded-full bg-brand-lime/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#638923]"><span className="h-2 w-2 rounded-full bg-[#a7d63b]" /> Practice workspace</div><nav aria-label="Main navigation" className="mt-8 space-y-1">{navigation.map(({ label, href, icon: Icon }) => <Link key={label} href={href} aria-current={pathname === href ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${pathname === href ? "bg-brand-lime/15 text-brand-limeDeep" : "text-brand-muted hover:bg-brand-canvas hover:text-brand-ink"}`}><Icon className="h-[18px] w-[18px]" />{label}</Link>)}</nav><div className="mt-auto space-y-1"><button type="button" onClick={() => window.dispatchEvent(new Event("derivix-open-assistant"))} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#778078]"><CircleHelp className="h-[18px] w-[18px]" />Support</button><Link href="/app/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#778078]"><Settings2 className="h-[18px] w-[18px]" />Settings</Link></div></aside>;
}
