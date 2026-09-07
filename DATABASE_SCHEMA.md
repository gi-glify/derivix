# Derivix Production Database Schema (Supabase/Postgres)

> This file documents the schema. Run `supabase/migrations/20260907000000_initial_schema.sql` in Supabase SQL Editor; do not execute this Markdown file as SQL.

This schema is designed for a high-performance trading platform with strict audit trails and real-time balance updates.

## 1. Profiles (Users)
Extends the `auth.users` table from Supabase.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PRIMARY KEY, FK(`auth.users`) | Unique user identifier |
| `full_name` | text | NOT NULL | Legal full name |
| `email` | text | UNIQUE, NOT NULL | Primary contact email |
| `phone` | text | UNIQUE | Verified phone number |
| `country` | text | NOT NULL | Legal country of residence |
| `kyc_status` | text | DEFAULT 'PENDING' | 'PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW' |
| `created_at` | timestamptz | DEFAULT now() | Account creation date |

## 2. Wallets
One-to-one relationship with Profiles.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PRIMARY KEY | Wallet identifier |
| `user_id` | uuid | FK(`profiles.id`), UNIQUE | Link to user |
| `balance` | decimal(20,8) | DEFAULT 0.0 | Current available funds |
| `currency` | text | DEFAULT 'KES' | Primary account currency |
| `updated_at` | timestamptz | DEFAULT now() | Last balance update |

## 3. Positions (Trades)
Tracks all open and closed market exposures.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PRIMARY KEY | Trade identifier |
| `user_id` | uuid | FK(`profiles.id`) | User who opened the trade |
| `symbol` | text | NOT NULL | Market symbol (e.g., EUR/USD) |
| `side` | text | CHECK (side IN ('BUY', 'SELL')) | Trade direction |
| `quantity` | decimal(12,4) | NOT NULL | Lot size |
| `entry_price` | decimal(20,8) | NOT NULL | Price at opening |
| `current_price` | decimal(20,8) | NOT NULL | Latest market price |
| `exit_price` | decimal(20,8) | | Price at closing (if closed) |
| `status` | text | DEFAULT 'OPEN' | 'OPEN', 'CLOSED' |
| `pnl` | decimal(20,2) | DEFAULT 0.0 | Realized profit/loss |
| `opened_at` | timestamptz | DEFAULT now() | Trade start time |
| `closed_at` | timestamptz | | Trade end time |

## 4. Transactions (Ledger)
The immutable audit trail for all money movements.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PRIMARY KEY | Transaction identifier |
| `user_id` | uuid | FK(`profiles.id`) | User account |
| `wallet_id` | uuid | FK(`wallets.id`) | Target wallet |
| `type` | text | NOT NULL | 'DEPOSIT', 'WITHDRAWAL', 'TRADE_PROFIT', 'TRADE_LOSS' |
| `amount` | decimal(20,2) | NOT NULL | Transaction value |
| `status` | text | DEFAULT 'PENDING' | 'PENDING', 'COMPLETED', 'FAILED', 'REJECTED' |
| `provider` | text | | 'M-Pesa', 'Card', 'Internal' |
| `reference` | text | UNIQUE | External payment reference |
| `created_at` | timestamptz | DEFAULT now() | Transaction date |

## RLS (Row Level Security) Policies
- `profiles`: Users can read their own profile; Admin can read/write all.
- `wallets`: Users can read their own balance; Internal triggers handle updates.
- `positions`: Users can read/update their own trades.
- `transactions`: Users can read their own history; Only system can write.
