import type { Market, PricePoint } from "./types";

export function seedMarketHistory(market: Market, now = Date.now()): PricePoint[] {
  return Array.from({ length: 36 }, (_, index) => {
    const close = market.price + Math.sin(index / 3) * market.price * 0.0005;
    const open = index === 0 ? close : market.price + Math.sin((index - 1) / 3) * market.price * 0.0005;
    const spread = market.price * 0.00018;
    return { time: now - (35 - index) * 1500, price: close, open, high: Math.max(open, close) + spread, low: Math.min(open, close) - spread, close, volume: 240 + (index % 7) * 85 };
  });
}
