import { supermarketPrices } from '../db/schema';
import type { Scraper } from './scraper';
import { matchScrapedProductToFoodItem } from './priceMatcher';
import type { FoodItemCandidate } from '../db/seed/matchFoodItem';

export interface RunScrapeJobInput {
  scraper: Scraper;
  queries: string[];
  foodItemCandidates: FoodItemCandidate[];
  db: { insert: (table: any) => { values: (rows: any) => Promise<unknown> } };
}

export async function runScrapeJob(input: RunScrapeJobInput) {
  const failedQueries: string[] = [];

  for (const query of input.queries) {
    let products;
    try {
      products = await input.scraper.searchProduct(query);
    } catch (err) {
      // Si el scraper falla o es bloqueado, se registra y se continúa con la siguiente
      // query en vez de interrumpir el job completo (sección 10.5).
      console.error(`scrape falló para "${query}" en ${input.scraper.supermarket}:`, err);
      failedQueries.push(query);
      continue;
    }

    const rows = products
      .map((p) => {
        const match = matchScrapedProductToFoodItem(p.productNameRaw, input.foodItemCandidates);
        if (!match) return null;
        return {
          foodItemId: match.id,
          supermarket: input.scraper.supermarket,
          productNameRaw: p.productNameRaw,
          price: String(p.price),
          packageSizeG: String(p.packageSizeG),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) {
      await input.db.insert(supermarketPrices).values(rows);
    }
  }

  return { failedQueries };
}
