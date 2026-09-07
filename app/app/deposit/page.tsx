"use client";

import { Link } from "@/components/router-link";
import { ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/lib/demo/store";

export default function DepositPage() {
  const { beginDeposit, confirmDeposit } = useDemo();
  const [amount, setAmount] = useState("5000");
  const [method, setMethod] = useState("M-Pesa");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = Boolean(pendingId);
  function start() { setPendingId(beginDeposit(Number(amount), method)); }
  function confirm() { if (pendingId) confirmDeposit(pendingId); }
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><Link href="/app" className="text-sm font-bold text-[#718071]"><ArrowLeft className="mr-2 inline h-4 w-4" />Back to dashboard</Link><div className="mt-10 rounded-3xl border border-[#e2e8e0] bg-white p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#85a933]">Wallet funding</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Deposit funds</h2><p className="mt-3 max-w-lg text-[#758075]">Fund your demo trading wallet before opening a position. This uses a payment confirmation.</p>{!pending ? <div className="mt-9 space-y-6"><label className="block"><span className="text-sm font-bold">Amount</span><div className="mt-2 flex items-center rounded-xl border border-[#dfe6dc] px-4"><span className="text-sm font-bold text-[#8a9389]">KES</span><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="100" className="w-full border-0 bg-transparent px-3 py-3 text-lg font-bold outline-none" /></div></label><div><span className="text-sm font-bold">Payment method</span><div className="mt-2 grid gap-3 sm:grid-cols-2"><button onClick={() => setMethod("M-Pesa")} className={`rounded-xl border p-4 text-left ${method === "M-Pesa" ? "border-[#b2de4f] bg-[#f3fadd]" : "border-[#dfe6dc]"}`}><Smartphone className="h-5 w-5 text-[#75a922]" /><p className="mt-3 text-sm font-bold">M-Pesa</p><p className="mt-1 text-xs text-[#8a9389]">Simulated STK push</p></button><button onClick={() => setMethod("Card")} className={`rounded-xl border p-4 text-left ${method === "Card" ? "border-[#b2de4f] bg-[#f3fadd]" : "border-[#dfe6dc]"}`}><p className="text-lg font-bold">••••</p><p className="mt-3 text-sm font-bold">Card</p><p className="mt-1 text-xs text-[#8a9389]">Secure checkout</p></button></div></div><button onClick={start} className="w-full rounded-xl bg-[#b2de4f] px-5 py-3.5 text-sm font-bold text-[#24300f]">Continue with {method}</button></div> : <div className="mt-10 rounded-2xl bg-[#f4f8ef] p-6"><p className="text-sm font-bold text-[#6e862c]">Payment pending</p><p className="mt-2 text-2xl font-bold">KES {Number(amount).toLocaleString()}</p><p className="mt-3 text-sm leading-6 text-[#748071]">The payment has been created. Confirm it to credit the wallet.</p><button onClick={confirm} className="mt-6 flex items-center rounded-xl bg-[#b2de4f] px-5 py-3 text-sm font-bold text-[#24300f]"><CheckCircle2 className="mr-2 h-4 w-4" />Confirm payment</button></div>}</div></main>;
}
