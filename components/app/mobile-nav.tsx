import { BarChart3, BriefcaseBusiness, LayoutDashboard, Wallet } from "lucide-react";
import { Link } from "@/components/router-link";

const items = [{ label: "Home", href: "/app", icon: LayoutDashboard }, { label: "Markets", href: "/app/trade", icon: BarChart3 }, { label: "Positions", href: "/app/positions", icon: BriefcaseBusiness }, { label: "Wallet", href: "/app/deposit", icon: Wallet }];

export function MobileNav() {
  return <nav className="fixed inset-x-4 bottom-4 z-30 flex justify-around rounded-2xl border border-[#e0e7de] bg-white/95 px-2 py-2 shadow-[0_16px_40px_rgba(17,19,18,0.14)] backdrop-blur lg:hidden dark:border-[#2a332a] dark:bg-[#171d18]/95">{items.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className="flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold text-[#7d867d]"><Icon className="h-[18px] w-[18px]" />{label}</Link>)}</nav>;
}
