import { describe, expect, it } from "vitest";
import { calculateMovingAverage, priceBounds, visibleWindow } from "./interactive-candlestick-utils";

describe("interactive candlestick helpers", () => {
  it("calculates a moving average without inventing early values", () => {
    expect(calculateMovingAverage([10, 20, 30, 40], 3)).toEqual([null, null, 20, 30]);
  });

  it("keeps a useful trailing window for zoomed charts", () => {
    const points = Array.from({ length: 60 }, (_, index) => index);
    expect(visibleWindow(points, 40)).toEqual(Array.from({ length: 20 }, (_, index) => index + 40));
  });

  it("supports browsing the full loaded history", () => {
    const points = Array.from({ length: 2400 }, (_, index) => index);
    expect(visibleWindow(points, 2388, 12)).toEqual(Array.from({ length: 12 }, (_, index) => index + 2388));
  });

  it("scales forex prices to their own range instead of including zero", () => {
    expect(priceBounds([1.17, 1.18])).toEqual({ min: 1.17, max: 1.18, span: 0.010000000000000009 });
  });
});
