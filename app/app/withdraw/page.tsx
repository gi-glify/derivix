"use client";

import { Link } from "@/components/router-link";
import { ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/lib/demo/store";

export default function WithdrawPage() {
  const { balance, requestWithdrawal } = useDemo();
  const [amount, setAmount] = useState("1000");
  const [phone, setPhone] = useState("0712 000 000");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function submit() {
    const error = requestWithdrawal(Number(amount), "M-Pesa");
    setMessage(error ?? "Withdrawal request submitted for review.");
    if (!error) setSubmitted(true);
  }
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><Link href="/app" className="text-sm font-bold text-[#718071]"><ArrowLeft className="mr-2 inline h-4 w-4" />Back to dashboard</Link><div className="mt-10 rounded-3xl border border-[#e2e8e0] bg-white p-6 sm:p-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#85a933]">Wallet payout</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Withdraw funds</h2><p className="mt-3 text-[#758075]">Available balance: <strong className="text-[#111312]">KES {balance.toLocaleString()}</strong></p>{!submitted ? <div className="mt-9 space-y-6"><label className="block"><span className="text-sm font-bold">Amount</span><div className="mt-2 flex items-center rounded-xl border border-[#dfe6dc] px-4"><span className="text-sm font-bold text-[#8a9389]">KES</span><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" className="w-full border-0 bg-transparent px-3 py-3 text-lg font-bold outline-none" /></div></label><label className="block"><span className="text-sm font-bold">M-Pesa phone number</span><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe6dc] px-4 py-3 outline-none focus:border-[#b2de4f]" /></label><div className="rounded-xl bg-[#fff9e8] p-4 text-xs leading-5 text-[#967c35]">Large withdrawals may require additional verification. Demo withdrawals remain pending until admin approval.</div>{message && <p className="rounded-xl bg-[#fff0f0] p-3 text-xs font-bold text-[#bd6c6c]">{message}</p>}<button onClick={submit} className="w-full rounded-xl bg-[#b2de4f] px-5 py-3.5 text-sm font-bold text-[#24300f]"><Smartphone className="mr-2 inline h-4 w-4" />Request withdrawal</button></div> : <div className="mt-10 rounded-2xl bg-[#f4f8ef] p-6"><CheckCircle2 className="h-7 w-7 text-[#75a922]" /><p className="mt-4 text-lg font-bold">Withdrawal pending approval</p><p className="mt-2 text-sm leading-6 text-[#748071]">Your request for KES {Number(amount).toLocaleString()} to {phone} has been added to transaction history.</p><Link href="/app/transactions" className="mt-6 inline-block rounded-xl bg-[#111312] px-5 py-3 text-sm font-bold text-white">View transaction history</Link></div>}</div></main>;
}
