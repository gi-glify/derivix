import { describe, expect, it } from "vitest";
import { aggregateCandles } from "./chart-data";
import type { PricePoint } from "@/lib/demo/types";

const point = (time: number, open: number, close: number, volume = 10): PricePoint => ({ time, open, close, price: close, high: Math.max(open, close) + 1, low: Math.min(open, close) - 1, volume });

describe("trading chart candles", () => {
  it("sorts ticks and aggregates OHLC and volume into UTC hour buckets", () => {
    const candles = aggregateCandles([point(3_660_000, 12, 11, 20), point(3_600_000, 10, 12), point(7_200_000, 11, 14)], 3600);
    expect(candles).toEqual([
      { time: 3600, open: 10, high: 13, low: 9, close: 11, volume: 30 },
      { time: 7200, open: 11, high: 15, low: 10, close: 14, volume: 10 },
    ]);
  });
  it("ignores invalid records and deduplicates snapshots at the same timestamp", () => {
    expect(aggregateCandles([point(3_600_000, 10, 11), point(3_600_000, 10, 12), point(NaN, 1, 2), point(7_200_000, 1, NaN)], 3600)).toEqual([
      { time: 3600, open: 10, high: 13, low: 9, close: 12, volume: 10 },
    ]);
  });
  it("does not invent candles across gaps or for empty feeds", () => {
    expect(aggregateCandles([], 3600)).toEqual([]);
    expect(aggregateCandles([point(0, 10, 11), point(86_400_000, 11, 12)], 14400).map(p => p.time)).toEqual([0, 86400]);
  });
});
