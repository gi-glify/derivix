import type { Market, PricePoint } from "./types";

export const HISTORY_POINTS = 24 * 30 * 4;
const HISTORY_INTERVAL = 60 * 60 * 1000;

export function seedMarketHistory(market: Market, now = Date.now(), variation = 0): PricePoint[] {
  let seed = [...market.symbol].reduce((value, char) => value * 31 + char.charCodeAt(0), 7) >>> 0;
  seed = (seed + variation) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let previous = market.price;
  let drift = 0;
  let volatility = .0012;
  let remaining = 0;
  const history = Array.from({ length: HISTORY_POINTS }, (_, index) => {
    if (remaining-- <= 0) {
      drift = (random() - .5) * .00065;
      volatility = .0004 + random() * .002;
      remaining = 12 + Math.floor(random() * 48);
    }
    const open = previous;
    const close = Math.max(market.price * .1, open * (1 + drift + (random() - .5) * volatility));
    previous = close;
    return { time: now - (HISTORY_POINTS - 1 - index) * HISTORY_INTERVAL, price: close, open, high: Math.max(open, close) + open * random() * volatility * .45, low: Math.min(open, close) - open * random() * volatility * .45, close, volume: 150 + random() * 900 + Math.abs(close - open) / open * 500000 };
  });
  // Anchor the illustrative history to the current quote, avoiding a jump at the first live tick.
  const scale = market.price / previous;
  return history.map(point => ({ ...point, price: point.price * scale, open: point.open * scale, high: point.high * scale, low: point.low * scale, close: point.close * scale }));
}
