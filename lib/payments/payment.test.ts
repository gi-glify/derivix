import { describe, expect, it } from 'vitest';
import { normalizePhone, validateAmount, paymentLabel } from './payment';
describe('M-Pesa deposit inputs and truthful status', () => {
 it('normalizes Kenyan mobile formats',()=>{for(const phone of ['0712345678','+254712345678','254712345678','0712 345 678']) expect(normalizePhone(phone)).toBe('254712345678');expect(normalizePhone('0112345678')).toBe('254112345678');});
 it('rejects invalid or foreign phone numbers',()=>{for(const phone of ['','123','+255712345678','254212345678'])expect(()=>normalizePhone(phone)).toThrow();});
 it('rejects non-finite, fractional and out-of-range amounts',()=>{for(const amount of [NaN,Infinity,0,99,100.5,150001])expect(()=>validateAmount(amount)).toThrow();expect(validateAmount(100)).toBe(100);});
 it('never turns elapsed time into confirmed payment',()=>{expect(paymentLabel('PENDING',300)).toContain('confirmation');expect(paymentLabel('COMPLETED',1)).toBe('Payment received');expect(paymentLabel('REVERSED',1)).toBe('Payment reversed');});
});
