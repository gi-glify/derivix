import { describe, expect, it } from "vitest";
import { seedMarketHistory } from "./history";

describe("seeded market history", () => {
  it("joins the current quote without a price jump and keeps candle continuity", () => {
    const market = { symbol: "EUR/USD", price: 1.17, previousPrice: 1.16 };
    const history = seedMarketHistory(market, 1000);
    expect(history.at(-1)?.close).toBeCloseTo(market.price, 10);
    expect(history.every((p, i) => i === 0 || Math.abs(p.open - history[i - 1].close) < 1e-10)).toBe(true);
    expect(history.every(p => p.low <= Math.min(p.open, p.close) && p.high >= Math.max(p.open, p.close))).toBe(true);
    expect(seedMarketHistory(market, 1000)).toEqual(history);
  });
  it("starts with meaningful OHLC and volume values", () => {
    const history = seedMarketHistory({ symbol: "EUR/USD", price: 1.17, previousPrice: 1.16 }, 1000);
    expect(history).toHaveLength(24 * 30 * 4);
    expect(history.at(-1)?.time).toBe(1000);
    expect(history[0].time).toBe(1000 - (24 * 30 * 4 - 1) * 60 * 60 * 1000);
    expect(history.some((point) => point.high > point.low)).toBe(true);
    expect(history.every((point) => point.volume > 0)).toBe(true);
  });
});
