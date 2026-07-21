import { describe, it, expect } from 'vitest';
import { projectWeeksToGoal } from './weightProjection';

describe('projectWeeksToGoal', () => {
  it('estima semanas para bajar de peso a partir del déficit calórico semanal', () => {
    // déficit diario de 500 kcal ≈ 0.45 kg/semana (7700 kcal ≈ 1kg de grasa)
    const weeks = projectWeeksToGoal({ currentWeightKg: 85, targetWeightKg: 75, dailyCalorieDeficit: 500 });
    expect(weeks).toBeCloseTo((85 - 75) / (500 * 7 / 7700), 0);
  });

  it('devuelve null si el objetivo va en dirección contraria al superávit/déficit actual', () => {
    const weeks = projectWeeksToGoal({ currentWeightKg: 75, targetWeightKg: 85, dailyCalorieDeficit: 500 });
    expect(weeks).toBeNull();
  });

  it('devuelve 0 si ya se alcanzó el peso objetivo', () => {
    expect(projectWeeksToGoal({ currentWeightKg: 75, targetWeightKg: 75, dailyCalorieDeficit: 500 })).toBe(0);
  });
});
