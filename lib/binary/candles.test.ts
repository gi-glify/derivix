import { describe, expect, it } from 'vitest';
import { binaryCandles } from './candles';

describe('Binary tick candles', () => {
  it('returns no invented candles when there are no stored ticks', () => {
    expect(binaryCandles([], 1000)).toEqual([]);
  });

  it('converts stored ticks into ordered OHLC candles', () => {
    const ticks = [
      { sequence: 1, value: 100, digit: 0, created_at: '2026-09-22T10:00:00.100Z' },
      { sequence: 2, value: 103, digit: 3, created_at: '2026-09-22T10:00:00.700Z' },
      { sequence: 3, value: 101, digit: 1, created_at: '2026-09-22T10:00:01.100Z' },
    ];
    expect(binaryCandles(ticks, 1000)).toEqual([
      { time: Date.parse('2026-09-22T10:00:00.000Z'), open: 100, high: 103, low: 100, close: 103 },
      { time: Date.parse('2026-09-22T10:00:01.000Z'), open: 101, high: 101, low: 101, close: 101 },
    ]);
  });
});
