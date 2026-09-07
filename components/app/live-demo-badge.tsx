"use client";

import { Radio } from "lucide-react";

export function LiveDemoBadge() {
  return <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe9d4] bg-[#f0f9df] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#638923]"><Radio className="h-3.5 w-3.5 animate-pulse" /> Prices moving live</span>;
}
