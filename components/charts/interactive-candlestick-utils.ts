export function calculateMovingAverage(values: number[], windowSize: number): Array<number | null> {
  return values.map((_, index) => {
    if (index < windowSize - 1) return null;
    const sample = values.slice(index - windowSize + 1, index + 1);
    return sample.reduce((sum, value) => sum + value, 0) / windowSize;
  });
}

export function visibleWindow<T>(values: T[], start: number, size = 20): T[] {
  if (values.length <= size) return values;
  const safeStart = Math.min(Math.max(start, 0), values.length - size);
  return values.slice(safeStart, safeStart + size);
}

export function priceBounds(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, span: Math.max(max - min, 0.0001) };
}
