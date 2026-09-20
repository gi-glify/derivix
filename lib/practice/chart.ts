import type { PricePoint } from "../demo/types";
import type { PracticeOrder } from "./api";

const TICK_MS = 500;
const MAX_IDLE_TICKS = 600;

/** Bounded, repeatable illustrative motion; it never determines order results. */
function idleTicks(base: number, start: number, now: number, seed: number): PricePoint[] {
  const count = Math.max(0, Math.floor((now - start) / TICK_MS));
  const phase = (seed % 1000) / 100;
  const wave = (tick: number) => Math.sin(tick * .31 + phase) * .0003 + Math.sin(tick * .077 + phase) * .0006;
  const price = (tick: number) => base * (1 + wave(tick) - wave(0));
  return Array.from({ length: Math.min(count, MAX_IDLE_TICKS) }, (_, index) => {
    const tick = Math.max(1, count - MAX_IDLE_TICKS + 1) + index;
    const open = price(tick - 1);
    const close = price(tick);
    const wick = base * .000025 * (1 + Math.abs(Math.sin(tick + phase)));
    return { time: start + tick * TICK_MS, price: close, open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick, volume: 150 + Math.abs(Math.sin(tick + phase)) * 500 };
  });
}

export function practiceChartPoints(history: PricePoint[], order: PracticeOrder | undefined, now: number, seed: number): PricePoint[] {
  const last = history.at(-1);
  if (!last) return [];
  if (!order) return [...history, ...idleTicks(last.close, last.time, now, seed)];

  const start = Date.parse(order.opened_at);
  const end = Date.parse(order.settles_at);
  const duration = Math.max(1, end - start);
  const elapsed = order.status === "CLOSED" ? duration : Math.max(0, Math.min(duration, now - start));
  const base = Number(order.entry_price);
  const exit = Number(order.exit_price);
  const ticks: PricePoint[] = [];
  let previous = base;
  const times = Array.from({ length: Math.floor(elapsed / TICK_MS) + 1 }, (_, i) => i * TICK_MS);
  if (elapsed === duration && times.at(-1) !== duration) times.push(duration);
  for (const ms of times) {
    const progress = ms / duration;
    const movement = progress + Math.sin(progress * Math.PI * 6) * .025 * (1 - progress);
    const close = base + (exit - base) * Math.max(0, movement);
    const wick = base * .00008 * (.4 + Math.abs(Math.sin(ms + seed)));
    ticks.push({ time: start + ms, price: close, open: previous, close, high: Math.max(previous, close) + wick, low: Math.min(previous, close) - wick, volume: 300 + Math.abs(Math.sin(ms + seed)) * 700 });
    previous = close;
  }
  // Awaiting settlement stays on the server's exact endpoint. Idle motion resumes
  // after confirmation and never modifies the order's recorded exit or P&L.
  return [...history, ...ticks, ...(order.status === "CLOSED" ? idleTicks(exit, end, now, seed) : [])];
}
