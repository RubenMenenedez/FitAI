import { describe, it, expect } from 'vitest';
import { computeStreakUpdate } from './streakLogic';

describe('computeStreakUpdate', () => {
  it('incrementa la racha si el último registro fue ayer', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-19', currentStreakDays: 4, longestStreakDays: 4 });
    expect(result).toEqual({ currentStreakDays: 5, longestStreakDays: 5, lastLoggedDate: '2026-07-20' });
  });

  it('no hace nada si ya se registró hoy', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-20', currentStreakDays: 4, longestStreakDays: 4 });
    expect(result).toEqual({ currentStreakDays: 4, longestStreakDays: 4, lastLoggedDate: '2026-07-20' });
  });

  it('reinicia la racha a 1 si se rompió (gap > 1 día)', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-10', currentStreakDays: 8, longestStreakDays: 8 });
    expect(result).toEqual({ currentStreakDays: 1, longestStreakDays: 8, lastLoggedDate: '2026-07-20' });
  });

  it('actualiza longestStreakDays cuando la racha actual lo supera', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-19', currentStreakDays: 10, longestStreakDays: 8 });
    expect(result.longestStreakDays).toBe(11);
  });

  it('primer registro (sin lastLoggedDate previo) inicia racha en 1', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: null, currentStreakDays: 0, longestStreakDays: 0 });
    expect(result).toEqual({ currentStreakDays: 1, longestStreakDays: 1, lastLoggedDate: '2026-07-20' });
  });
});
