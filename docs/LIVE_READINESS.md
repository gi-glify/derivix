# Derivix live-readiness plan

Derivix is currently a polished, interactive demo with a Supabase-backed foundation. The dashboard and trade screen now feel alive: market history is generated locally for an immediate preview, and authenticated deployments can consume `market_ticks` through Supabase Realtime. Realtime database changes require the table to be added to the Realtime publication and subscribed to from the client. See the [Supabase Postgres Changes guide](https://supabase.com/docs/guides/realtime/postgres-changes).

## What is working now

- Email authentication, session handling, profile updates, protected routes, and sign-out.
- Database schema for profiles, wallets, positions, transactions, and market ticks.
- Responsive trade workspace inspired by the supplied references: chart-first layout, dark canvas, order ticket, candles, smooth line, area, and volume views.
- Local market simulation for demos and an optional server-side market tick writer for staging.
- Live UI refresh for prices, open-position P&L, watchlist values, and dashboard totals.
- Light/dark theme switching and route-aware AOS animation refresh.

## What must be added before calling it a live trading product

1. **Market data source** — replace the random tick generator with a licensed exchange, broker, or market-data provider. Normalize symbols, timestamps, precision, trading sessions, and stale-price handling on the server.
2. **Execution integration** — connect the order ticket to a broker or liquidity provider. Add order states such as pending, partially filled, filled, rejected, cancelled, and expired. Never treat a browser-side success message as an execution confirmation.
3. **Wallet and payments** — connect deposits and withdrawals to the chosen payment provider, verify webhooks server-side, make webhook handlers idempotent, and maintain an immutable double-entry ledger.
4. **Risk controls** — add margin calculation, leverage limits, market hours, max position size, liquidation rules, price collars, duplicate-order protection, and server-side validation.
5. **KYC/AML and compliance** — integrate the required identity provider, sanctions screening, age/jurisdiction checks, consent records, risk disclosures, and a review workflow for the operating region.
6. **Security hardening** — review every RLS policy, keep the Supabase service-role key server-only, add rate limits and abuse detection, validate all input on trusted boundaries, and add audit logs for auth, funding, profile, and trading events.
7. **Operations** — add error tracking, structured logs, uptime checks, alerts for tick gaps and webhook failures, backups, data-retention rules, and a support/admin workflow.
8. **Testing and reconciliation** — add integration tests against a staging provider, replayable webhook fixtures, order-state tests, ledger reconciliation jobs, and a kill switch for trading.

## Recommended rollout

### Demo

Use the included local simulator. Label prices and orders as simulated everywhere, keep seeded balances out of production, and show a clear demo banner.

### Closed pilot

Use a staging Supabase project, a server-side tick writer, sandbox payment/broker credentials, test users, and daily reconciliation. Restrict access by allowlist and record every action.

### Production

Enable real providers only after compliance approval, RLS review, webhook verification, monitoring, disaster recovery, and a tested trading kill switch are in place. Keep the simulator available only behind an explicit development flag.

## Deployment checklist

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages.
- Run `supabase/migrations/20260907000000_initial_schema.sql`, then `20260907000002_market_ticks_and_profile.sql`.
- For staging simulation, run `npm run simulate:markets` on a private server with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never expose the service-role key in `VITE_*` variables or client code.
- Confirm the `market_ticks` table is enabled for Realtime and that authenticated users can read it. Supabase documents the subscription flow in [Subscribing to database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes).
- Test sign-up, email confirmation behavior, login, profile edits, theme switching, mobile navigation, chart updates, and logout in the deployed environment.

The current implementation is suitable as a contract-ready product demonstration and technical headstart. It should not be represented as live brokerage execution until the provider, ledger, compliance, and server-side controls above are implemented.
