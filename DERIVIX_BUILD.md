# Derivix — Demo MVP Build Guide

**Project:** Derivix  
**Type:** Demo-first Forex Trading Platform MVP  
**Goal:** Pitch-ready product that proves the complete digital trading journey  
**Status:** Demo / Proof of Concept (not a production brokerage)

---

## 1. Pitch Objective

This is a **demo-first MVP**, not a production brokerage platform.

The demo must convince stakeholders that Derivix can become a real trading product while remaining small enough to finish before the pitch.

### Demo Story

> **Landing page → Sign up / Login → KYC / identity verification → Dashboard → Deposit → Payment confirmation → Trading account funded → Choose a market → Open a simulated trade → Watch P&L move → Close trade → Withdraw → Transaction history.**

### Critical Rule

**A user cannot trade until their demo trading wallet has a confirmed deposit.**

- Use real authentication.
- Use real payment sandbox/test flows where credentials exist.
- Trading itself is simulated.

---

## 2. Recommended Stack

### Frontend

| Technology              | Purpose                          |
|-------------------------|----------------------------------|
| Next.js                 | App framework                    |
| TypeScript              | Type safety                      |
| Tailwind CSS            | Styling                          |
| shadcn/ui               | UI components                    |
| Recharts / TradingView Lightweight Charts | Charts                |
| Lucide icons            | Icons                            |
| React Hook Form + Zod   | Forms & validation               |

### Backend

Use **Next.js server routes / server actions** for the demo.

### Auth + Database

**Supabase**

- Supabase Auth
- Supabase Postgres
- Row Level Security (RLS)
- Supabase Storage (for KYC document uploads if included)

**Auth providers to enable for the pitch:**

- Google
- Facebook
- X (Twitter)
- Email / password

Do not enable every provider unless explicitly required.

---

## 3. Payment Architecture

Use a **provider-adapter** architecture so the trading application does not care which payment provider processed the transaction.

```text
                 ┌─────────────────────┐
                 │      Derivix        │
                 └──────────┬──────────┘
                            │
                    Payment Service
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
      PalPluss           Paystack           Stripe
       M-Pesa           M-Pesa/Card        Card/other
          │                 │                 │
       Webhook            Webhook           Webhook
          └─────────────────┼─────────────────┘
                            │
                     Transaction
                       Processor
                            │
                     Wallet Credit
                            │
                       Trade Engine
```

### Critical Implementation Rule

**Never credit the user’s trading balance merely because the frontend says “payment successful”.**

Only credit the wallet after the server has verified the payment through the provider response / webhook.

---

## 4. Payment Providers

### 4.1 PalPluss STK Push (Primary M-Pesa)

```text
POST https://api.palpluss.com/v1/payments/stk
```

Request fields:

- `amount`
- `phone`
- `accountReference`
- `transactionDesc`
- `callbackUrl`

Store the returned transaction ID. Final status comes from the callback/webhook.

**Flow:**

```text
User enters Amount + Phone
        ↓
POST /api/payments/mpesa/stk
        ↓
PalPluss → M-Pesa STK prompt
        ↓
User enters PIN
        ↓
PalPluss callback
        ↓
Verify transaction
        ↓
transactions.status = completed
        ↓
wallet.balance += amount
        ↓
Trading unlocked
```

Keep provider KYC readiness separate from the end-user demo KYC flow.

### 4.2 Paystack

Use as second payment adapter (M-Pesa STK-style + cards).

```text
POST /api/payments/paystack/initialize
        ↓
Paystack payment interface
        ↓
Callback / webhook
        ↓
Verify transaction
        ↓
Credit wallet
```

### 4.3 Stripe

Primarily for card deposit demonstration.

```text
Deposit:  Stripe Card → payment → webhook → wallet
Withdrawal: Prefer M-Pesa B2C path unless Stripe payout capability is confirmed
```

Do **not** hard-code assumptions about Stripe supporting every Kenyan deposit/withdrawal method.

---

## 5. Application Structure

### Customer-facing

