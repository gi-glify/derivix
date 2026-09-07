import { Link } from "@/components/router-link";
import { BarChart3, BriefcaseBusiness, ChartCandlestick, CircleHelp, LayoutDashboard, ListTodo, Settings2, ShieldCheck, Wallet } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const navigation = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Markets", href: "/app/markets", icon: BarChart3 },
  { label: "Trade", href: "/app/trade", icon: ChartCandlestick },
  { label: "Positions", href: "/app/positions", icon: BriefcaseBusiness },
  { label: "Wallet", href: "/app/deposit", icon: Wallet },
  { label: "Transactions", href: "/app/transactions", icon: ListTodo },
  { label: "Verification", href: "/app/kyc", icon: ShieldCheck },
  { label: "Profile", href: "/app/profile", icon: Settings2 },
];

export function Sidebar() {
  return <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-[#e4e9e2] bg-white px-5 py-7 lg:flex"><div className="px-3"><Logo compact /></div><div className="mt-10 flex items-center gap-2 rounded-full bg-[#eff9da] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#638923]"><span className="h-2 w-2 rounded-full bg-[#a7d63b]" /> Demo mode</div><nav className="mt-8 space-y-1">{navigation.map(({ label, href, icon: Icon }, index) => <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${index === 0 ? "bg-[#f2f8e7] text-[#5e881d]" : "text-[#778078] hover:bg-[#f6f8f5] hover:text-[#111312]"}`}><Icon className="h-[18px] w-[18px]" />{label}</Link>)}</nav><div className="mt-auto space-y-1"><Link href="/app#support" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#778078]"><CircleHelp className="h-[18px] w-[18px]" />Support</Link><Link href="/app#settings" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#778078]"><Settings2 className="h-[18px] w-[18px]" />Settings</Link></div></aside>;
}
