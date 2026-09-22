import { extractLastDigit } from "./rules";
import type { BinaryTick } from "./types";

function hash(seed: string, sequence: number): number {
  let value = 2166136261 ^ sequence;
  for (const character of seed) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return (value >>> 0) / 4294967296;
}

export function generateDemoTick(seed: string, sequence: number, previous: number, precision: number): BinaryTick {
  const random = hash(seed, sequence);
  const movement = (random - 0.5) * Math.max(previous * 0.0008, 0.0001);
  const value = Number((previous + movement).toFixed(precision));
  return { sequence, value, digit: extractLastDigit(value, precision), created_at: new Date(sequence * 1000).toISOString() };
}

export function tickDigits(ticks: BinaryTick[]): number[] {
  return ticks.map(tick => tick.digit);
}
