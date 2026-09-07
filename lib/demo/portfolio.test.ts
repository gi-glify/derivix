import { describe, expect, it } from "vitest";
import { portfolioHistory } from "./portfolio";

describe("portfolio performance history", () => {
  it("does not imply performance before the account has a balance", () => {
    expect(portfolioHistory(0, [{ time: 1, price: 10, open: 10, high: 10, low: 10, close: 10, volume: 1 }])).toEqual([]);
  });

  it("preserves portfolio history after funding", () => {
    const points = [{ time: 1, price: 10, open: 10, high: 10, low: 10, close: 10, volume: 1 }];
    expect(portfolioHistory(100, points)).toEqual(points);
  });
});
