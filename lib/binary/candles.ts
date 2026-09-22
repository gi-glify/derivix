import type { BinaryTick } from './types';

export type BinaryCandle = { time: number; open: number; high: number; low: number; close: number };

export function binaryCandles(ticks: BinaryTick[], intervalMs: number): BinaryCandle[] {
  const buckets = new Map<number, BinaryCandle>();
  for (const tick of ticks) {
    const time = Math.floor(Date.parse(tick.created_at) / intervalMs) * intervalMs;
    const candle = buckets.get(time);
    buckets.set(time, candle
      ? { ...candle, high: Math.max(candle.high, tick.value), low: Math.min(candle.low, tick.value), close: tick.value }
      : { time, open: tick.value, high: tick.value, low: tick.value, close: tick.value });
  }
  return [...buckets.values()].sort((left, right) => left.time - right.time);
}
