import { supabase } from "@/lib/supabase";
import type { AccountMode, AccountSummary, BalanceReservation, LedgerEntry } from "./types";

export type AccountAction = "summary" | "ledger" | "reservations" | "reserve" | "release" | "grant_demo_credit";
export type AccountResponse = { summary: AccountSummary; entries: LedgerEntry[]; reservations: BalanceReservation[] };

export async function accountRequest<T = AccountResponse>(action: AccountAction, payload: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error("Configure the account service before using the account balance.");
  const { data, error } = await supabase.rpc("account_api", { p_action: action, p_payload: payload });
  if (error) {
    if (error.code === "PGRST202") throw new Error("The universal account service is awaiting backend setup.");
    throw new Error(error.message);
  }
  return data as T;
}

export type AccountState = { summary: AccountSummary; mode: AccountMode };
