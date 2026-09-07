import type { PricePoint } from "./types";

export function portfolioHistory(balance: number, points: PricePoint[]): PricePoint[] {
  return balance > 0 ? points : [];
}
