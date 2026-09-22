"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, FlaskConical, RefreshCw } from "lucide-react";
import { Link } from "@/components/router-link";
import { accountRequest } from "@/lib/account/api";
import type { AccountSummary } from "@/lib/account/types";
import { binaryRequest } from "@/lib/binary/api";
import { evaluateDigitContract, type BinaryContractType } from "@/lib/binary/rules";
import type { BinaryContract, BinaryIndex, BinaryState } from "@/lib/binary/types";

const types: BinaryContractType[] = ["EVEN", "ODD", "OVER", "UNDER", "MATCHES", "DIFFERS"];
const durations = [1, 5, 10, 20];
const emptyAccount: AccountSummary = { total: 0, reserved: 0, available: 0, currency: "KES", mode: "demo" };

export default function BinaryPage() {
  const [state, setState] = useState<BinaryState | null>(null);
  const [account, setAccount] = useState<AccountSummary>(emptyAccount);
  const [symbol, setSymbol] = useState("V50_1S");
  const [contractType, setContractType] = useState<BinaryContractType>("EVEN");
  const [prediction, setPrediction] = useState(4);
  const [stake, setStake] = useState("");
  const [duration, setDuration] = useState(5);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());
  const active = state?.contracts.find(contract => contract.status === "OPEN");
  const index = state?.indices.find(item => item.symbol === (active?.symbol ?? symbol));
  const digits = useMemo(() => state?.ticks[symbol]?.slice(-10).map(tick => tick.digit) ?? [], [state, symbol]);

  const load = useCallback(async () => {
    setBusy(true); setMessage("");
    try {
      const [nextState, summary] = await Promise.all([
        binaryRequest<BinaryState>("state"),
        accountRequest<{ summary: AccountSummary }>("summary"),
      ]);
      setState(nextState); setAccount(summary.summary);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load Binary Demo."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => { setNow(Date.now()); void load(); }, 5000); return () => window.clearInterval(timer); }, [load]);
  const remaining = active ? Math.max(0, Math.ceil((Date.parse(active.settles_at) - now) / 1000)) : 0;
  const selectedTypeNeedsDigit = ["OVER", "UNDER", "MATCHES", "DIFFERS"].includes(contractType);
  const finalDigit = active?.final_digit ?? digits.at(-1);
  async function grantDemo() {
    try { await accountRequest("grant_demo_credit", { amount: 1000, reason: "User-requested Binary Demo funds", idempotencyKey: crypto.randomUUID() }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Demo funds could not be added."); }
  }
  async function place() {
    try {
      if (!stake || Number(stake) <= 0) throw new Error("Enter a stake before placing a contract.");
      await binaryRequest("create", { symbol, contractType, prediction: selectedTypeNeedsDigit ? prediction : null, stake: Number(stake), durationTicks: duration, idempotencyKey: crypto.randomUUID() });
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Contract could not be created."); }
  }
  return <main className="min-h-[calc(100vh-72px)] bg-[#0b0d0c] px-3 py-4 text-white sm:px-6 sm:py-7"><div className="mx-auto max-w-5xl"><div className="flex items-center justify-between"><Link href="/app" className="flex items-center gap-2 text-sm text-white/55"><ArrowLeft size={16}/>Workspace</Link><button onClick={() => void load()} className="flex items-center gap-2 text-xs text-white/55"><RefreshCw size={14}/>Refresh</button></div><div className="mt-6 flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#b2de4f]">Binary Demo</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Digit contracts</h1></div><div className="text-right"><p className="text-xs text-white/45">Available balance</p><p className="text-xl font-bold">{account.currency} {account.available.toLocaleString()}</p></div></div><div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#b2de4f]/25 bg-[#b2de4f]/10 p-4 text-xs leading-5 text-white/70"><FlaskConical className="shrink-0 text-[#b2de4f]" size={18}/><span>Demo Mode only. Index prices, ticks, payouts and results are simulated. Binary uses the same account balance as other trading modes.</span></div>{message&&<p role="alert" className="mt-4 rounded-xl bg-red-400/15 p-3 text-sm text-red-200">{message}</p>}<section className="mt-5 rounded-2xl border border-white/10 bg-[#121513] p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><select value={active?.symbol ?? symbol} disabled={!!active} onChange={e=>setSymbol(e.target.value)} className="rounded-xl border border-white/10 bg-[#0c0f0d] px-4 py-3 text-sm font-bold">{(state?.indices ?? []).map((item: BinaryIndex)=><option key={item.symbol} value={item.symbol}>{item.name}</option>)}</select><div className="text-right"><p className="text-2xl font-bold tabular-nums">{index?.base_price.toLocaleString() ?? "—"}</p><p className="text-xs text-[#b2de4f]">Simulated index value</p></div></div><div className="mt-7 grid grid-cols-5 gap-2 sm:grid-cols-10">{Array.from({length:10},(_,digit)=><div key={digit} className={`rounded-full border p-2 text-center ${finalDigit===digit?"border-[#b2de4f] bg-[#b2de4f]/20":"border-white/10 bg-black/20"}`}><strong className="block text-lg">{digit}</strong><small className="text-[10px] text-white/45">{digits.filter(item=>item===digit).length ? `${Math.round(digits.filter(item=>item===digit).length/Math.max(1,digits.length)*100)}%` : "—"}</small></div>)}</div><div className="mt-5 flex items-center justify-between text-xs text-white/45"><span>Recent simulated final digits</span><span>{digits.length ? digits.join(" · ") : "Waiting for ticks"}</span></div></section><div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]"><section className="rounded-2xl border border-white/10 bg-[#121513] p-4 sm:p-6"><div className="flex flex-wrap gap-2">{types.map(type=><button key={type} onClick={()=>setContractType(type)} disabled={!!active} className={`rounded-xl px-3 py-2 text-xs font-bold ${contractType===type?"bg-[#b2de4f] text-[#111511]":"bg-white/5 text-white/60"}`}>{type}</button>)}</div>{selectedTypeNeedsDigit&&<div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">{Array.from({length:10},(_,digit)=><button key={digit} onClick={()=>setPrediction(digit)} disabled={!!active} className={`rounded-lg border py-2 text-sm font-bold ${prediction===digit?"border-[#b2de4f] bg-[#b2de4f]/20":"border-white/10"}`}>{digit}</button>)}</div>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-white/60">Stake ({account.currency})<input value={stake} onChange={e=>setStake(e.target.value)} type="number" min="1" step="0.01" placeholder="Enter stake" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white"/></label><label className="text-xs font-bold text-white/60">Duration<select value={duration} onChange={e=>setDuration(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white">{durations.map(item=><option key={item} value={item}>{item} tick{item===1?"":"s"}</option>)}</select></label></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#20a6b4]/20 p-4"><p className="text-xs font-bold">Potential payout</p><p className="mt-2 text-xl font-bold">{stake?`${account.currency} ${(Number(stake)*1.96).toFixed(2)}`:"—"}</p></div><button onClick={active?undefined:place} disabled={busy||!!active||!stake} className="rounded-xl bg-[#b2de4f] px-4 py-3 text-sm font-bold text-[#111511] disabled:opacity-40">{active?`Settling in ${remaining}s`:"Place contract"}</button></div></section><aside className="rounded-2xl border border-white/10 bg-[#121513] p-4 sm:p-6"><p className="text-xs font-bold uppercase tracking-widest text-white/45">Account</p><p className="mt-3 text-3xl font-bold">{account.currency} {account.available.toLocaleString()}</p><p className="mt-1 text-xs text-white/45">Reserved {account.currency} {account.reserved.toLocaleString()}</p>{account.total===0&&<button onClick={()=>void grantDemo()} className="mt-5 w-full rounded-xl border border-[#b2de4f]/40 px-3 py-3 text-xs font-bold text-[#b2de4f]">Add Demo funds</button>}{active&&<div className="mt-5 rounded-xl bg-white/5 p-3 text-xs"><Clock3 size={15} className="mb-2 text-[#b2de4f]"/>Contract active for {remaining}s</div>}{active?.status!=="OPEN"&&active&&<div className="mt-5 rounded-xl bg-[#b2de4f]/10 p-3 text-xs"><CheckCircle2 size={15} className="mb-2 text-[#b2de4f]"/>Final digit {active.final_digit}. {evaluateDigitContract(active.contract_type,active.prediction,active.final_digit ?? 0).reason}</div>}</aside></div><section className="mt-4 rounded-2xl border border-white/10 bg-[#121513] p-4"><h2 className="text-xs font-bold uppercase tracking-widest text-white/45">Contract history</h2><div className="mt-3 space-y-2">{(state?.contracts ?? []).map((contract: BinaryContract)=><div key={contract.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 py-3 text-xs"><span>{contract.contract_type} {contract.prediction ?? ""} · {contract.duration_ticks} ticks</span><span className={contract.status==="WON"?"text-[#b2de4f]":"text-white/55"}>{contract.status} · {account.currency} {contract.payout.toFixed(2)}</span></div>)}</div>{!state?.contracts.length&&<p className="py-6 text-center text-xs text-white/35">No Binary contracts yet.</p>}</section></div></main>;
}
