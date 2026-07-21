export type SubscriptionStatus = 'free' | 'monthly' | 'annual';

const ACTIVE_EVENT_TYPES = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'];
const INACTIVE_EVENT_TYPES = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

export function mapRevenueCatEventToStatus(event: { type: string; product_id: string }): SubscriptionStatus {
  if (INACTIVE_EVENT_TYPES.includes(event.type)) return 'free';
  if (!ACTIVE_EVENT_TYPES.includes(event.type)) return 'free';
  return event.product_id === 'premium_annual' ? 'annual' : 'monthly';
}

export function verifyWebhookAuth(authHeader: string | undefined, expectedSecret: string): boolean {
  return authHeader === `Bearer ${expectedSecret}`;
}
