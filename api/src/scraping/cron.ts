import cron from 'node-cron';
import { db } from '../db/client';
import { foodItems } from '../db/schema';
import { walmartScraper } from './walmartScraper';
import { runScrapeJob } from './runScrapeJob';

// Corre a las 06:00 y a las 18:00 (1-2 veces al día, sección 10.1) — nunca en tiempo real por request de usuario.
const CRON_EXPRESSION = '0 6,18 * * *';

// Lista inicial de queries frecuentes; en una iteración posterior se puede derivar
// dinámicamente de los food_items más usados en meal_plan_items.
const SEARCH_QUERIES = ['pechuga de pollo', 'arroz blanco', 'huevo', 'atun'];

export function scheduleSupermarketScraping() {
  cron.schedule(CRON_EXPRESSION, async () => {
    const candidates = await db.select({ id: foodItems.id, nameNormalized: foodItems.nameNormalized }).from(foodItems);
    const result = await runScrapeJob({ scraper: walmartScraper, queries: SEARCH_QUERIES, foodItemCandidates: candidates, db: db as any });
    if (result.failedQueries.length > 0) {
      console.warn('queries fallidas en el scrape job:', result.failedQueries);
    }
  });
}