```text
/
├── Landing Page
├── Pricing
├── Features
├── How It Works
├── Security
├── FAQ
├── Login
├── Register
│
└── /app (or /dashboard)
    ├── Dashboard
    ├── Markets
    ├── Trade
    ├── Positions
    ├── Orders
    ├── Wallet
    ├── Deposit
    ├── Withdraw
    ├── Transactions
    ├── KYC
    ├── Notifications
    ├── Settings
    └── Support
```

### Admin

```text
/admin
├── Overview
├── Users
├── KYC
├── Deposits
├── Withdrawals
├── Transactions
├── Trades
├── Markets
├── Risk Controls
├── Notifications
└── Audit Logs
```

---

## 6. Landing Page

Must look like a serious financial / trading company.

### Hero

**Headline:** Trade global markets with confidence.

**Subheadline:** A modern trading platform for managing your funds, monitoring markets and executing trades from one secure dashboard.

**Buttons:**

- Start Trading
- Explore Platform

Show a dashboard preview beside the hero.

### Trust Strip

- Secure authentication
- M-Pesa payments
- Card payments
- Real-time market data
- Risk controls
- Transparent transaction history

Do **not** claim regulatory licenses or guarantees unless the company actually holds them.

---

## 7. Landing Page Sections

### Features

| Feature                    | What to show                                      |
|----------------------------|---------------------------------------------------|
| Real-time market dashboard | Pairs, price, bid, ask, daily change, high/low   |
| Advanced charts            | Candlestick, line, area, volume, MA, RSI, MACD   |
| Fast deposits              | M-Pesa, Card, Paystack, Stripe                    |
| Risk management            | Stop loss, take profit, position sizing, warnings|
| Secure account             | Supabase Auth, social login, KYC, audit trail     |

Charts can use generated / sandbox market data for the demo.

---

## 8. Authentication

### Login

```text
Welcome back

Email
Password

[ Sign in ]

──────── or ────────

[ Continue with Google ]
[ Continue with Facebook ]
[ Continue with X ]

Forgot password?
Create account
```

### Register

Fields:

- Full name
- Email
- Phone
- Password
- Confirm password
- Country
- Terms checkbox

**Flow after register:**

```text
Account created
        ↓
Email verification
        ↓
Profile setup
        ↓
KYC / identity verification
        ↓
Dashboard
```

### Supabase Implementation

```ts
supabase.auth.signInWithOAuth({ provider: 'google' })
// equivalent for facebook and twitter/x
```

Protect all `/app/*` (or `/dashboard/*`) routes with Supabase session authentication.

---

## 9. User Onboarding / KYC Demo

Do **not** build a full production KYC engine.

Build a **KYC simulation UI** with realistic states.

### States

```text
NOT_STARTED
PENDING
APPROVED
REJECTED
REQUIRES_REVIEW
```

### Demo Flow

```text
KYC form
  - Full name
  - Date of birth
  - Country
  - Phone
  - ID type (Passport / National ID)
  - ID number
  - Upload document

[ Submit verification ]
        ↓
Status: UNDER REVIEW
        ↓
Admin can Approve / Reject / Request more info
        ↓
User sees: ✓ Identity verified — Trading features unlocked
```

Label the feature **Demo Verification** unless real KYC services are integrated.

---

## 10. Main Dashboard

The most important screen in the demo.

### Top Navigation

```text
Logo | Dashboard | Markets | Trade | Positions | Wallet | Transactions
                                          Notifications | Profile
```

### Balance Cards

```text
Total Balance       Available Margin
KES 125,000         KES 91,000

Equity              Today's P&L
KES 128,420         +KES 3,420
```

### Market Watchlist

```text
EUR/USD     1.1724     +0.42%
GBP/USD     1.3452     -0.18%
USD/JPY     157.24     +0.31%
XAU/USD     3,492.50   +0.74%
BTC/USD     111,240    +1.21%
```

### Portfolio Chart

- Equity curve
- Balance
- Daily P&L

### Open Positions

```text
EUR/USD  BUY  0.10 lot  Entry 1.1710  Current 1.1724  P&L +$14
```

---

## 11. Trading Screen

Keep it simple and focused.

