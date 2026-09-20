import { describe, expect, it } from "vitest";
import { practiceChartPoints } from "./chart";
import type { PracticeOrder } from "./api";

const start = Date.parse("2026-09-20T12:00:00Z");
const history = [{ time: start - 1000, price: 100, open: 100, close: 100, high: 100, low: 100, volume: 100 }];
const order: PracticeOrder = { id: "test", symbol: "XAU/USD", side: "BUY", stake: 100, entry_price: 100, exit_price: 101, pnl: 10, status: "OPEN", opened_at: new Date(start).toISOString(), settles_at: new Date(start + 12000).toISOString(), closed_at: null };

describe("practice chart motion", () => {
  it("appends moving idle prices without rewriting history or previous ticks", () => {
    const first = practiceChartPoints(history, undefined, start + 1000, 42);
    const next = practiceChartPoints(history, undefined, start + 1500, 42);
    expect(next.slice(0, first.length)).toEqual(first);
    expect(next.at(-1)?.close).not.toBe(first.at(-1)?.close);
    expect(next[0]).toEqual(history[0]);
  });
  it("takes the server preset path and holds its exact endpoint pending settlement", () => {
    const running = practiceChartPoints(history, order, start + 6000, 42);
    expect(running.at(-1)?.close).toBeCloseTo(100.5);
    const mature = practiceChartPoints(history, order, start + 12000, 42);
    expect(mature.at(-1)?.close).toBe(101);
    expect(practiceChartPoints(history, order, start + 50000, 42)).toEqual(mature);
  });
  it("resumes motion from the confirmed exit and preserves the scripted path", () => {
    const closed = { ...order, status: "CLOSED" as const };
    const mature = practiceChartPoints(history, order, start + 12000, 42);
    const next = practiceChartPoints(history, closed, start + 13000, 42);
    expect(next.slice(0, mature.length)).toEqual(mature);
    expect(next[mature.length].open).toBe(101);
    expect(next.at(-1)?.close).not.toBe(101);
    expect(order.exit_price).toBe(101);
  });
  it("bounds idle data after a long background pause", () => {
    const points = practiceChartPoints(history, undefined, start + 86400000, 42);
    expect(points).toHaveLength(601);
    expect(points.at(-1)?.time).toBe(start + 86400000);
    expect(points.every((point, i) => !i || point.time > points[i - 1].time)).toBe(true);
  });
});
