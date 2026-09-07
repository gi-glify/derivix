import { BarChart3, BriefcaseBusiness, LayoutDashboard, Wallet } from "lucide-react";
import { Link } from "@/components/router-link";

const items = [{ label: "Home", href: "/app", icon: LayoutDashboard }, { label: "Markets", href: "/app/trade", icon: BarChart3 }, { label: "Positions", href: "/app/positions", icon: BriefcaseBusiness }, { label: "Wallet", href: "/app/deposit", icon: Wallet }];

export function MobileNav() {
  return <nav aria-label="Mobile navigation" className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-[#e0e7de] bg-white/95 px-1 py-2 shadow-[0_16px_40px_rgba(17,19,18,0.14)] backdrop-blur transition-colors sm:inset-x-6 lg:hidden dark:border-[#2a332a] dark:bg-[#171d18]/95">{items.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold text-[#7d867d] transition-colors"><Icon className="h-[18px] w-[18px]" />{label}</Link>)}</nav>;
}
