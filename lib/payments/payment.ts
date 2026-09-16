export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REVERSED';
export type Payment = { id: string; client_request_id?: string; reference: string; amount: number; currency: string; phone: string; status: PaymentStatus; created_at: string; updated_at: string; failure_reason: string | null; provider_reference: string | null };
export function normalizePhone(input: string) {
  let phone = input.replace(/[\s()+-]/g, '');
  if (/^0[17]\d{8}$/.test(phone)) phone = `254${phone.slice(1)}`;
  if (!/^254[17]\d{8}$/.test(phone)) throw new Error('Enter a Kenyan mobile number, such as 0712 345 678.');
  return phone;
}
export function validateAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > 150000) throw new Error('Enter a whole amount between KES 100 and KES 150,000.');
  return amount;
}
export const pendingPayment = (status: PaymentStatus) => status === 'PENDING' || status === 'PROCESSING';
export function paymentLabel(status: PaymentStatus, seconds: number) {
  if (status === 'COMPLETED') return 'Payment received';
  if (status === 'REVERSED') return 'Payment reversed';
  if (status === 'FAILED') return 'Payment failed';
  if (status === 'CANCELLED') return 'Payment cancelled';
  if (status === 'EXPIRED') return 'Payment expired';
  if (seconds > 120) return 'Still awaiting provider confirmation';
  return status === 'PROCESSING' ? 'Approve the M-Pesa prompt on your phone' : 'Preparing your payment request';
}
