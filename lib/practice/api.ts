import { supabase } from "@/lib/supabase";
export type PracticeMode = "loss" | "win";
export type PracticeOrder = { id: string; symbol: string; side: "BUY" | "SELL"; stake: number; entry_price: number; exit_price: number; pnl: number; status: "OPEN" | "CLOSED"; opened_at: string; settles_at: string; closed_at: string | null };
export type PracticeState = { mode: PracticeMode; credits: number; serverTime: string; orders: PracticeOrder[] };
export async function practiceRequest(action: "state" | "open" | "settle" | "reset", mode: PracticeMode | null, payload: Record<string, unknown> = {}): Promise<PracticeState> {
  if (!supabase) throw new Error("Practice markets need the configured account service. No virtual credits have been changed.");
  const { data, error } = await supabase.rpc("practice_api", { p_action: action, p_mode: mode, p_payload: payload });
  if (error) {
    if (error.code === "42501") throw new Error(error.message);
    if (error.code === "PGRST202") throw new Error("Practice markets are awaiting backend setup. Apply the practice and operations migration to enable this page.");
    throw new Error(error.message);
  }
  return data as PracticeState;
}
