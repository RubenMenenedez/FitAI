import { describe, it, expect } from 'vitest';
import { isUnderDailyLimit, FREE_DAILY_PHOTO_LIMIT } from './dailyLimit';

describe('isUnderDailyLimit', () => {
  it('premium siempre puede', () => expect(isUnderDailyLimit({ subscriptionStatus: 'monthly', countToday: 50 })).toBe(true));
  it('free por debajo del límite puede', () => expect(isUnderDailyLimit({ subscriptionStatus: 'free', countToday: FREE_DAILY_PHOTO_LIMIT - 1 })).toBe(true));
  it('free en el límite se bloquea', () => expect(isUnderDailyLimit({ subscriptionStatus: 'free', countToday: FREE_DAILY_PHOTO_LIMIT })).toBe(false));
});
