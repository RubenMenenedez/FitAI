import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeOnboarding } from './users.service';
import { db } from '../../db/client';

vi.mock('../../db/client', () => ({
  db: { update: vi.fn(), where: vi.fn(), set: vi.fn(), returning: vi.fn() },
}));

describe('completeOnboarding', () => {
  it('calcula y persiste daily_calorie_target y macros a partir de los datos del onboarding', async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'u1', dailyCalorieTarget: '1650' }]),
    };
    (db.update as any).mockReturnValue(chain);

    const result = await completeOnboarding('u1', {
      sex: 'male', birthDate: '1996-01-15', heightCm: 180, weightKg: 80,
      activityLevel: 'moderate', goal: 'lose_fat', mealsPerDay: '3',
    });

    expect(chain.set).toHaveBeenCalled();
    const setArg = chain.set.mock.calls[0]![0];
    expect(Number(setArg.dailyCalorieTarget)).toBeGreaterThan(0);
    expect(Number(setArg.dailyProteinTargetG)).toBeGreaterThan(0);
    expect(result!.id).toBe('u1');
  });
});
