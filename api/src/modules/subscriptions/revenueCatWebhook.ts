export type SubscriptionStatus = 'free' | 'monthly' | 'annual';

const ACTIVE_EVENT_TYPES = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'];
const INACTIVE_EVENT_TYPES = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

export function mapRevenueCatEventToStatus(event: { type: string; product_id: string }): SubscriptionStatus {
  if (INACTIVE_EVENT_TYPES.includes(event.type)) return 'free';
  if (!ACTIVE_EVENT_TYPES.includes(event.type)) return 'free';
  // Product ids in the RevenueCat dashboard: 'yearly' and 'monthly'.
  return event.product_id === 'yearly' ? 'annual' : 'monthly';
}

export function verifyWebhookAuth(authHeader: string | undefined, expectedSecret: string): boolean {
  return authHeader === `Bearer ${expectedSecret}`;
}
