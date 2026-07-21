import { describe, it, expect } from 'vitest';
import { mapRevenueCatEventToStatus, verifyWebhookAuth } from './revenueCatWebhook';

describe('mapRevenueCatEventToStatus', () => {
  it('mapea INITIAL_PURCHASE de premium_monthly a monthly', () => {
    expect(mapRevenueCatEventToStatus({ type: 'INITIAL_PURCHASE', product_id: 'premium_monthly' })).toBe('monthly');
  });
  it('mapea RENEWAL de premium_annual a annual', () => {
    expect(mapRevenueCatEventToStatus({ type: 'RENEWAL', product_id: 'premium_annual' })).toBe('annual');
  });
  it('mapea CANCELLATION/EXPIRATION a free', () => {
    expect(mapRevenueCatEventToStatus({ type: 'EXPIRATION', product_id: 'premium_monthly' })).toBe('free');
    expect(mapRevenueCatEventToStatus({ type: 'CANCELLATION', product_id: 'premium_annual' })).toBe('free');
  });
});

describe('verifyWebhookAuth', () => {
  it('acepta el header Authorization si coincide con el secreto', () => {
    expect(verifyWebhookAuth('Bearer secret-123', 'secret-123')).toBe(true);
  });
  it('rechaza si no coincide', () => {
    expect(verifyWebhookAuth('Bearer wrong', 'secret-123')).toBe(false);
  });
});
