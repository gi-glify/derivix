import type { UTCTimestamp } from "lightweight-charts";
import type { PricePoint } from "@/lib/demo/types";

export type ChartCandle = { time: UTCTimestamp; open: number; high: number; low: number; close: number; volume: number };

/** The feed contains hourly history and live ticks. Never imply finer historical resolution. */
export function aggregateCandles(points: PricePoint[], intervalSeconds: number): ChartCandle[] {
  const snapshots = new Map<number, PricePoint>();
  for (const point of points) {
    if ([point.time, point.open, point.high, point.low, point.close, point.volume].every(Number.isFinite)) snapshots.set(point.time, point);
  }
  const candles: ChartCandle[] = [];
  for (const point of [...snapshots.values()].sort((a, b) => a.time - b.time)) {
    const time = (Math.floor(point.time / 1000 / intervalSeconds) * intervalSeconds) as UTCTimestamp;
    const previous = candles.at(-1);
    if (previous?.time === time) {
      previous.high = Math.max(previous.high, point.high);
      previous.low = Math.min(previous.low, point.low);
      previous.close = point.close;
      previous.volume += Math.max(0, point.volume);
    } else {
      candles.push({ time, open: point.open, high: point.high, low: point.low, close: point.close, volume: Math.max(0, point.volume) });
    }
  }
  return candles;
}
