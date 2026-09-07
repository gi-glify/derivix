const markets = [
  ["EUR/USD", "1.1724", "+0.42%"],
  ["GBP/USD", "1.3452", "-0.18%"],
  ["XAU/USD", "3,492.50", "+0.74%"],
  ["BTC/USD", "111,240", "+1.21%"],
];

export function MarketPreview() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#dfe5dd] bg-white shadow-[0_24px_80px_rgba(17,19,18,0.10)]">
      <div className="flex items-center justify-between border-b border-[#edf0ec] px-6 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#858c85]">Market overview</p>
          <p className="mt-1 text-lg font-semibold">Watch your markets</p>
        </div>
        <span className="rounded-full bg-[#eef9d8] px-3 py-1.5 text-xs font-bold text-[#5f8c1c]">Live Market</span>
      </div>
      <div className="grid grid-cols-[1.5fr_1fr_1fr] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9aa19b]">
        <span>Market</span><span>Price</span><span className="text-right">24h</span>
      </div>
      {markets.map(([name, price, change]) => (
        <div key={name} className="grid grid-cols-[1.5fr_1fr_1fr] items-center border-t border-[#f0f2ef] px-6 py-4 text-sm">
          <div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[#b4e548]" /><span className="font-semibold">{name}</span></div>
          <span className="font-medium text-[#4d554e]">{price}</span>
          <span className={`text-right font-bold ${change.startsWith("+") ? "text-[#73a51e]" : "text-[#d46969]"}`}>{change}</span>
        </div>
      ))}
    </div>
  );
}
