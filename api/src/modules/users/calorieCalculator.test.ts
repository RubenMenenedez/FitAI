import { describe, it, expect } from 'vitest';
import { calculateBmr, calculateTdee, calculateCalorieTarget, calculateMacros } from './calorieCalculator';

describe('calculateBmr', () => {
  it('calcula TMB para un hombre (Mifflin-St Jeor)', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 })).toBeCloseTo(1780);
  });

  it('calcula TMB para una mujer (Mifflin-St Jeor)', () => {
    // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
    expect(calculateBmr({ sex: 'female', weightKg: 65, heightCm: 165, age: 28 })).toBeCloseTo(1380.25);
  });
});

describe('calculateTdee', () => {
  it('multiplica TMB por el factor de actividad', () => {
    expect(calculateTdee(1780, 'moderate')).toBeCloseTo(1780 * 1.55);
  });
});

describe('calculateCalorieTarget', () => {
  it('aplica déficit del 17.5% (punto medio de 15-20%) para bajar grasa', () => {
    expect(calculateCalorieTarget(2000, 'lose_fat')).toBeCloseTo(2000 * 0.825);
  });
  it('no cambia las calorías para mantener', () => {
    expect(calculateCalorieTarget(2000, 'maintain')).toBeCloseTo(2000);
  });
  it('aplica superávit del 12.5% (punto medio de 10-15%) para ganar músculo', () => {
    expect(calculateCalorieTarget(2000, 'gain_muscle')).toBeCloseTo(2000 * 1.125);
  });
});

describe('calculateMacros', () => {
  it('reparte proteína, grasa y carbos para bajar grasa', () => {
    // proteína 2.2 g/kg (punto medio de 2.0-2.4), grasa 27.5% (punto medio de 25-30%)
    const macros = calculateMacros({ weightKg: 80, dailyCalories: 1650, goal: 'lose_fat' });
    expect(macros.proteinG).toBeCloseTo(80 * 2.2);
    const fatCalories = 1650 * 0.275;
    expect(macros.fatG).toBeCloseTo(fatCalories / 9);
    const proteinCalories = macros.proteinG * 4;
    const carbCalories = 1650 - proteinCalories - fatCalories;
    expect(macros.carbsG).toBeCloseTo(carbCalories / 4);
  });
});
