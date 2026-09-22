import { describe, expect, it } from 'vitest';
import { parseBinarySnapshot, digitFrequencies, displayQuote } from './snapshot';

const markets = { indices: [{ symbol: 'V50_1S', name: 'Volatility 50 (1s) Index', precision: 2, base_price: '123.40' }] };
const account = { summary: { total: '100', reserved: '10', available: '90', currency: 'KES', mode: 'demo' } };
describe('Binary RPC responses', () => {
  it('loads indices separately from the actual state response', () => {
    const result = parseBinarySnapshot({ contracts: [], ticks: {} }, markets, account);
    expect(result.indices.find(i => i.symbol === 'V50_1S')?.base_price).toBe(123.4);
    expect(result.balance.available).toBe(90);
    expect(result.contracts).toEqual([]);
  });
  it('keeps the configured tick interval and movement scale for each index', () => {
    const configuredMarkets = { indices: [{ symbol: 'V10', name: 'Volatility 10 Index', precision: 2, base_price: '100', tick_interval_ms: 2000, movement_scale: '0.1' }] };
    const result = parseBinarySnapshot({ contracts: [], ticks: {} }, configuredMarkets, account);
    expect(result.indices[0]).toMatchObject({ tick_interval_ms: 2000, movement_scale: 0.1 });
  });
  it('normalizes numeric SQL fields in settled history', () => {
    const result = parseBinarySnapshot({ contracts: [{ id: 'c', symbol: 'V50_1S', contract_type: 'EVEN', prediction: null, stake: '10', payout: '19.60', duration_ticks: 1, opening_value: '123.40', final_value: '123.42', final_digit: 2, status: 'WON', created_at: '2026-09-22T00:00:00Z', settles_at: '2026-09-22T00:00:01Z', settled_at: '2026-09-22T00:00:01Z' }], ticks: null }, markets, account);
    expect(result.contracts[0].payout.toFixed(2)).toBe('19.60');
    expect(result.contracts[0].status).toBe('WON');
    expect(result.ticks).toEqual({});
  });
  it('rejects invalid responses rather than showing a made-up zero balance', () => {
    expect(() => parseBinarySnapshot(null, markets, account)).toThrow();
    expect(() => parseBinarySnapshot({ contracts: [], ticks: {} }, markets, { summary: null })).toThrow();
  });
  it('shows measured frequencies including zero; empty history has no percentages', () => {
    expect(digitFrequencies([])).toEqual(Array(10).fill(null));
    expect(digitFrequencies([2, 2, 4])[2]).toBeCloseTo(66.6667);
    expect(digitFrequencies([2, 2, 4])[0]).toBe(0);
  });
  it('preserves trailing zero digits in displayed quotes', () => {
    expect(displayQuote(123.4, 2)).toBe('123.40');
    expect(displayQuote(null, 2)).toBe('—');
  });
});
