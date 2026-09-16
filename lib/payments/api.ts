import { supabase } from '@/lib/supabase';
import type { Payment } from './payment';
export async function paymentRequest(body: Record<string, unknown>): Promise<{ payment?: Payment; payments?: Payment[]; enabled?: boolean; purpose?: string; warning?: string }> {
  if (!supabase) throw new Error('Please configure your account connection first.');
  const { data,error } = await supabase.functions.invoke('mpesa-deposit',{ body });
  if (error) {
    let message = 'Unable to reach the payment service. Check your payment history before trying again.';
    if (error.context instanceof Response) { try { const result = await error.context.json(); if (result.error) message = result.error; } catch { /* Preserve useful fallback. */ } }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
