import { describe, it, expect } from 'vitest';
import { normalizeName } from './normalizeName';

describe('normalizeName', () => {
  it('pasa a minúsculas y quita espacios extra', () => {
    expect(normalizeName('Chicken Breast,  Raw')).toBe('chicken breast, raw');
  });
  it('quita marcas entre paréntesis', () => {
    expect(normalizeName('Peanut Butter (Jif)')).toBe('peanut butter');
  });
});
