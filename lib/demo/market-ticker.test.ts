import { describe, expect, it } from "vitest";
import { nextTickerIndex } from "./market-ticker";

describe("market ticker rotation", () => {
  it("moves forward and wraps smoothly through the market list", () => {
    expect(nextTickerIndex(0, 3)).toBe(1);
    expect(nextTickerIndex(1, 3)).toBe(2);
    expect(nextTickerIndex(2, 3)).toBe(0);
  });
});
