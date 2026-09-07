import { describe, expect, it } from "vitest";
import { calculateMovingAverage, visibleWindow } from "./interactive-candlestick-utils";

describe("interactive candlestick helpers", () => {
  it("calculates a moving average without inventing early values", () => {
    expect(calculateMovingAverage([10, 20, 30, 40], 3)).toEqual([null, null, 20, 30]);
  });

  it("keeps a useful trailing window for zoomed charts", () => {
    const points = Array.from({ length: 60 }, (_, index) => index);
    expect(visibleWindow(points, 40)).toEqual(Array.from({ length: 20 }, (_, index) => index + 40));
  });
});
