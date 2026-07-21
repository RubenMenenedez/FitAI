import { describe, it, expect } from 'vitest';
import { matchScrapedProductToFoodItem } from './priceMatcher';

const foodItems = [
  { id: 'f1', nameNormalized: 'chicken breast, raw' },
  { id: 'f2', nameNormalized: 'white rice, raw' },
];

describe('matchScrapedProductToFoodItem', () => {
  it('normaliza el nombre del producto scrapeado y encuentra el food_item más cercano', () => {
    const match = matchScrapedProductToFoodItem('Pechuga de Pollo 1kg', foodItems, { 'pechuga de pollo': 'chicken breast' });
    expect(match?.id).toBe('f1');
  });

  it('devuelve undefined si no hay traducción ni coincidencia razonable', () => {
    const match = matchScrapedProductToFoodItem('Producto totalmente desconocido', foodItems, {});
    expect(match).toBeUndefined();
  });
});
