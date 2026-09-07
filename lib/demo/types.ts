export type Side = "BUY" | "SELL";
export type PaymentStatus = "CREATED" | "PENDING" | "COMPLETED" | "FAILED";
export type PositionStatus = "OPEN" | "CLOSED";

export type Market = {
  symbol: string;
  price: number;
  previousPrice: number;
};

export type PricePoint = { time: number; price: number; open: number; high: number; low: number; close: number; volume: number };

export type Position = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  status: PositionStatus;
  openedAt: string;
  closedAt?: string;
};

export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "TRADE_PROFIT" | "TRADE_LOSS";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  status: "PENDING" | "COMPLETED";
  provider: string;
  description: string;
  createdAt: string;
};

export type KycStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "REQUIRES_REVIEW";
export type KycProfile = { status: KycStatus; fullName: string; country: string; documentType: string; documentNumber: string; submittedAt?: string };
