import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, LockKeyhole, RefreshCw } from "lucide-react";
import { InteractiveCandlestickChart } from "@/components/charts/interactive-candlestick";
import { seedMarketHistory } from "@/lib/demo/history";
import { practiceChartPoints } from "@/lib/practice/chart";
import { practiceRequest, type PracticeState } from "@/lib/practice/api";

const credit = (amount: number) => Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 });
export default function PracticeMarketPage() {
  const [snapshot, setSnapshot] = useState<PracticeState | null>(null);
  const [symbol, setSymbol] = useState("EUR/USD");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [stake, setStake] = useState("100");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const clockOffset = useRef(0);
  const requestId = useRef(0);
  const modeRef = useRef<PracticeState["mode"] | null>(null);
  const active = snapshot?.orders.find(order => order.status === "OPEN");
  const activeSymbol = active?.symbol ?? symbol;
  const mode = snapshot?.mode ?? null;
  const winning = mode === "win";
  const disclosure = snapshot ? `PRESET ${winning ? "WIN" : "LOSS"} DEMO · Virtual credits only · No cash value` : "SIMULATION · Virtual credits only · No cash value";
  const [idleStart] = useState(Date.now);
  const [seed] = useState(() => Math.floor(Math.random() * 4294967296));
  const load = useCallback(async (action: "state" | "open" | "settle" | "reset" = "state", payload: Record<string, unknown> = {}) => {
    const id = ++requestId.current;
    setBusy(true); setError("");
    try {
      const result = await practiceRequest(action, action === "state" ? null : modeRef.current, payload);
      if (id !== requestId.current) return;
      modeRef.current = result.mode;
      clockOffset.current = Date.parse(result.serverTime) - Date.now();
      setNow(Date.parse(result.serverTime)); setSnapshot(result);
    } catch (err) { if (id === requestId.current) setError(err instanceof Error ? err.message : "Could not load practice state."); }
    finally { if (id === requestId.current) setBusy(false); }
  }, []);
  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now() + clockOffset.current), 500); return () => clearInterval(timer); }, []);
  const remaining = active ? Math.max(0, Math.ceil((Date.parse(active.settles_at) - now) / 1000)) : 0;
  const settledAttempt = useRef<string | null>(null);
  useEffect(() => {
    if (active && remaining === 0 && !busy && settledAttempt.current !== active.id) {
      settledAttempt.current = active.id;
      void load("settle", { id: active.id });
    }
  }, [active, remaining, busy, load]);
  const recent = snapshot?.orders.find(order => order.symbol === activeSymbol);
  const history = useMemo(() => {
    const base = Number(recent?.entry_price ?? (activeSymbol === "EUR/USD" ? 1.1724 : activeSymbol === "GBP/USD" ? 1.3452 : 3492.5));
    const start = recent ? Date.parse(recent.opened_at) - 1000 : idleStart;
    return seedMarketHistory({ symbol: activeSymbol, price: base, previousPrice: base }, start, seed).slice(-140);
  }, [recent?.id, recent?.entry_price, recent?.opened_at, activeSymbol, idleStart, seed]);
  const points = useMemo(() => practiceChartPoints(history, recent, now, seed), [history, recent, now, seed]);
  return <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Practice scenarios</p><h1 className="mt-1 text-2xl font-semibold">{snapshot ? (winning ? "Always-win" : "Always-lose") : "Assigned"} practice market</h1></div><div className="flex gap-4 text-xs font-semibold"><Link to="/app/market-explorer">Market explorer</Link></div></div>
    <div className="mb-5 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"><FlaskConical size={21} className="shrink-0 text-amber-600" /><div><p className="text-sm font-bold">{disclosure}</p><p className="mt-1 text-xs leading-5 text-brand-muted">Your administrator assigns the practice scenario. {snapshot && <>Every BUY or SELL is scripted to {winning ? "gain" : "lose"} 10% of its virtual stake after 12 seconds. </>} This is a demonstration, not a prediction. Credits cannot be deposited, withdrawn, or transferred to a wallet.</p></div></div>
    {error && <div className="mb-4 rounded-xl border border-brand-line bg-white p-4 dark:bg-[#1b2321]" role="alert"><p className="flex items-center gap-2 text-sm"><LockKeyhole size={16} />{error}</p><button type="button" onClick={() => void load()} disabled={busy} className="mt-3 text-xs font-semibold text-brand-limeDeep">Retry access check</button></div>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-brand-line bg-white dark:bg-[#1b2321]"><InteractiveCandlestickChart key={activeSymbol} points={points} symbol={activeSymbol} disclosure={disclosure} /></section>
      {!snapshot ? <div className="rounded-xl border border-brand-line p-10 text-center text-sm text-brand-muted">{busy ? "Checking your practice account…" : "Sign in to load the practice scenario assigned by your administrator."}</div> : <><aside className="space-y-4"><section className="rounded-xl border border-brand-line bg-white p-5 dark:bg-[#1b2321]"><p className="text-xs text-brand-muted">Available virtual credits</p><p className="mt-1 text-3xl font-semibold tabular-nums">{credit(snapshot.credits)}</p><form onSubmit={event => { event.preventDefault(); void load("open", { symbol, side, stake: Number(stake) }); }} className="mt-5 space-y-4"><fieldset disabled={busy || !!active || !!error} className="space-y-4"><label className="block text-xs font-semibold">Instrument<select value={symbol} onChange={e => setSymbol(e.target.value)} className="mt-2 w-full rounded-lg border border-brand-line bg-brand-canvas p-3">{["EUR/USD","GBP/USD","XAU/USD"].map(value => <option key={value}>{value}</option>)}</select></label><div className="grid grid-cols-2 gap-2">{(["BUY","SELL"] as const).map(value => <button key={value} type="button" aria-pressed={side === value} onClick={() => setSide(value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${side === value ? "border-brand-lime bg-brand-lime/20" : "border-brand-line"}`}>{value}</button>)}</div><label className="block text-xs font-semibold">Virtual stake<input type="number" required min="10" max="1000" step="0.01" value={stake} onChange={e => setStake(e.target.value)} className="mt-2 w-full rounded-lg border border-brand-line bg-brand-canvas p-3" /></label><button disabled={busy || !!active || !!error} className="w-full rounded-lg bg-brand-lime p-3 text-sm font-bold text-[#172217]">{busy ? "Please wait…" : `Run preset ${winning ? "win" : "loss"}`}</button></fieldset></form><p className="mt-3 text-[11px] leading-5 text-brand-muted">One order at a time. Every result is preset and uses virtual credits only.</p></section>
      {active && <section className="rounded-xl border border-brand-line p-4"><p className="text-sm font-semibold">{active.side} {active.symbol}</p><p className="mt-2 text-xs text-brand-muted">{remaining ? `Scripted outcome in ${remaining}s` : "Ready to settle"}</p><p className="mt-2 text-lg font-semibold">Preset: {winning ? "+" : ""}{credit(active.pnl)} credits</p>{!remaining && <button type="button" disabled={busy} onClick={() => void load("settle", { id: active.id })} className="mt-3 text-xs font-bold text-brand-limeDeep">Settle / retry</button>}</section>}
      <button type="button" disabled={busy || !!active || !!error} onClick={() => void load("reset")} className="flex items-center gap-2 text-xs font-semibold text-brand-muted"><RefreshCw size={13} /> Reset to 10,000 virtual credits</button></aside>
      <section className="min-w-0 rounded-xl border border-brand-line bg-white p-5 xl:col-span-2 dark:bg-[#1b2321]"><h2 className="text-sm font-semibold">Practice history</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-brand-muted"><tr>{["Market","Side","Stake","Outcome","Status"].map(label => <th key={label} className="pb-3 pr-4 font-medium">{label}</th>)}</tr></thead><tbody>{snapshot.orders.map(order => <tr key={order.id} className="border-t border-brand-line"><td className="py-3">{order.symbol}</td><td>{order.side}</td><td>{credit(order.stake)}</td><td>{order.status === "CLOSED" ? `${Number(order.pnl) > 0 ? "+" : ""}${credit(order.pnl)} credits` : "Pending scripted result"}</td><td>{order.status}</td></tr>)}</tbody></table>{!snapshot.orders.length && <p className="py-8 text-center text-brand-muted">No practice orders yet.</p>}</div></section>
    </>}
    </div>
  </main>;
}
