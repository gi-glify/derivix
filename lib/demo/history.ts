import type { Market, PricePoint } from "./types";

export const HISTORY_POINTS = 24 * 30 * 4;
const HISTORY_INTERVAL = 60 * 60 * 1000;

export function seedMarketHistory(market: Market, now = Date.now()): PricePoint[] {
  return Array.from({ length: HISTORY_POINTS }, (_, index) => {
    const close = market.price + Math.sin(index / 3) * market.price * 0.0005;
    const open = index === 0 ? close : market.price + Math.sin((index - 1) / 3) * market.price * 0.0005;
    const spread = market.price * 0.00018;
    return { time: now - (HISTORY_POINTS - 1 - index) * HISTORY_INTERVAL, price: close, open, high: Math.max(open, close) + spread, low: Math.min(open, close) - spread, close, volume: 240 + (index % 7) * 85 };
  });
}