```text
┌─────────────────────────────────────────────┐
│ EUR/USD                    1.1724   +0.42% │
├─────────────────────────────────────────────┤
│                                             │
│             CANDLESTICK CHART               │
│                                             │
├─────────────────────────────────────────────┤
│ Order                                       │
│ BUY / SELL                                  │
│ Amount / Lots: [ 0.10 ]                     │
│ Stop Loss:    [ 1.1680 ]                    │
│ Take Profit:  [ 1.1800 ]                    │
│ Margin Required: KES 2,000                  │
│                                             │
│ [ BUY EUR/USD ]     [ SELL EUR/USD ]        │
└─────────────────────────────────────────────┘
```

---

## 12. Trading Rules (Demo)

### Rule 1 — Deposit required

```ts
if (wallet.totalDeposits <= 0) {
  blockTrade()
}
```

Message: **Deposit funds to activate trading.**

### Rule 2 — Sufficient balance

```ts
if (requiredMargin > availableBalance) {
  rejectTrade()
}
```

### Rule 3 — Position size limits

```text
Minimum: 0.01 lot
Maximum: 1.00 lot
```

### Rule 4 — Optional Stop Loss / Take Profit

Allow users to set optional SL and TP.

### Rule 5 — Market status

Market open/closed can be controlled by admin for the demo.

---

## 13. Simulated Trade Engine

No real forex broker integration is required.

### Price Simulator

```ts
setInterval(() => {
  price += randomMovement()
}, 1000)
```

### P&L Calculation

```text
BUY:  P&L = (currentPrice - entryPrice) × positionSize
SELL: P&L = (entryPrice - currentPrice) × positionSize
```

Use a simplified currency conversion for the demo.

Every 1–2 seconds:

```text
market price changes
        ↓
position P&L recalculates
        ↓
equity recalculates
        ↓
chart updates
```

This creates a compelling “live trading” effect without a real broker connection.

---

## 14. Deposit Workflow

This must be the strongest working flow in the demo.

### Deposit Screen

```text
Deposit Funds

Amount: [ KES 5,000 ]

Payment Method
○ M-Pesa
○ Paystack
○ Stripe

[ Continue ]
```

### M-Pesa Path

```text
Phone number → [ Send STK Push ]
        ↓
STK Push sent — Check your phone and enter PIN
Waiting for confirmation...
        ↓
✓ Deposit successful — KES 5,000 added to trading wallet
[ Start Trading ]
```

Backend waits for the webhook before crediting the wallet.

---

## 15. Wallet Model (Ledger)

Never store a single mutable `balance` field and trust it.

Use a basic ledger:

```text
wallet_transactions
-------------------
id
user_id
type
amount
currency
status
provider
provider_reference
description
created_at
```

**Types:**

```text
DEPOSIT
WITHDRAWAL
TRADE_PROFIT
TRADE_LOSS
FEE
ADJUSTMENT
```

**Balance calculation:**

```text
balance = SUM(completed credits) − SUM(completed debits)
```

This makes the architecture look credible.

---

## 16. Withdrawal Workflow

```text
Withdraw Funds

Available: KES 125,000
Amount:    [ KES 10,000 ]
Method:    [ M-Pesa ]
Phone:     [ 0712XXXXXX ]

[ Request Withdrawal ]
```

**Pitch flow:**

```text
User submits → PENDING
        ↓
Admin reviews → Approves
        ↓
B2C provider / API (or mock)
        ↓
SUCCESS
```

If PalPluss B2C credentials are available, connect them. Otherwise use a sandbox/mock adapter driven by admin approval.

---

## 17. Warnings & Financial Safety UI

These signals make the platform feel mature.

| Trigger                  | Message                                              |
|--------------------------|------------------------------------------------------|
| Before first trade       | Trading involves risk. You can lose money.           |
| High-risk position       | This trade uses X% of your available margin.         |
| Low available margin     | Available margin is below recommended threshold.     |
| Large withdrawal         | May require additional verification.                 |
| KYC incomplete           | Complete verification before accessing live features.|

---

## 18. Charts (Priority)

