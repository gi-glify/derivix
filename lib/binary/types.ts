import type { BinaryContractType } from "./rules";

export type BinaryIndex = { symbol: string; name: string; precision: number; base_price: number };
export type BinaryTick = { sequence: number; value: number; digit: number; created_at: string };
export type BinaryContract = {
  id: string;
  symbol: string;
  contract_type: BinaryContractType;
  prediction: number | null;
  stake: number;
  payout: number;
  duration_ticks: number;
  opening_tick: BinaryTick;
  final_tick: BinaryTick | null;
  final_digit: number | null;
  status: "OPEN" | "WON" | "LOST" | "CANCELLED";
  created_at: string;
  settled_at: string | null;
  settles_at: string;
};

export type BinaryState = {
  indices: BinaryIndex[];
  ticks: Record<string, BinaryTick[]>;
  contracts: BinaryContract[];
  balance: { total: number; reserved: number; available: number; currency: string; mode: "demo" };
};
