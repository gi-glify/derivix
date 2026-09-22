import { describe, expect, it } from "vitest";
import { generateDemoTick, tickDigits } from "./ticks";

describe("binary demo ticks", () => {
  it("generates the same tick for the same seed and sequence", () => {
    expect(generateDemoTick("volatility-50", 17, 267860.19, 2)).toEqual(generateDemoTick("volatility-50", 17, 267860.19, 2));
  });

  it("changes deterministically with the sequence", () => {
    expect(generateDemoTick("volatility-50", 17, 267860.19, 2).value).not.toBe(generateDemoTick("volatility-50", 18, 267860.19, 2).value);
  });

  it("extracts a sequence of final digits for a tick history", () => {
    expect(tickDigits([
      generateDemoTick("volatility-50", 1, 100, 3),
      generateDemoTick("volatility-50", 2, 100, 3),
    ])).toHaveLength(2);
  });
});
