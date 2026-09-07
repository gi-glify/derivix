export function nextTickerIndex(current: number, count: number): number {
  return count <= 0 ? 0 : (current + 1) % count;
}
