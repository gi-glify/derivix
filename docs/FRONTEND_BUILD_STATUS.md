# Derivix frontend build status

Updated: 2026-09-23

## Completed in the current cleanup build

1. **Binary live workspace** — each volatility index now receives and retains its own tick history. The Binary page uses the shared interactive candlestick component for recorded simulated prices and continues to show the digit-frequency view.
2. **Shared visual language** — the Binary chart, cards, spacing, text scale, colour tokens, dark mode, keyboard focus states, and icons now use the same workspace components and theme variables as the rest of the app.
3. **Reusable live data boundary** — Binary data reads are centralized in `loadBinarySnapshot`, which combines the authenticated account balance, available indices, and per-index tick state. The page has no hidden client-side balance or price fallback.
4. **Responsive navigation** — Binary is a primary destination in the small-screen bottom navigation. The navigation reflects the active route and is styled for both themes.
5. **Regression coverage** — the browser check exercises the current `binary_state` and `binary_advance_ticks` RPCs, two index tick rates, chart rendering, responsive widths, ticket placement, settlement, errors, and retry states.

## Still required before real-money trading

The product remains a clearly labelled simulated demo. A real launch needs licensed market data, broker execution, jurisdiction-specific compliance, payment reconciliation, independent ledger controls, monitoring, incident response, and a formal security review. See `LIVE_READINESS.md` for the implementation checklist.

## Next frontend consolidation

- Extract the ticket fields used by Forex and Binary into a shared form primitive once their server-side order contracts are unified.
- Replace remaining page-local shells with a common workspace header/card composition.
- Add owner-only Binary scenario administration only alongside a visible user disclosure, immutable audit record, and a server-side settlement implementation. It must not alter an undisclosed customer outcome.
