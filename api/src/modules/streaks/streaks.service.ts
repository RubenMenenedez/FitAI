import { db } from '../../db/client';
import { streaks, milestones, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { computeStreakUpdate } from './streakLogic';
import { badgesEarnedForStreak } from './milestones';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function logActivityForStreak(userId: string) {
  let [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId));
  if (!streak) {
    [streak] = await db.insert(streaks).values({ userId, currentStreakDays: 0, longestStreakDays: 0 }).returning();
  }
  if (!streak) throw new Error('failed to create streak');

  const update = computeStreakUpdate({
    today: todayIso(),
    lastLoggedDate: streak.lastLoggedDate,
    currentStreakDays: streak.currentStreakDays ?? 0,
    longestStreakDays: streak.longestStreakDays ?? 0,
  });

  await db.update(streaks).set(update).where(eq(streaks.userId, userId));

  const existingBadges = await db.select().from(milestones).where(eq(milestones.userId, userId));
  const newBadgeCodes = badgesEarnedForStreak({ newStreakDays: update.currentStreakDays, alreadyEarnedCodes: existingBadges.map((b) => b.badgeCode) });
  if (newBadgeCodes.length > 0) {
    await db.insert(milestones).values(newBadgeCodes.map((code) => ({ userId, badgeCode: code })));
  }

  return { ...update, newBadges: newBadgeCodes };
}

// Restaurar racha (premium): solo si se saltó exactamente un día (gap == 2) y hay suscripción activa.
export async function restoreStreak(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('user not found');
  if (user.subscriptionStatus === 'free') {
    throw Object.assign(new Error('premium required'), { code: 'PREMIUM_REQUIRED' });
  }
  const [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId));
  if (!streak?.lastLoggedDate) throw new Error('no streak to restore');

  const gapDays = Math.round((new Date(todayIso()).getTime() - new Date(streak.lastLoggedDate).getTime()) / (1000 * 60 * 60 * 24));
  if (gapDays !== 2) throw new Error('streak is not in a restorable state');

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [updated] = await db.update(streaks).set({ lastLoggedDate: yesterday }).where(eq(streaks.userId, userId)).returning();
  return updated;
}
