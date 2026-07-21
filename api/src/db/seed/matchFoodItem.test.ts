import { describe, it, expect } from 'vitest';
import { findBestFoodItemMatch } from './matchFoodItem';

describe('findBestFoodItemMatch', () => {
  const candidates = [
    { id: '1', nameNormalized: 'chicken breast, raw' },
    { id: '2', nameNormalized: 'white rice, cooked' },
  ];

  it('encuentra la coincidencia más cercana por substring', () => {
    const match = findBestFoodItemMatch('chicken breast', candidates);
    expect(match?.id).toBe('1');
  });

  it('devuelve undefined si no hay ninguna coincidencia razonable', () => {
    const match = findBestFoodItemMatch('xyz-nonexistent', candidates);
    expect(match).toBeUndefined();
  });
});
