import { supabase } from "@/lib/supabase";
import type { BinaryState } from "./types";
import { accountRequest } from '@/lib/account/api';
import { parseBinarySnapshot } from './snapshot';

export type BinaryAction = "markets" | "state" | "history" | "tick" | "create" | "settle";
export async function binaryRequest<T = BinaryState>(action: BinaryAction, payload: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error("Binary Demo needs the configured account service.");
  const { data, error } = await supabase.rpc("binary_api", { p_action: action, p_payload: payload });
  if (error) {
    if (error.code === "PGRST202") throw new Error("Binary Demo is awaiting backend setup.");
    throw new Error(error.message);
  }
  return data as T;
}

export async function loadBinarySnapshot(): Promise<BinaryState> {
  if (!supabase) throw new Error("Binary Demo needs the configured account service.");
  const [stateResult, markets, account] = await Promise.all([
    supabase.rpc('binary_state'), binaryRequest<unknown>('markets'), accountRequest<unknown>('summary'),
  ]);
  if (stateResult.error) throw new Error(stateResult.error.message);
  const state = stateResult.data;
  return parseBinarySnapshot(state, markets, account);
}

export async function advanceBinaryTicks(): Promise<void> {
  if (!supabase) throw new Error("Binary Demo needs the configured account service.");
  const { error } = await supabase.rpc('binary_advance_ticks');
  if (error) throw new Error(error.message);
}
