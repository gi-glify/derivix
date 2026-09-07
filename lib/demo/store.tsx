"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { moveMarket, refreshPosition, validateOrder } from "./trading";
import { completedBalance, hasCompletedDeposit, validateWithdrawal } from "./ledger";
import { approveWithdrawal as approveWithdrawalEntry, reviewKyc as reviewKycState } from "./admin";
import { supabase } from "@/lib/supabase";
import type { KycProfile, Market, Position, PricePoint, Side, Transaction } from "./types";

const initialMarkets: Market[] = [
  { symbol: "EUR/USD", price: 1.1724, previousPrice: 1.171 },
  { symbol: "GBP/USD", price: 1.3452, previousPrice: 1.3476 },
  { symbol: "XAU/USD", price: 3492.5, previousPrice: 3466.8 },
];

type DemoContextValue = {
  markets: Market[];
  marketHistory: Record<string, PricePoint[]>;
  positions: Position[];
  transactions: Transaction[];
  balance: number;
  hasDeposit: boolean;
  beginDeposit: (amount: number, provider: string) => string;
  confirmDeposit: (id: string) => void;
  requestWithdrawal: (amount: number, provider: string) => string | null;
  approveWithdrawal: (id: string) => void;
  kyc: KycProfile;
  submitKyc: (profile: Omit<KycProfile, "status" | "submittedAt">) => void;
  reviewKyc: (decision: "APPROVED" | "REJECTED" | "REQUIRES_REVIEW") => void;
  openPosition: (symbol: string, side: Side, quantity: number) => string | null;
  closePosition: (id: string) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [markets, setMarkets] = useState(initialMarkets);
  const [marketHistory, setMarketHistory] = useState<Record<string, PricePoint[]>>(() => Object.fromEntries(initialMarkets.map((market) => [market.symbol, Array.from({ length: 36 }, (_, index) => ({ time: Date.now() - (35 - index) * 1500, price: market.price + (Math.sin(index / 3) * market.price * 0.0005), open: market.price, high: market.price, low: market.price, close: market.price, volume: 0 }))])));
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kyc, setKyc] = useState<KycProfile>({ status: "NOT_STARTED", fullName: "", country: "", documentType: "National ID", documentNumber: "" });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMarkets((currentMarkets) => {
        const nextMarkets = currentMarkets.map((market) => {
          const movement = (Math.random() - 0.5) * market.price * 0.0008;
          return moveMarket(market, movement);
        });
        setPositions((currentPositions) => currentPositions.map((position) => {
          const market = nextMarkets.find((item) => item.symbol === position.symbol);
          return market ? refreshPosition(position, market) : position;
        }));
        setMarketHistory((currentHistory) => Object.fromEntries(nextMarkets.map((market) => {
          const previous = currentMarkets.find((item) => item.symbol === market.symbol)?.price ?? market.price;
          const point: PricePoint = { time: Date.now(), price: market.price, open: previous, high: Math.max(previous, market.price), low: Math.min(previous, market.price), close: market.price, volume: Math.random() * 1000 };
          return [market.symbol, [...(currentHistory[market.symbol] ?? []), point].slice(-60)];
        })));
        return nextMarkets;
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const realtimeClient = supabase;
    const channel = realtimeClient.channel("market-tick-stream").on("postgres_changes", { event: "INSERT", schema: "public", table: "market_ticks" }, (payload) => {
      const row = payload.new as { symbol: string; open: number; high: number; low: number; close: number; volume: number; created_at: string };
      const point = { time: new Date(row.created_at).getTime(), price: Number(row.close), open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close), volume: Number(row.volume) };
      setMarketHistory((current) => ({ ...current, [row.symbol]: [...(current[row.symbol] ?? []), point].slice(-60) }));
      setMarkets((current) => current.map((market) => market.symbol === row.symbol ? { ...market, previousPrice: market.price, price: point.close } : market));
    }).subscribe();
    return () => { void realtimeClient.removeChannel(channel); };
  }, []);

  const value = useMemo<DemoContextValue>(() => {
    const balance = completedBalance(transactions);
    return {
      markets, marketHistory, positions, transactions, balance, hasDeposit: hasCompletedDeposit(transactions),
      beginDeposit(amount, provider) {
        const id = crypto.randomUUID();
        setTransactions((current) => [{ id, type: "DEPOSIT", amount, status: "PENDING", provider, description: `${provider} deposit`, createdAt: new Date().toISOString() }, ...current]);
        return id;
      },
      confirmDeposit(id) {
        setTransactions((current) => current.map((item) => item.id === id ? { ...item, status: "COMPLETED" } : item));
      },
      requestWithdrawal(amount, provider) {
        const error = validateWithdrawal(amount, balance);
        if (error) return error;
        setTransactions((current) => [{ id: crypto.randomUUID(), type: "WITHDRAWAL", amount, status: "PENDING", provider, description: `${provider} withdrawal`, createdAt: new Date().toISOString() }, ...current]);
        return null;
      },
      approveWithdrawal(id) { setTransactions((current) => current.map((item) => item.id === id ? approveWithdrawalEntry(item) : item)); },
      kyc,
      submitKyc(profile) { setKyc({ ...profile, status: "PENDING", submittedAt: new Date().toISOString() }); },
      reviewKyc(decision) { setKyc((current) => ({ ...current, status: reviewKycState(current.status, decision) })); },
      openPosition(symbol, side, quantity) {
        const market = markets.find((item) => item.symbol === symbol);
        if (!market) return "Market not found.";
        if (!hasCompletedDeposit(transactions)) return "Deposit funds to activate trading.";
        const error = validateOrder(quantity, balance, market.price);
        if (error) return error;
        const id = crypto.randomUUID();
        setPositions((current) => [{ id, symbol, side, quantity, entryPrice: market.price, currentPrice: market.price, unrealizedPnl: 0, status: "OPEN", openedAt: new Date().toISOString() }, ...current]);
        return null;
      },
      closePosition(id) {
        setPositions((current) => {
          const position = current.find((item) => item.id === id);
          if (!position || position.status === "CLOSED") return current;
          const pnl = position.unrealizedPnl;
          setTransactions((items) => [{ id: crypto.randomUUID(), type: pnl >= 0 ? "TRADE_PROFIT" : "TRADE_LOSS", amount: Math.abs(pnl), status: "COMPLETED", provider: position.symbol, description: `${position.side} ${position.symbol} closed`, createdAt: new Date().toISOString() }, ...items]);
          return current.map((item) => item.id === id ? { ...item, status: "CLOSED", closedAt: new Date().toISOString() } : item);
        });
      },
    };
  }, [kyc, marketHistory, markets, positions, transactions]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
