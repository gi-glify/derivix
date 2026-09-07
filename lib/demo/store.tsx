"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { moveMarket, refreshPosition, validateOrder } from "./trading";
import { completedBalance, hasCompletedDeposit, validateWithdrawal } from "./ledger";
import { approveWithdrawal as approveWithdrawalEntry, reviewKyc as reviewKycState } from "./admin";
import type { KycProfile, Market, Position, Side, Transaction } from "./types";

const initialMarkets: Market[] = [
  { symbol: "EUR/USD", price: 1.1724, previousPrice: 1.171 },
  { symbol: "GBP/USD", price: 1.3452, previousPrice: 1.3476 },
  { symbol: "XAU/USD", price: 3492.5, previousPrice: 3466.8 },
];

type DemoContextValue = {
  markets: Market[];
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
        return nextMarkets;
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<DemoContextValue>(() => {
    const balance = completedBalance(transactions);
    return {
      markets, positions, transactions, balance, hasDeposit: hasCompletedDeposit(transactions),
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
  }, [kyc, markets, positions, transactions]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider");
  return context;
}
