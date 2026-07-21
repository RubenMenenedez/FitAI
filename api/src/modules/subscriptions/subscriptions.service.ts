import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { SubscriptionStatus } from './revenueCatWebhook';

export async function updateSubscriptionStatus(appUserId: string, status: SubscriptionStatus) {
  await db.update(users).set({ subscriptionStatus: status }).where(eq(users.id, appUserId));
}