| Chart            | Location     | Priority |
|------------------|--------------|----------|
| Candlestick      | Trading page | P0       |
| Equity curve     | Dashboard    | P0       |
| P&L bar chart    | Dashboard    | P0       |
| Portfolio allocation (donut) | Dashboard | P1 |
| Volume           | Under candles| P1       |
| RSI              | Trading page | P2       |
| MACD             | Trading page | P2       |

---

## 19. Markets Page

```text
Markets
Search markets...

Forex
  EUR/USD  GBP/USD  USD/JPY  USD/CHF ...

Commodities
  XAU/USD  XAG/USD

Crypto
  BTC/USD  ETH/USD
```

Each row: Symbol · Price · 24h % · High · Low · Action  
Clicking a market opens the trading screen.

---

## 20. Positions Page

```text
Open Positions

EUR/USD  BUY 0.10  Entry 1.1710  Current 1.1724  P&L +KES 1,400  [ Close ]
XAU/USD  SELL 0.05 Entry 3490    Current 3492    P&L -KES 600    [ Close ]
```

Closing a position realizes P&L → creates a ledger transaction → updates wallet/equity.

---

## 21. Orders Page

Track at minimum:

- MARKET
- STOP LOSS
- TAKE PROFIT

Other types (LIMIT, STOP, etc.) can be shown as “Coming Soon”.

---

## 22. Transaction History

```text
Deposit       +KES 5,000   M-Pesa     Completed
Trade Profit  +KES 1,240   EUR/USD    Completed
Withdrawal    -KES 3,000   M-Pesa     Pending
```

Filters: All · Deposits · Withdrawals · Trading · Fees

---

## 23–27. Admin Dashboard

### Overview Cards

```text
Users              2,481
Pending KYC          18
Deposits          KES 4.8M
Withdrawals       KES 1.2M
Open Positions      421
```

### Key Admin Screens

- **Users** — view, suspend, reset demo balance, view transactions/trades
- **KYC** — view document, Approve / Reject / Request Information
- **Payments** — reference, user, provider, amount, status, date
- **Withdrawal Approval** — Approve → PROCESSING → COMPLETED
- **Trades** — list of open/closed positions
- **Audit Logs** — actor, action, entity, metadata

Admin actions that affect money or KYC must run through secure server-side endpoints.

---

## 28. Database Schema (Supabase Postgres)

```sql
-- profiles
id uuid primary key
full_name text
phone text
country text
avatar_url text
role text default 'user'
created_at timestamptz

-- kyc_profiles
id uuid primary key
user_id uuid
status text
document_type text
document_number text
document_url text
reviewed_by uuid
reviewed_at timestamptz
created_at timestamptz

-- wallets
id uuid primary key
user_id uuid
currency text default 'KES'
created_at timestamptz

-- wallet_transactions
id uuid primary key
user_id uuid
wallet_id uuid
type text
amount numeric
currency text
status text
provider text
provider_reference text
description text
metadata jsonb
created_at timestamptz

-- markets
id uuid primary key
symbol text unique
name text
base_currency text
quote_currency text
price numeric
previous_price numeric
is_active boolean
updated_at timestamptz

-- positions
id uuid primary key
user_id uuid
market_id uuid
side text
quantity numeric
entry_price numeric
current_price numeric
stop_loss numeric
take_profit numeric
status text
unrealized_pnl numeric
realized_pnl numeric
opened_at timestamptz
closed_at timestamptz

-- orders
id uuid primary key
user_id uuid
market_id uuid
type text
side text
quantity numeric
price numeric
status text
created_at timestamptz

-- payments
id uuid primary key
user_id uuid
provider text
reference text unique
amount numeric
currency text
status text
provider_transaction_id text
metadata jsonb
created_at timestamptz

-- notifications
id uuid primary key
user_id uuid
title text
message text
type text
read boolean default false
created_at timestamptz

-- audit_logs
id uuid primary key
actor_id uuid
action text
entity_type text
entity_id uuid
metadata jsonb
created_at timestamptz
```

---

## 29. RLS Security

Enable Row Level Security on all tables.

**Users can:**

- SELECT their own profile, wallet, transactions, positions, orders

**Users cannot:**

