import { describe, expect, it } from "vitest";
import { calculatePnl, moveMarket, refreshPosition, requiredMargin, validateOrder } from "./trading";

describe("demo trading rules", () => {
  it("calculates buy and sell P&L", () => {
    expect(calculatePnl("BUY", 1.17, 1.172, 0.1)).toBe(20);
    expect(calculatePnl("SELL", 1.17, 1.172, 0.1)).toBe(-20);
  });

  it("requires valid lot sizes and sufficient margin", () => {
    expect(validateOrder(0.005, 10000, 1.17)).toContain("between");
    expect(validateOrder(0.1, requiredMargin(1.17, 0.1) - 1, 1.17)).toContain("enough");
    expect(validateOrder(0.1, 10000, 1.17)).toBeNull();
  });

  it("moves a market and recalculates an open position", () => {
    const market = moveMarket({ symbol: "EUR/USD", price: 1.17, previousPrice: 1.16 }, 0.002);
    const position = refreshPosition({ id: "p1", symbol: "EUR/USD", side: "BUY", quantity: 0.1, entryPrice: 1.17, currentPrice: 1.17, unrealizedPnl: 0, status: "OPEN", openedAt: "2026-09-07" }, market);
    expect(market.price).toBe(1.172);
    expect(position.currentPrice).toBe(1.172);
    expect(position.unrealizedPnl).toBe(20);
  });
});
