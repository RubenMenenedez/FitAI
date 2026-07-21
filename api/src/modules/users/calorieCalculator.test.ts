import { describe, it, expect } from 'vitest';
import { calculateBmr, calculateTdee, calculateCalorieTarget, calculateMacros, calculateTargetCalories } from './calorieCalculator';

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

  it('reparte proteína, grasa y carbos para mantener', () => {
    // proteína 1.8 g/kg (punto medio de 1.6-2.0), grasa 27.5% (punto medio de 25-30%)
    const macros = calculateMacros({ weightKg: 70, dailyCalories: 2000, goal: 'maintain' });
    expect(macros.proteinG).toBeCloseTo(70 * 1.8);
    const fatCalories = 2000 * 0.275;
    expect(macros.fatG).toBeCloseTo(fatCalories / 9);
    const proteinCalories = macros.proteinG * 4;
    const carbCalories = 2000 - proteinCalories - fatCalories;
    expect(macros.carbsG).toBeCloseTo(carbCalories / 4);
  });

  it('reparte proteína, grasa y carbos para ganar músculo', () => {
    // proteína 2.0 g/kg (punto medio de 1.8-2.2), grasa 27.5% (punto medio de 25-30%)
    const macros = calculateMacros({ weightKg: 75, dailyCalories: 2800, goal: 'gain_muscle' });
    expect(macros.proteinG).toBeCloseTo(75 * 2.0);
    const fatCalories = 2800 * 0.275;
    expect(macros.fatG).toBeCloseTo(fatCalories / 9);
    const proteinCalories = macros.proteinG * 4;
    const carbCalories = 2800 - proteinCalories - fatCalories;
    expect(macros.carbsG).toBeCloseTo(carbCalories / 4);
  });

  it('no deja que los carbohidratos bajen de 0 cuando proteína+grasa exceden las calorías diarias', () => {
    const macros = calculateMacros({ weightKg: 100, dailyCalories: 1200, goal: 'lose_fat' });
    // proteinCalories = 100*2.2*4 = 880, fatCalories = 1200*0.275 = 330, sum = 1210 > 1200
    expect(macros.carbsG).toBe(0);
  });
});

describe('calculateBmr (Katch-McArdle when body fat known)', () => {
  it('uses lean body mass when bodyFatPercent is provided', () => {
    // LBM = 80*(1-0.20)=64; BMR = 370 + 21.6*64 = 1752.4
    const bmr = calculateBmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30, bodyFatPercent: 20 });
    expect(bmr).toBeCloseTo(1752.4, 1);
  });
  it('falls back to Mifflin-St Jeor when bodyFatPercent is absent', () => {
    const bmr = calculateBmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 });
    expect(bmr).toBeCloseTo(10*80 + 6.25*180 - 5*30 + 5, 5);
  });
});

describe('calculateTargetCalories', () => {
  it('applies a rate-based deficit for fat loss', () => {
    // dailyDelta = 0.5*7700/7 = 550; 2500-550 = 1950
    expect(calculateTargetCalories({ tdee: 2500, goal: 'lose_fat', sex: 'male', weeklyRateKg: 0.5 })).toBe(1950);
  });
  it('applies a rate-based surplus for muscle gain', () => {
    expect(calculateTargetCalories({ tdee: 2500, goal: 'gain_muscle', sex: 'male', weeklyRateKg: 0.25 })).toBe(2780);
  });
  it('never goes below the safety floor', () => {
    // 1400-550=850 -> floor 1200 (female)
    expect(calculateTargetCalories({ tdee: 1400, goal: 'lose_fat', sex: 'female', weeklyRateKg: 0.5 })).toBe(1200);
  });
  it('pregnancy adds calories and ignores any deficit', () => {
    expect(calculateTargetCalories({ tdee: 2000, goal: 'lose_fat', sex: 'female', weeklyRateKg: 0.5, pregnancyStatus: 'pregnant' })).toBe(2300);
  });
  it('breastfeeding adds ~450 kcal', () => {
    expect(calculateTargetCalories({ tdee: 2000, goal: 'maintain', sex: 'female', pregnancyStatus: 'breastfeeding' })).toBe(2450);
  });
  it('maintain keeps tdee (rounded to nearest 10)', () => {
    expect(calculateTargetCalories({ tdee: 2333, goal: 'maintain', sex: 'male' })).toBe(2330);
  });
});
