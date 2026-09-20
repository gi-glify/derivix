"use client";

import { Link } from "@/components/router-link";
import { ArrowLeft } from "lucide-react";
import { useDemo } from "@/lib/demo/store";

export default function TransactionsPage() { const { transactions } = useDemo(); return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><Link href="/app" className="text-sm font-bold text-[#718071]"><ArrowLeft className="mr-2 inline h-4 w-4" />Back to dashboard</Link><h2 className="mt-10 text-3xl font-bold tracking-[-0.04em]">Transactions</h2><div className="mt-8 rounded-3xl border border-[#e2e8e0] bg-white p-6">{transactions.length === 0 ? <p className="py-12 text-center text-[#8b938b]">Your completed deposits, withdrawals, and trade results will appear here.</p> : <div className="divide-y divide-[#edf0eb]">{transactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-4 py-5"><div><p className="text-sm font-bold">{transaction.description}</p><p className="mt-1 text-xs text-[#8b938b]">{transaction.provider} · {transaction.status}</p></div><p className={`text-sm font-bold ${transaction.type === "WITHDRAWAL" || transaction.type === "TRADE_LOSS" ? "text-[#d16e6e]" : "text-[#75a922]"}`}>{transaction.type === "WITHDRAWAL" || transaction.type === "TRADE_LOSS" ? "-" : "+"}KES {transaction.amount.toLocaleString()}</p></div>)}</div>}</div></main>; }
