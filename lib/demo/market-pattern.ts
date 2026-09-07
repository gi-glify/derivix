import type { Market } from "./types";

export function evolveMarket(market: Market, random = Math.random): { market: Market; delta: number } {
  let trend = market.trend ?? 0;
  let volatility = market.volatility ?? 0.00035;
  let regimeTicks = (market.regimeTicks ?? 0) - 1;
  if (regimeTicks <= 0) {
    trend = random() > 0.72 ? (random() > 0.5 ? 1 : -1) : 0;
    volatility = 0.00018 + random() * 0.0022;
    regimeTicks = 3 + Math.floor(random() * 14);
  }
  let delta = market.price * (trend * volatility * 0.55 + (random() - 0.5) * volatility);
  if (random() > 0.965) delta += market.price * (random() - 0.5) * 0.012;
  return { market: { ...market, trend, volatility, regimeTicks }, delta };
}
