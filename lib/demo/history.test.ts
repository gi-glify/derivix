import { describe, expect, it } from "vitest";
import { seedMarketHistory } from "./history";

describe("seeded market history", () => {
  it("starts with meaningful OHLC and volume values", () => {
    const history = seedMarketHistory({ symbol: "EUR/USD", price: 1.17, previousPrice: 1.16 }, 1000);
    expect(history).toHaveLength(60);
    expect(history.some((point) => point.high > point.low)).toBe(true);
    expect(history.every((point) => point.volume > 0)).toBe(true);
  });
});
