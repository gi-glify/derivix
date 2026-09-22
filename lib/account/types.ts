export type AccountMode = "demo" | "real";
export type LedgerEntryType = "DEMO_CREDIT" | "DEPOSIT" | "STAKE_RESERVE" | "STAKE_RELEASE" | "TRADE_PROFIT" | "TRADE_LOSS" | "FEE" | "WITHDRAWAL" | "REFUND" | "REVERSAL";

export type AccountSummary = {
  total: number;
  reserved: number;
  available: number;
  currency: string;
  mode: AccountMode;
};

export type LedgerEntry = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  entry_type: LedgerEntryType;
  mode: AccountMode;
  idempotency_key: string;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type BalanceReservation = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  mode: AccountMode;
  status: "OPEN" | "RELEASED" | "SETTLED" | "CANCELLED";
  idempotency_key: string;
  reference_id: string | null;
  created_at: string;
  closed_at: string | null;
};

export function availableBalance(balance: Pick<AccountSummary, "total" | "reserved">): number {
  return Math.max(0, Number(balance.total) - Number(balance.reserved));
}

export function validateLedgerAmount(amount: number, balance: Pick<AccountSummary, "total" | "reserved">): number {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero");
  if (amount > availableBalance(balance)) throw new Error("Insufficient available balance");
  return Number(amount.toFixed(2));
}
