import { describe, it, expect } from 'vitest';
import { calculateBmi, classifyBmi } from './bmiCalculator';

describe('calculateBmi', () => {
  it('calcula IMC = peso / altura_m^2', () => {
    expect(calculateBmi({ weightKg: 80, heightCm: 180 })).toBeCloseTo(80 / (1.8 * 1.8));
  });
});

describe('classifyBmi', () => {
  it('clasifica bajo peso', () => expect(classifyBmi(17)).toBe('underweight'));
  it('clasifica normal', () => expect(classifyBmi(22)).toBe('normal'));
  it('clasifica sobrepeso', () => expect(classifyBmi(27)).toBe('overweight'));
  it('clasifica obesidad', () => expect(classifyBmi(32)).toBe('obese'));
});
