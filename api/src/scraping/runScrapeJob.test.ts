import { describe, it, expect, vi } from 'vitest';
import { runScrapeJob } from './runScrapeJob';
import type { Scraper } from './scraper';

describe('runScrapeJob', () => {
  it('guarda los precios encontrados para las queries que sí resuelven', async () => {
    const insertedRows: any[] = [];
    const fakeDb = { insert: () => ({ values: (rows: any) => { insertedRows.push(...(Array.isArray(rows) ? rows : [rows])); return Promise.resolve(); } }) };
    const fakeScraper: Scraper = { supermarket: 'walmart', searchProduct: vi.fn().mockResolvedValue([{ productNameRaw: 'Pollo 1kg', price: 90, packageSizeG: 1000 }]) };

    await runScrapeJob({
      scraper: fakeScraper,
      queries: ['pollo'],
      foodItemCandidates: [{ id: 'f1', nameNormalized: 'chicken breast, raw' }],
      db: fakeDb as any,
    });

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].foodItemId).toBe('f1');
  });

  it('degrada con gracia si una query falla (no interrumpe el resto del job)', async () => {
    const insertedRows: any[] = [];
    const fakeDb = { insert: () => ({ values: (rows: any) => { insertedRows.push(...(Array.isArray(rows) ? rows : [rows])); return Promise.resolve(); } }) };
    const fakeScraper: Scraper = {
      supermarket: 'walmart',
      searchProduct: vi.fn()
        .mockRejectedValueOnce(new Error('bloqueado por el sitio'))
        .mockResolvedValueOnce([{ productNameRaw: 'Arroz 900g', price: 25, packageSizeG: 900 }]),
    };

    const result = await runScrapeJob({
      scraper: fakeScraper,
      queries: ['pollo', 'arroz'],
      foodItemCandidates: [{ id: 'f2', nameNormalized: 'white rice, raw' }],
      db: fakeDb as any,
    });

    expect(insertedRows).toHaveLength(1);
    expect(result.failedQueries).toEqual(['pollo']);
  });
});
