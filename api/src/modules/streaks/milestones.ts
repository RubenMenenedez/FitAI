const STREAK_BADGE_THRESHOLDS: { days: number; code: string }[] = [
  { days: 7, code: 'first_week' },
  { days: 30, code: 'streak_30' },
  { days: 100, code: 'streak_100' },
];

export function badgesEarnedForStreak(input: { newStreakDays: number; alreadyEarnedCodes: string[] }): string[] {
  return STREAK_BADGE_THRESHOLDS
    .filter((t) => input.newStreakDays >= t.days && !input.alreadyEarnedCodes.includes(t.code))
    .map((t) => t.code);
}
