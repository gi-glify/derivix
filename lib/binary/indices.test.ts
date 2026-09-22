import { describe, expect, it } from 'vitest';
import { BINARY_INDEX_CATALOGUE } from './indices';

describe('Binary volatility index catalogue', () => {
  it('contains every requested standard and one-second volatility index', () => {
    expect(BINARY_INDEX_CATALOGUE).toHaveLength(14);
    expect(BINARY_INDEX_CATALOGUE.filter(index => index.tickIntervalMs === 2000)).toHaveLength(6);
    expect(BINARY_INDEX_CATALOGUE.filter(index => index.tickIntervalMs === 1000)).toHaveLength(8);
  });

  it('assigns stronger movement to higher volatility indices', () => {
    const low = BINARY_INDEX_CATALOGUE.find(index => index.symbol === 'V10_1S');
    const high = BINARY_INDEX_CATALOGUE.find(index => index.symbol === 'V250_1S');
    expect(low?.movementScale).toBeLessThan(high?.movementScale ?? 0);
  });
});
