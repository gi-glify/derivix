import type { Market, Position, Side } from "./types";

export const MIN_QUANTITY = 0.01;
export const MAX_QUANTITY = 1;
export const MARGIN_RATE = 0.2;

export function calculatePnl(side: Side, entryPrice: number, currentPrice: number, quantity: number) {
  const movement = side === "BUY" ? currentPrice - entryPrice : entryPrice - currentPrice;
  return Number((movement * quantity * 100000).toFixed(2));
}

export function requiredMargin(price: number, quantity: number) {
  return Number((price * quantity * MARGIN_RATE).toFixed(2));
}

export function validateOrder(quantity: number, availableBalance: number, price: number) {
  if (quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) return "Quantity must be between 0.01 and 1.00 lots.";
  if (requiredMargin(price, quantity) > availableBalance) return "You do not have enough available margin for this trade.";
  return null;
}

export function moveMarket(market: Market, delta: number): Market {
  const price = Number((market.price + delta).toFixed(4));
  return { ...market, previousPrice: market.price, price };
}

export function refreshPosition(position: Position, market: Market): Position {
  return { ...position, currentPrice: market.price, unrealizedPnl: calculatePnl(position.side, position.entryPrice, market.price, position.quantity) };
}
