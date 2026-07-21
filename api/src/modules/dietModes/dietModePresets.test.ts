import { describe, it, expect } from 'vitest';
import { applyDietModeMacros } from './dietModePresets';

describe('applyDietModeMacros', () => {
  it('modo keto: carbos <= 10%, grasa ~70%, proteína ~20%', () => {
    const macros = applyDietModeMacros({ dietMode: 'keto', weightKg: 80, dailyCalories: 2000 });
    const carbCalories = macros.carbsG * 4;
    expect(carbCalories / 2000).toBeLessThanOrEqual(0.10 + 1e-6);
    expect((macros.fatG * 9) / 2000).toBeCloseTo(0.70, 1);
    expect((macros.proteinG * 4) / 2000).toBeCloseTo(0.20, 1);
  });

  it('modo alta proteína: 2.2-2.6 g/kg', () => {
    const macros = applyDietModeMacros({ dietMode: 'high_protein', weightKg: 80, dailyCalories: 2000 });
    expect(macros.proteinG).toBeCloseTo(80 * 2.4);
  });

  it('modo standard delega en el reparto por defecto de la sección 5.4', () => {
    const macros = applyDietModeMacros({ dietMode: 'standard', weightKg: 80, dailyCalories: 2000, goal: 'maintain' });
    expect(macros.proteinG).toBeCloseTo(80 * 1.8);
  });
});