- SELECT another user’s wallet
- UPDATE transaction status
- APPROVE KYC
- APPROVE withdrawals
- CHANGE balances

Admin-only actions must go through secure server-side endpoints using the service-role key.

**Never expose in browser code:**

- PalPluss secret key
- Paystack secret key
- Stripe secret key
- Supabase service-role key

---

## 30. API Routes

```text
/api/payments/palpluss/stk
/api/payments/palpluss/webhook

/api/payments/paystack/initialize
/api/payments/paystack/webhook

/api/payments/stripe/create-checkout
/api/payments/stripe/webhook

/api/withdrawals/create
/api/withdrawals/approve

/api/trades/open
/api/trades/close

/api/markets
/api/markets/[symbol]

/api/kyc/submit
/api/admin/kyc/approve
/api/admin/kyc/reject
```

---

## 31. Payment State Machine

Do **not** use a single boolean.

```text
CREATED → PENDING → PROCESSING → COMPLETED
                ↘ FAILED / CANCELLED / REVERSED
```

---

## 32. Trade State Machine

```text
OPEN → CLOSED
```

Automatic close when price hits Stop Loss or Take Profit.

---

## 33. Demo Seed Data

### Markets

```text
EUR/USD  GBP/USD  USD/JPY  USD/CHF  AUD/USD  USD/CAD
XAU/USD  BTC/USD  ETH/USD
```

### Demo Account

```text
KYC: Approved
Deposit: KES 100,000
Available: KES 100,000
Trading: Enabled
```

Clearly mark the account as **DEMO ACCOUNT**.

---

## 34. Demo Mode

Visible badge: **● DEMO MODE**

Admin Demo Controls:

```text
[ Reset Demo ]
[ Add Demo Deposit ]
[ Simulate Payment Success ]
[ Simulate Payment Failure ]
[ Approve KYC ]
[ Reject KYC ]
[ Move Market +1% ]
[ Move Market -1% ]
```

This allows instant recovery during the pitch.

---

## 35. Rehearsed Pitch Flow

1. **Landing** — customer acquisition layer
2. **Login** — Continue with Google (Supabase Auth)
3. **Dashboard** — balances, equity, markets, charts, positions
4. **KYC** — show verified + admin KYC screen
5. **Deposit** — KES 5,000 via M-Pesa STK
6. **Payment confirmation** — pending → completed → wallet credited
7. **Trade** — BUY EUR/USD 0.10 lot with SL/TP
8. **Live simulation** — price moves, P&L updates live
9. **Close trade** — realize P&L, wallet updates
10. **Withdrawal** — request → admin approves → completed

---

## 36. What NOT to Build for the Pitch

- Real broker connectivity / liquidity
- Real forex pricing feeds
- Complex order books
- Full KYC vendor integration
- Advanced AML engine
- Complex margin engine
- Copy trading / referral / affiliate systems
- Mobile apps
- Multi-language system
- Complex tax reporting
- Automated compliance engine

These belong on the production roadmap.

---

## 37. Must-Work Priorities

### P0 — Absolutely must work

1. Landing page  
2. Supabase login  
3. Dashboard  
4. Database + RLS  
5. Deposit workflow  
6. Payment transaction record  
7. Wallet credit (ledger)  
8. Trade blocked before deposit  
9. Trade opens after deposit  
10. Simulated market movement  
11. P&L updates  
12. Close trade  
13. Transaction history  

### P1 — Should work

14. KYC demo  
15. Admin dashboard  
16. Admin KYC approval  
17. Withdrawal request  
18. Admin withdrawal approval  
19. M-Pesa STK (or mock)  
20. Paystack payment (or mock)  

### P2 — Visual / demo only

21. Stripe  
22. RSI / MACD  
23. Advanced order types  
24. Advanced analytics  
25. Notifications  
26. Support center  

---

