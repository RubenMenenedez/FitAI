export const FREE_DAILY_PHOTO_LIMIT = 2;

export function isUnderDailyLimit(input: { subscriptionStatus: string; countToday: number }): boolean {
  if (input.subscriptionStatus !== 'free') return true;
  return input.countToday < FREE_DAILY_PHOTO_LIMIT;
}
