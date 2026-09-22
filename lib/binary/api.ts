import { supabase } from "@/lib/supabase";
import type { BinaryState } from "./types";

export type BinaryAction = "markets" | "state" | "history" | "create" | "settle";
export async function binaryRequest<T = BinaryState>(action: BinaryAction, payload: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error("Binary Demo needs the configured account service.");
  const { data, error } = await supabase.rpc("binary_api", { p_action: action, p_payload: payload });
  if (error) {
    if (error.code === "PGRST202") throw new Error("Binary Demo is awaiting backend setup.");
    throw new Error(error.message);
  }
  return data as T;
}
