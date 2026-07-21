import { describe, it, expect } from 'vitest';
import { badgesEarnedForStreak } from './milestones';

describe('badgesEarnedForStreak', () => {
  it('otorga first_week al llegar a 7 días y no lo repite si ya se tenía', () => {
    expect(badgesEarnedForStreak({ newStreakDays: 7, alreadyEarnedCodes: [] })).toEqual(['first_week']);
    expect(badgesEarnedForStreak({ newStreakDays: 7, alreadyEarnedCodes: ['first_week'] })).toEqual([]);
  });

  it('otorga streak_30 al llegar a 30 días', () => {
    expect(badgesEarnedForStreak({ newStreakDays: 30, alreadyEarnedCodes: ['first_week'] })).toEqual(['streak_30']);
  });

  it('otorga múltiples insignias si se saltan varios umbrales de una vez', () => {
    expect(badgesEarnedForStreak({ newStreakDays: 30, alreadyEarnedCodes: [] })).toEqual(['first_week', 'streak_30']);
  });
});
