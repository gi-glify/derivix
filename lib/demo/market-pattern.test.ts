import { describe, expect, it } from "vitest";
import { evolveMarket } from "./market-pattern";

describe("market pattern simulation", () => {
  it("creates sustained regimes and preserves their state", () => {
    const result = evolveMarket({ symbol: "EUR/USD", price: 1.17, previousPrice: 1.16 }, () => 0.9);
    expect(result.market.regimeTicks).toBeGreaterThan(0);
    expect(result.market.volatility).toBeGreaterThan(0.00018);
  });

  it("can produce an extreme movement when the shock branch triggers", () => {
    const values = [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99];
    let index = 0;
    const result = evolveMarket({ symbol: "XAU/USD", price: 3500, previousPrice: 3490 }, () => values[index++]);
    expect(Math.abs(result.delta)).toBeGreaterThan(1);
  });
});