## 38. Project Structure

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── features/
│   ├── pricing/
│   └── security/
│
├── auth/
│   ├── login/
│   ├── register/
│   └── callback/
│
├── dashboard/          # or /app
│   ├── page.tsx
│   ├── markets/
│   ├── trade/
│   ├── positions/
│   ├── wallet/
│   ├── transactions/
│   ├── kyc/
│   └── settings/
│
├── admin/
│   ├── page.tsx
│   ├── users/
│   ├── kyc/
│   ├── deposits/
│   ├── withdrawals/
│   ├── trades/
│   └── audit/
│
└── api/
    ├── payments/
    ├── withdrawals/
    ├── trades/
    ├── markets/
    └── kyc/

components/
├── charts/
├── trading/
├── payments/
├── wallet/
├── kyc/
├── admin/
└── ui/

lib/
├── supabase/
├── payments/
│   ├── palpluss.ts
│   ├── paystack.ts
│   └── stripe.ts
├── trading/
│   ├── simulator.ts
│   ├── pnl.ts
│   └── risk.ts
└── utils/

supabase/
└── migrations/
```

---

## 39. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PALPLUSS_API_KEY=
PALPLUSS_WEBHOOK_SECRET=

PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Never commit these values to Git.

---

## 40. Build Order

### Phase 1 — Foundation
- Next.js + TypeScript + Tailwind + shadcn/ui
- Supabase project + Auth + database schema + RLS
- Layout + navigation

### Phase 2 — Landing
- Hero, features, charts preview, security, payments, CTA

### Phase 3 — Dashboard
- Balance cards, markets watchlist, equity chart, positions, P&L

### Phase 4 — Wallet
- Deposit / Withdraw UI, transactions list, ledger logic

### Phase 5 — Payments
- PalPluss, Paystack, Stripe adapters (start with mocks if needed)

### Phase 6 — Trading Simulator
- Price simulator, open/close position, P&L, SL/TP

### Phase 7 — Admin
- Users, KYC, payments, withdrawals, trades, audit logs

### Phase 8 — Polish
- Loading / empty / error states, toasts, warnings, confirmation dialogs, mobile responsiveness, DEMO MODE badge

---

## 41. Critical Fallback Strategy

Never let the entire demo depend on a live payment provider.

```text
Payment provider
       ↓
Attempt real sandbox/test request
       ↓
If unavailable
       ↓
Demo payment simulator
       ↓
Same webhook / transaction processing path
       ↓
Wallet credited
```

Admin button: **Simulate Successful Payment**

---

## 42. Demo Success Criteria

The MVP is complete when this sequence works without manual database intervention:

```text
REGISTER → LOGIN → KYC VERIFIED → DEPOSIT → PAYMENT CONFIRMED
→ WALLET CREDITED → TRADE ENABLED → BUY EUR/USD → PRICE MOVES
→ P&L MOVES → CLOSE TRADE → BALANCE UPDATES → WITHDRAW
→ ADMIN APPROVES → TRANSACTION COMPLETED
```

---

## 43. Production Roadmap (Present After Demo)

| Stage        | Focus                                              |
|--------------|----------------------------------------------------|
| **1. Demo**  | Supabase Auth, demo KYC, payments, simulator, admin|
| **2. Beta**  | Real KYC, real market data, real broker, AML      |
| **3. Production** | Liquidity provider, real margin engine, compliance, monitoring |
| **4. Scale** | Mobile apps, copy trading, multi-currency, affiliates, institutional |

---

## 44. Pitch Positioning

**Do not say:**  
> “We built a forex broker.”

**Say:**  
> “We built a working proof of concept for the complete digital trading journey — from authenticated onboarding and payment funding through wallet management, simulated execution, risk controls, portfolio analytics and withdrawal administration. The architecture is deliberately modular so real KYC, broker execution and production payment infrastructure can replace the demo adapters without rebuilding the customer experience.”

---

## 45. Final Priority (If Time Is Extremely Tight)

Build these six screens and make this journey flawless:

```text
1. Landing
2. Login
3. Dashboard
4. Deposit
5. Trading
6. Admin
```

```text
Login → Deposit → Wallet funded → Trade → P&L moves → Close → Admin sees transaction
```

**That is the MVP to demo.**

Everything else is supporting material.

---

**Project:** Derivix  
**Document:** Build Guide / Demo MVP Plan  
**Last updated:** September 2026
