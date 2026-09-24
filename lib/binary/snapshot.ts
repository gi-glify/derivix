import type { BinaryContract, BinaryIndex, BinaryState, BinaryTick } from './types';
import type { BinaryContractType } from './rules';
import { BINARY_INDEX_CATALOGUE } from './indices';

const invalid = () => new Error('Binary data is unavailable. Refresh to try again.');
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
}
function number(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || !Number.isFinite(Number(value))) throw invalid();
  return Number(value);
}
function string(value: unknown): string {
  if (typeof value !== 'string' || !value) throw invalid();
  return value;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw invalid();
  return value;
}
function digit(value: unknown): number {
  const result = number(value);
  if (!Number.isInteger(result) || result < 0 || result > 9) throw invalid();
  return result;
}
function timestamp(value: unknown): string {
  const result = string(value);
  if (!Number.isFinite(Date.parse(result))) throw invalid();
  return result;
}

// The SQL API deliberately returns markets, state and account summary separately.
export function parseBinarySnapshot(state: unknown, markets: unknown, account: unknown): BinaryState {
  const source = record(state);
  const indices: BinaryIndex[] = list(record(markets).indices).map(value => {
    const item = record(value);
    const precision = number(item.precision);
    if (!Number.isInteger(precision) || precision < 0 || precision > 8) throw invalid();
    const symbol = string(item.symbol);
    const fallback = BINARY_INDEX_CATALOGUE.find(index => index.symbol === symbol);
    const tick_interval_ms = number(item.tick_interval_ms ?? fallback?.tickIntervalMs ?? 1000);
    const movement_scale = number(item.movement_scale ?? fallback?.movementScale ?? 0.1);
    if (!Number.isInteger(tick_interval_ms) || tick_interval_ms < 250 || movement_scale <= 0) throw invalid();
    return { symbol, name: string(item.name), precision, base_price: number(item.base_price), tick_interval_ms, movement_scale };
  });
  const contracts: BinaryContract[] = list(source.contracts).map(value => {
    const item = record(value);
    const type = string(item.contract_type);
    const status = string(item.status);
    if (!['EVEN','ODD','OVER','UNDER','MATCHES','DIFFERS'].includes(type) || !['OPEN','WON','LOST','CANCELLED'].includes(status)) throw invalid();
    return {
      id: string(item.id), symbol: string(item.symbol), contract_type: type as BinaryContractType,
      prediction: item.prediction == null ? null : digit(item.prediction),
      stake: number(item.stake), payout: number(item.payout), duration_ticks: number(item.duration_ticks),
      opening_value: number(item.opening_value), final_value: item.final_value == null ? null : number(item.final_value),
      final_digit: item.final_digit == null ? null : digit(item.final_digit), status: status as BinaryContract['status'],
      created_at: timestamp(item.created_at), settles_at: timestamp(item.settles_at),
      settled_at: item.settled_at == null ? null : timestamp(item.settled_at),
    };
  }).sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const ticks: Record<string, BinaryTick[]> = Object.fromEntries(Object.entries(record(source.ticks ?? {})).map(([symbol, values]) => [symbol, list(values).map(value => {
    const item = record(value);
    return { sequence: number(item.sequence), value: number(item.value), digit: digit(item.digit), created_at: timestamp(item.created_at) };
  }).sort((a,b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.sequence - b.sequence).slice(-100)]));
  const summary = record(record(account).summary);
  if (summary.mode !== 'demo') throw invalid();
  const balance = { total: number(summary.total), reserved: number(summary.reserved), available: number(summary.available), currency: string(summary.currency), mode: 'demo' as const };
  if (balance.available < 0 || balance.reserved < 0 || balance.total < 0) throw invalid();
  const scenario = source.scenario == null ? 'neutral' : string(source.scenario);
  if (!['neutral','always_win','always_loss'].includes(scenario)) throw invalid();
  return { indices, contracts, ticks, balance, scenario: scenario as BinaryState['scenario'] };
}

export function digitFrequencies(digits: number[]): (number | null)[] {
  return Array.from({ length: 10 }, (_, digit) => digits.length ? digits.filter(value => value === digit).length / digits.length * 100 : null);
}

export function displayQuote(value: number | null, precision: number): string {
  return value === null ? '—' : value.toFixed(precision);
}
