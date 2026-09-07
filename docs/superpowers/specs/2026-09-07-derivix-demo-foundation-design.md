# Derivix Demo Foundation Design

## Goal

Create a pitch-ready Derivix demo foundation that communicates the brand and supports the critical journey: landing page → demo dashboard → deposit confirmation → wallet-funded trading → simulated position P&L → close trade → transaction history.

## Scope

This first slice covers the customer-facing P0 experience. It does not integrate Supabase, live payment providers, broker execution, real market feeds, production KYC, or an admin console yet. Those systems will be connected behind stable interfaces after the demo flow is proven.

## Product structure

- `/` — marketing landing page with Derivix branding, trust signals, feature explanation, and CTA.
- `/app` — demo trading workspace with navigation, balance summary, markets, and portfolio state.
- `/app/deposit` — deposit method and amount flow with a simulated confirmation action.
- `/app/trade` — market selection, simulated candlestick-style chart, order form, risk warnings, and live P&L updates.
- `/app/positions` — open and closed positions with close actions.
- `/app/transactions` — ledger-style transaction history.

The app will visibly identify itself as `DEMO MODE` and will not imply regulatory approval, guaranteed returns, live brokerage execution, or confirmed external payment processing.

## Architecture

Use Next.js App Router with TypeScript and Tailwind CSS. A small client-side demo store owns the current wallet, transactions, positions, market prices, and simulator timer; domain functions remain pure where possible so they can later move behind server actions and Supabase-backed repositories.

Payment providers are represented by an adapter contract and a mock adapter for this phase. The mock flow must use the same states that a real provider will use (`CREATED`, `PENDING`, `COMPLETED`, `FAILED`) and only credit the wallet during the confirmed-completion transition.

The trading engine is simulated and deliberately simplified: minimum size `0.01`, maximum size `1.00`, required margin based on notional demo rules, and P&L calculated from entry/current price and side. A one-second client timer changes prices and recalculates unrealized P&L for open positions.

## Visual direction

Use the supplied Derivix logo as the brand anchor. The interface should feel like a serious financial product: bright neutral canvas, deep charcoal type, lime brand accent, restrained borders, compact data tables, high-contrast positive/negative states, and clear risk language. Avoid unsupported trust claims; use factual labels such as `Demo account`, `Simulated market data`, and `Payment simulation`.

## Domain interfaces

```ts
type Side = "BUY" | "SELL";
type PaymentStatus = "CREATED" | "PENDING" | "COMPLETED" | "FAILED";
type PositionStatus = "OPEN" | "CLOSED";

type Market = {
  symbol: string;
  name: string;
  price: number;
  previousPrice: number;
  changePercent: number;
};

type Position = {
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

type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRADE_PROFIT" | "TRADE_LOSS";
  amount: number;
  status: "PENDING" | "COMPLETED";
  provider: string;
  description: string;
  createdAt: string;
};
```

The store must expose actions equivalent to `startDeposit`, `confirmDeposit`, `openPosition`, `closePosition`, and `tickMarket`. Pages and components consume these actions instead of mutating wallet values directly.

## Critical behavior

1. A user cannot open a trade until a completed deposit exists.
2. A pending deposit does not increase available balance.
3. A completed deposit creates a completed ledger transaction and increases the demo wallet.
4. Opening a position creates no wallet credit; unrealized P&L is derived from price movement.
5. Closing a position realizes P&L as a completed trade transaction and updates wallet balance.
6. Quantity outside `0.01`–`1.00` or margin above available funds is rejected with an actionable message.
7. Market ticks affect open-position P&L and visible equity without changing the ledger until close.

## Testing and verification

- Unit test P&L, deposit state transitions, trade gating, quantity validation, and close-trade ledger behavior.
- Run lint/typecheck/build after the UI is wired.
- Manually verify the full pitch path in the browser at desktop and narrow viewport widths.
- Keep the demo operational without environment variables or external credentials.

## Later integration seams

Supabase auth/database, RLS, real payment adapters, webhook verification, KYC states, admin approvals, and server-side trade/payment endpoints will be added in later plans. No secret key or service-role key belongs in browser code.
