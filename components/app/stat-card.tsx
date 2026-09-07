import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({ label, value, change, positive = true }: { label: string; value: string; change?: string; positive?: boolean }) {
  return <div data-aos="fade-up" className="rounded-2xl border border-[#e2e8e0] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8b938b]">{label}</p><p className="mt-3 text-2xl font-bold tracking-[-0.035em]">{value}</p>{change && <p className={`mt-2 flex items-center gap-1 text-xs font-bold ${positive ? "text-[#75a922]" : "text-[#d16e6e]"}`}>{positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{change}</p>}</div>;
}
