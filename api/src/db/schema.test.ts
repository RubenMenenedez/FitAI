import { describe, it, expect } from 'vitest';
import { db } from './client';
import { foodItems } from './schema';

describe('db schema', () => {
  it('conecta y puede hacer un select vacío sobre food_items', async () => {
    const rows = await db.select().from(foodItems).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
