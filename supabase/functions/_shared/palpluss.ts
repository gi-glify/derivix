import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
export const db = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const fields = 'id,client_request_id,reference,amount,currency,phone,status,created_at,updated_at,failure_reason,provider_reference';
export class ProviderError extends Error {
  constructor(public status: number) { super('Provider request could not be confirmed'); }
}
export async function provider(path: string, body?: unknown) {
  const key = Deno.env.get('PALPLUSS_API_KEY');
  if (!key) throw new Error('Payment provider is not configured');
  const response = await fetch(`https://api.palpluss.com/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${btoa(key + ':')}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || result.success !== true || !result.data) throw new ProviderError(response.status);
  return result.data;
}
// Callback data is only a hint. Fetch authoritative details using the merchant API key.
export async function reconcile(id: string, hintedProviderId?: string) {
  const client = db();
  const { data: item, error } = await client.from('payment_attempts').select('*').eq('id', id).not('client_request_id', 'is', null).single();
  if (error || !item) throw new Error('Payment not found');
  const providerId = item.provider_reference || hintedProviderId;
  if (!providerId || !uuid.test(providerId)) return;
  const now = new Date();
  // Atomic lease limits provider requests from polling, duplicate callbacks and refreshes.
  const { data: claimed, error: claimError } = await client.from('payment_attempts').update({ next_check_at: new Date(now.getTime() + 10000).toISOString() }).eq('id', id).or(`next_check_at.is.null,next_check_at.lte.${now.toISOString()}`).select('id').maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return;
  const transaction = await provider(`/transactions/${encodeURIComponent(providerId)}`);
  const { error: applyError } = await client.rpc('apply_mpesa_status', { p_id: id, p_transaction: transaction });
  if (applyError) throw applyError;
}
