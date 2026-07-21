import { describe, it, expect } from 'vitest';
import { aggregateGramsByFoodItem, suggestBestPackage } from './shoppingList.service';

describe('aggregateGramsByFoodItem', () => {
  it('suma los gramos de un mismo food_item a través de todos los meal_plan_items', () => {
    const items = [
      { foodItemId: 'chicken', grams: 150 },
      { foodItemId: 'rice', grams: 100 },
      { foodItemId: 'chicken', grams: 200 },
    ];
    const result = aggregateGramsByFoodItem(items);
    expect(result.get('chicken')).toBe(350);
    expect(result.get('rice')).toBe(100);
  });
});

describe('suggestBestPackage', () => {
  it('elige la presentación que genera menor sobrante respecto al total necesitado', () => {
    const packages = [
      { packageSizeG: 500, price: 45, productNameRaw: 'bolsa 500g' },
      { packageSizeG: 1000, price: 85, productNameRaw: 'bolsa 1kg' },
    ];
    const suggestion = suggestBestPackage(600, packages);
    expect(suggestion?.packageSizeG).toBe(1000);
  });

  it('para 350g necesitados, prefiere 1x500g (sobrante 150g) sobre comprar 1kg (sobrante 650g)', () => {
    const packages = [
      { packageSizeG: 500, price: 45, productNameRaw: 'bolsa 500g' },
      { packageSizeG: 1000, price: 85, productNameRaw: 'bolsa 1kg' },
    ];
    const suggestion = suggestBestPackage(350, packages);
    expect(suggestion?.packageSizeG).toBe(500);
  });
});
