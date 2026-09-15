import { useMemo } from "react";
import { ArrowUpRight, ChartCandlestick } from "lucide-react";
import { InteractiveCandlestickChart } from "@/components/charts/interactive-candlestick";
import type { PricePoint } from "@/lib/demo/types";

/** Fixed illustrative data, deliberately separate from account prices and balances. */
function previewHistory(): PricePoint[] {
  let previous = 1.1642;
  let seed = 42;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const start = Date.UTC(2026, 8, 1);
  return Array.from({ length: 120 }, (_, i) => {
    const open = previous;
    const close = open + (random() - .44) * .0014;
    previous = close;
    return { time: start + i * 3600000, open, close, price: close, high: Math.max(open, close) + random() * .0006, low: Math.min(open, close) - random() * .0006, volume: 200 + random() * 1800 };
  });
}

export function MarketPreview() {
  const points = useMemo(previewHistory, []);
  const latest = points.at(-1)!;
  const change = (latest.close / points[0].open - 1) * 100;
  return <div className="preview-frame"><div className="preview-inner">
    <div className="preview-header"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-lime/15 text-brand-limeDeep"><ChartCandlestick size={17} /></span><div><p className="text-xs font-semibold">Market workspace</p><p className="mt-0.5 text-[10px] text-brand-muted">A clearer view of every move</p></div></div><span className="rounded-md border border-brand-line px-2 py-1 text-[9px] uppercase tracking-widest text-brand-muted">Demo preview</span></div>
    <div className="preview-stats"><div><p>EUR / USD</p><strong>{latest.close.toFixed(5)}</strong></div><div><p>Period change</p><strong className="text-[#25a886]"><ArrowUpRight className="mr-1 inline h-3 w-3" />{change.toFixed(2)}%</strong></div><div className="ml-auto text-right"><p>Instrument</p><strong>Forex</strong></div></div>
    <div className="px-2 pb-2"><InteractiveCandlestickChart points={points} symbol="EUR/USD" compact /></div>
    <div className="flex justify-between border-t border-brand-line px-4 py-3 text-[9px] text-brand-muted"><span>Illustrative data · Try the chart controls</span><span>UTC</span></div>
  </div></div>;
}
