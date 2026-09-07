import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Radio } from "lucide-react";
import { nextTickerIndex } from "@/lib/demo/market-ticker";
import type { Market } from "@/lib/demo/types";

export function MarketTicker({ markets }: { markets: Market[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (markets.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => nextTickerIndex(current, markets.length)), 3600);
    return () => window.clearInterval(timer);
  }, [markets.length]);
  const market = markets[index] ?? markets[0];
  if (!market) return null;
  const change = market.price - market.previousPrice;
  const positive = change >= 0;
  return <div className="overflow-hidden rounded-2xl border border-brand-line bg-brand-ink px-4 py-3 text-white shadow-sm transition-colors sm:px-5" aria-live="polite"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-lime/20 text-brand-lime"><Radio className="h-4 w-4 animate-pulse" /></span><div key={market.symbol} className="min-w-0 animate-[ticker-in_450ms_ease-out]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Simulated market pulse</p><p className="truncate text-sm font-bold">{market.symbol}</p></div></div><div key={`${market.symbol}-value`} className="shrink-0 text-right animate-[ticker-in_450ms_ease-out]"><p className="text-sm font-bold tabular-nums">{market.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p><p className={`flex items-center justify-end text-[10px] font-bold ${positive ? "text-brand-lime" : "text-red-300"}`}>{positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{positive ? "+" : ""}{change.toFixed(4)}</p></div></div></div>;
}
