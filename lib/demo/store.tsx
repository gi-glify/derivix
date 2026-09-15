"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { moveMarket, refreshPosition, validateOrder } from "./trading";
import { completedBalance, hasCompletedDeposit, validateWithdrawal } from "./ledger";
import { approveWithdrawal as approveWithdrawalEntry, reviewKyc as reviewKycState } from "./admin";
import { supabase } from "@/lib/supabase";
import type { AppNotification, KycProfile, Market, Position, PricePoint, Side, Transaction } from "./types";
import { HISTORY_POINTS, seedMarketHistory } from "./history";
import { evolveMarket } from "./market-pattern";

const initialMarkets: Market[] = [
  { symbol: "EUR/USD", price: 1.1724, previousPrice: 1.171 },
  { symbol: "GBP/USD", price: 1.3452, previousPrice: 1.3476 },
  { symbol: "XAU/USD", price: 3492.5, previousPrice: 3466.8 },
];

const MARKET_SNAPSHOT_KEY = "derivix-market-snapshot-v1";
type MarketSnapshot = { version?: number; markets: Market[]; marketHistory: Record<string, PricePoint[]> };
function readMarketSnapshot(): MarketSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MARKET_SNAPSHOT_KEY) ?? "null") as MarketSnapshot | null;
    if (!parsed?.markets?.length || !parsed.marketHistory) return null;
    if (parsed.version === 2 && parsed.markets.every(market => (parsed.marketHistory[market.symbol]?.length ?? 0) >= HISTORY_POINTS)) return parsed;
    // Replace only old illustrative history; keep current quotes and account state intact.
    return { version: 2, markets: parsed.markets, marketHistory: Object.fromEntries(parsed.markets.map(market => [market.symbol, seedMarketHistory(market, Date.now(), Math.floor(Math.random() * 4294967296))])) };
  } catch { return null; }
}

type DemoContextValue = {
  markets: Market[];
  marketHistory: Record<string, PricePoint[]>;
  positions: Position[];
  transactions: Transaction[];
  notifications: AppNotification[];
  unreadNotifications: number;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
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
  const [initialSnapshot] = useState(() => readMarketSnapshot() ?? { version: 2, markets: initialMarkets, marketHistory: Object.fromEntries(initialMarkets.map(market => [market.symbol, seedMarketHistory(market, Date.now(), Math.floor(Math.random() * 4294967296))])) });
  const [markets, setMarkets] = useState<Market[]>(initialSnapshot.markets);
  const [marketHistory, setMarketHistory] = useState<Record<string, PricePoint[]>>(initialSnapshot.marketHistory);
  const marketsRef = useRef(markets);
  marketsRef.current = markets;
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [kyc, setKyc] = useState<KycProfile>({ status: "NOT_STARTED", fullName: "", country: "", documentType: "National ID", documentNumber: "" });

  useEffect(() => {
    try { window.localStorage.setItem(MARKET_SNAPSHOT_KEY, JSON.stringify({ version: 2, markets, marketHistory } satisfies MarketSnapshot)); } catch { /* storage may be unavailable in private browsing */ }
  }, [markets, marketHistory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentMarkets = marketsRef.current;
      const nextMarkets = currentMarkets.map(market => { const next = evolveMarket(market); return moveMarket(next.market, next.delta); });
      const now = Date.now();
      const ticks = nextMarkets.map((market, index) => {
        const previous = currentMarkets[index].price;
        return { symbol: market.symbol, point: { time: now, price: market.price, open: previous, high: Math.max(previous, market.price), low: Math.min(previous, market.price), close: market.price, volume: 100 + Math.random() * 900 } satisfies PricePoint };
      });
      marketsRef.current = nextMarkets;
      setMarkets(nextMarkets);
      setPositions(current => current.map(position => { const market = nextMarkets.find(item => item.symbol === position.symbol); return market ? refreshPosition(position, market) : position; }));
      setMarketHistory(current => Object.fromEntries(ticks.map(({ symbol, point }) => [symbol, [...(current[symbol] ?? []), point].slice(-HISTORY_POINTS)])));

    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = marketsRef.current;
      const market = current[Math.floor(Math.random() * current.length)];
      if (!market) return;
      const change = market.price - market.previousPrice;
      const notification: AppNotification = { id: crypto.randomUUID(), title: `${market.symbol} market pulse`, body: `${change >= 0 ? "Rising" : "Falling"} ${Math.abs(change).toFixed(4)} · simulated tick`, kind: "market", createdAt: new Date().toISOString(), read: false };
      setNotifications(items => [notification, ...items].slice(0, 20));
    }, 9000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const realtimeClient = supabase;
    const channel = realtimeClient.channel("market-tick-stream").on("postgres_changes", { event: "INSERT", schema: "public", table: "market_ticks" }, (payload) => {
      const row = payload.new as { symbol: string; open: number; high: number; low: number; close: number; volume: number; created_at: string };
      const point = { time: new Date(row.created_at).getTime(), price: Number(row.close), open: Number(row.open), high: Number(row.high), low: Number(row.low), close: Number(row.close), volume: Number(row.volume) };
      setMarketHistory((current) => ({ ...current, [row.symbol]: [...(current[row.symbol] ?? []), point].slice(-HISTORY_POINTS) }));
      setMarkets((current) => current.map((market) => market.symbol === row.symbol ? { ...market, previousPrice: market.price, price: point.close } : market));
    }).subscribe();
    return () => { void realtimeClient.removeChannel(channel); };
  }, []);

  const value = useMemo<DemoContextValue>(() => {
    const balance = completedBalance(transactions);
    return {
      markets, marketHistory, positions, transactions, notifications, unreadNotifications: notifications.filter((item) => !item.read).length, balance, hasDeposit: hasCompletedDeposit(transactions),
      markAllNotificationsRead() { setNotifications((items) => items.map((item) => ({ ...item, read: true }))); },
      markNotificationRead(id) { setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)); },
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
        const notification: AppNotification = { id: crypto.randomUUID(), title: `${side} order opened`, body: `${quantity.toFixed(2)} lot ${symbol} position is now simulated.`, kind: "trade", createdAt: new Date().toISOString(), read: false };
        setNotifications((items) => [notification, ...items].slice(0, 20));
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
  }, [kyc, marketHistory, markets, notifications, positions, transactions]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
