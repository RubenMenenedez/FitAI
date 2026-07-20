# App de Nutrición — Fase 4 (Comparador de supermercados y lista de compra) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la sección 6.3 (lista de compra) y sección 10 (scraping de supermercados) del documento: un cron que actualiza precios 1-2 veces al día, matching difuso contra `food_items`, y una lista de compra generada desde el plan semanal que cruza gramaje necesario con precio/presentación disponible, degradando con gracia si el scraper falla. Requiere la Fase 1 completa (`meal_plans`, `meal_plan_items`, `food_items`).

**Architecture:** Un scraper propio basado en Playwright (headless) corre como script de Node independiente, orquestado por `node-cron` dentro del propio proceso de la API (sin infraestructura de jobs administrada adicional en el MVP). Escribe en `supermarket_prices`. El endpoint de lista de compra suma los gramos de `meal_plan_items` por `food_item`, cruza contra los precios más recientes, y sugiere la presentación con menor sobrante.

**Tech Stack:** Mismo stack de Fases 1-3 + `playwright` (scraping), `node-cron` (programación del job).

---

## Decisiones de arquitectura tomadas en esta fase

- **Proveedor de scraping**: el documento deja esto como [DECISIÓN PENDIENTE] (servicio de terceros vs. scraper propio). Se opta por un **scraper propio con Playwright** para el MVP porque no requiere costo recurrente de un proveedor externo y permite empezar con 1-2 supermercados; el diseño (`Scraper` como interfaz) permite sustituirlo por un adaptador de un servicio de terceros más adelante sin tocar el resto del sistema.
- **Supermercados iniciales**: se implementa un scraper de ejemplo completo para un supermercado (Walmart) siguiendo un patrón reutilizable; añadir Costco u otros es repetir el mismo patrón con selectores distintos, no una tarea nueva de arquitectura.

---

## File Structure

```
api/
├── src/
│   ├── modules/
│   │   └── shoppingList/
│   │       ├── shoppingList.service.ts
│   │       └── shoppingList.routes.ts
│   ├── scraping/
│   │   ├── scraper.ts              # interfaz común Scraper + tipo ScrapedProduct
│   │   ├── walmartScraper.ts
│   │   ├── walmartScraper.test.ts
│   │   ├── priceMatcher.ts         # normaliza y hace matching difuso (reutiliza patrón de Fase 1)
│   │   ├── priceMatcher.test.ts
│   │   ├── runScrapeJob.ts         # orquesta: scrapea → matchea → guarda, con manejo de fallos
│   │   ├── runScrapeJob.test.ts
│   │   └── cron.ts                 # node-cron, corre 1-2x/día
│   └── db/schema.ts                # ampliar con supermarket_prices
mobile/
└── app/(tabs)/shopping-list.tsx
```

---

## Task 1: Tabla `supermarket_prices`

**Files:**
- Modify: `api/src/db/schema.ts`

- [ ] **Step 1: Añadir el enum y la tabla**

```typescript
// añadir a api/src/db/schema.ts
export const supermarketEnum = pgEnum('supermarket', ['walmart', 'costco']);

export const supermarketPrices = pgTable('supermarket_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  foodItemId: uuid('food_item_id').references(() => foodItems.id).notNull(),
  supermarket: supermarketEnum('supermarket').notNull(),
  productNameRaw: text('product_name_raw').notNull(),
  price: numeric('price').notNull(),
  packageSizeG: numeric('package_size_g').notNull(),
  scrapedAt: timestamp('scraped_at', { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 2: Generar y aplicar la migración**

Run: `npm run db:generate && npm run db:migrate`
Expected: se crea `api/drizzle/0003_*.sql`; `supermarket_prices` aparece en Neon.

- [ ] **Step 3: Commit**

```bash
git add api/src/db/schema.ts api/drizzle
git commit -m "feat: add supermarket_prices table"
```

---

## Task 2: Interfaz común de scraper + scraper de Walmart

**Files:**
- Create: `api/src/scraping/scraper.ts`
- Create: `api/src/scraping/walmartScraper.ts`
- Test: `api/src/scraping/walmartScraper.test.ts`

- [ ] **Step 1: Instalar Playwright**

```bash
cd api && npm install playwright && npx playwright install chromium
```

- [ ] **Step 2: Definir la interfaz común**

```typescript
// api/src/scraping/scraper.ts
export interface ScrapedProduct {
  productNameRaw: string;
  price: number;
  packageSizeG: number;
}

export interface Scraper {
  supermarket: 'walmart' | 'costco';
  searchProduct(query: string): Promise<ScrapedProduct[]>;
}
```

- [ ] **Step 3: Escribir el test del parseo de resultados de Walmart (con HTML de ejemplo, sin red real)**

```typescript
// api/src/scraping/walmartScraper.test.ts
import { describe, it, expect } from 'vitest';
import { parseWalmartSearchResults } from './walmartScraper';

const SAMPLE_HTML = `
<div class="search-result-gridview-item">
  <span class="product-title">Pechuga de Pollo 1kg</span>
  <span class="price">$89.50</span>
</div>
<div class="search-result-gridview-item">
  <span class="product-title">Arroz Blanco 900g</span>
  <span class="price">$25.00</span>
</div>
`;

describe('parseWalmartSearchResults', () => {
  it('extrae nombre, precio y gramaje de cada tarjeta de producto', () => {
    const results = parseWalmartSearchResults(SAMPLE_HTML);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ productNameRaw: 'Pechuga de Pollo 1kg', price: 89.50, packageSizeG: 1000 });
    expect(results[1]).toEqual({ productNameRaw: 'Arroz Blanco 900g', price: 25.00, packageSizeG: 900 });
  });

  it('ignora tarjetas sin precio o sin gramaje parseable', () => {
    const results = parseWalmartSearchResults('<div class="search-result-gridview-item"><span class="product-title">Producto sin unidades</span><span class="price">$10.00</span></div>');
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Correr el test para verificar que falla**

Run: `npm test -- walmartScraper`
Expected: FAIL (`walmartScraper.ts` no existe)

- [ ] **Step 5: Implementar `api/src/scraping/walmartScraper.ts`**

```typescript
import { chromium } from 'playwright';
import type { Scraper, ScrapedProduct } from './scraper';
import * as cheerio from 'cheerio';

function parsePackageSizeG(name: string): number | null {
  const match = name.match(/([\d.]+)\s*(kg|g)\b/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return match[2].toLowerCase() === 'kg' ? value * 1000 : value;
}

export function parseWalmartSearchResults(html: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const results: ScrapedProduct[] = [];

  $('.search-result-gridview-item').each((_, el) => {
    const productNameRaw = $(el).find('.product-title').text().trim();
    const priceText = $(el).find('.price').text().replace('$', '').trim();
    const price = parseFloat(priceText);
    const packageSizeG = parsePackageSizeG(productNameRaw);
    if (!productNameRaw || Number.isNaN(price) || !packageSizeG) return;
    results.push({ productNameRaw, price, packageSizeG });
  });

  return results;
}

export const walmartScraper: Scraper = {
  supermarket: 'walmart',
  async searchProduct(query: string) {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(`https://www.walmart.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
      const html = await page.content();
      return parseWalmartSearchResults(html);
    } finally {
      await browser.close();
    }
  },
};
```

Instalar `cheerio`: `npm install cheerio`.

- [ ] **Step 6: Correr el test para verificar que pasa**

Run: `npm test -- walmartScraper`
Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add api/src/scraping/scraper.ts api/src/scraping/walmartScraper.ts api/src/scraping/walmartScraper.test.ts api/package.json
git commit -m "feat: add walmart scraper with html parsing"
```

---

## Task 3: Matching difuso de precios contra `food_items`

**Files:**
- Create: `api/src/scraping/priceMatcher.ts`
- Test: `api/src/scraping/priceMatcher.test.ts`

- [ ] **Step 1: Escribir el test**

```typescript
// api/src/scraping/priceMatcher.test.ts
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
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- priceMatcher`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/scraping/priceMatcher.ts`**

Reutiliza `findBestFoodItemMatch` de la Fase 1 (`api/src/db/seed/matchFoodItem.ts`), añadiendo un paso previo de traducción es→en porque `food_items` viene de USDA (inglés) y los productos scrapeados están en español.

```typescript
import { normalizeName } from '../db/seed/normalizeName';
import { findBestFoodItemMatch, type FoodItemCandidate } from '../db/seed/matchFoodItem';

// Diccionario mínimo es→en para los ingredientes más comunes; ampliar según los productos
// que realmente aparezcan en los scrapers añadidos (cada supermercado nuevo puede sumar entradas).
export const ES_EN_INGREDIENT_MAP: Record<string, string> = {
  'pechuga de pollo': 'chicken breast',
  'arroz blanco': 'white rice',
  'huevo': 'egg',
  'atun': 'tuna',
};

export function matchScrapedProductToFoodItem(productNameRaw: string, candidates: FoodItemCandidate[], translations: Record<string, string> = ES_EN_INGREDIENT_MAP): FoodItemCandidate | undefined {
  const normalized = normalizeName(productNameRaw);
  const translatedEntry = Object.entries(translations).find(([es]) => normalized.includes(es));
  const searchTerm = translatedEntry ? translatedEntry[1] : normalized;
  return findBestFoodItemMatch(searchTerm, candidates);
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- priceMatcher`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/scraping/priceMatcher.ts api/src/scraping/priceMatcher.test.ts
git commit -m "feat: add fuzzy es-to-en price matching against food_items"
```

---

## Task 4: Job de scraping con manejo de fallos (sección 10.5)

**Files:**
- Create: `api/src/scraping/runScrapeJob.ts`
- Test: `api/src/scraping/runScrapeJob.test.ts`

- [ ] **Step 1: Escribir el test (con un scraper falso inyectado)**

```typescript
// api/src/scraping/runScrapeJob.test.ts
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
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- runScrapeJob`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/scraping/runScrapeJob.ts`**

```typescript
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
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- runScrapeJob`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/scraping/runScrapeJob.ts api/src/scraping/runScrapeJob.test.ts
git commit -m "feat: add scrape job runner with graceful failure handling"
```

---

## Task 5: Cron 1-2x/día

**Files:**
- Create: `api/src/scraping/cron.ts`
- Modify: `api/src/server.ts`

- [ ] **Step 1: Instalar node-cron**

```bash
cd api && npm install node-cron && npm install -D @types/node-cron
```

- [ ] **Step 2: Implementar `api/src/scraping/cron.ts`**

```typescript
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
    const result = await runScrapeJob({ scraper: walmartScraper, queries: SEARCH_QUERIES, foodItemCandidates: candidates, db });
    if (result.failedQueries.length > 0) {
      console.warn('queries fallidas en el scrape job:', result.failedQueries);
    }
  });
}
```

- [ ] **Step 3: Llamarlo desde `server.ts`**

```typescript
// modificar api/src/server.ts
import { scheduleSupermarketScraping } from './scraping/cron';

// ... después de app.listen(...)
scheduleSupermarketScraping();
```

- [ ] **Step 4: Verificar manualmente que el cron se registra sin errores**

Run: `npm run dev`
Expected: el servidor arranca sin excepciones (el cron no ejecuta el job inmediatamente, solo lo programa).

- [ ] **Step 5: Commit**

```bash
git add api/src/scraping/cron.ts api/src/server.ts api/package.json
git commit -m "feat: schedule supermarket price scraping cron job"
```

---

## Task 6: Lista de compra (sección 6.3)

**Files:**
- Create: `api/src/modules/shoppingList/shoppingList.service.ts`
- Create: `api/src/modules/shoppingList/shoppingList.routes.ts`
- Test: `api/src/modules/shoppingList/shoppingList.service.test.ts`

- [ ] **Step 1: Escribir el test de la función pura de agregación + sugerencia de presentación**

```typescript
// api/src/modules/shoppingList/shoppingList.service.test.ts
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
    // se necesitan 600g: 2x500g=1000g (sobrante 400g) vs 1x1000g (sobrante 400g) -> empate, se prefiere menor precio total
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
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- shoppingList.service`
Expected: FAIL

- [ ] **Step 3: Implementar la parte pura de `api/src/modules/shoppingList/shoppingList.service.ts`**

```typescript
export function aggregateGramsByFoodItem(items: { foodItemId: string; grams: number }[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.foodItemId, (totals.get(item.foodItemId) ?? 0) + item.grams);
  }
  return totals;
}

export interface PackageOption { packageSizeG: number; price: number; productNameRaw: string }

export function suggestBestPackage(neededGrams: number, packages: PackageOption[]): PackageOption | undefined {
  if (packages.length === 0) return undefined;

  function leftoverFor(pkg: PackageOption): number {
    const unitsNeeded = Math.ceil(neededGrams / pkg.packageSizeG);
    return unitsNeeded * pkg.packageSizeG - neededGrams;
  }

  return packages.reduce((best, current) => {
    const bestLeftover = leftoverFor(best);
    const currentLeftover = leftoverFor(current);
    if (currentLeftover < bestLeftover) return current;
    if (currentLeftover === bestLeftover && current.price < best.price) return current;
    return best;
  });
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- shoppingList.service`
Expected: PASS (3 tests)

- [ ] **Step 5: Añadir la función de orquestación que sí toca la DB**

```typescript
// añadir a api/src/modules/shoppingList/shoppingList.service.ts
import { db } from '../../db/client';
import { mealPlanItems, recipeIngredients, supermarketPrices, foodItems, mealPlans } from '../../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function generateShoppingList(userId: string, mealPlanId: string) {
  const [plan] = await db.select().from(mealPlans).where(eq(mealPlans.id, mealPlanId));
  if (!plan || plan.userId !== userId) throw new Error('meal plan not found for this user');

  const items = await db.select().from(mealPlanItems).where(eq(mealPlanItems.mealPlanId, mealPlanId));
  const recipeIds = items.map((i) => i.recipeId);
  const ingredients = await db.select().from(recipeIngredients).where(inArray(recipeIngredients.recipeId, recipeIds));

  const gramsPerIngredient = items.flatMap((item) =>
    ingredients
      .filter((ing) => ing.recipeId === item.recipeId)
      .map((ing) => ({ foodItemId: ing.foodItemId, grams: Number(ing.baseGrams) * Number(item.scaleFactor) })),
  );
  const totals = aggregateGramsByFoodItem(gramsPerIngredient);

  const allPrices = await db.select().from(supermarketPrices).where(inArray(supermarketPrices.foodItemId, [...totals.keys()])).orderBy(desc(supermarketPrices.scrapedAt));
  const allFoodItems = await db.select().from(foodItems).where(inArray(foodItems.id, [...totals.keys()]));
  const foodItemById = new Map(allFoodItems.map((f) => [f.id, f]));

  return [...totals.entries()].map(([foodItemId, neededGrams]) => {
    const packages = allPrices
      .filter((p) => p.foodItemId === foodItemId)
      .map((p) => ({ packageSizeG: Number(p.packageSizeG), price: Number(p.price), productNameRaw: p.productNameRaw }));
    const suggestion = suggestBestPackage(neededGrams, packages);
    return {
      foodItemId,
      foodName: foodItemById.get(foodItemId)?.name ?? 'desconocido',
      neededGrams,
      // "precio no disponible hoy" si no hay ningún precio scrapeado para este food_item (sección 10.5)
      suggestedPackage: suggestion ?? null,
    };
  });
}
```

- [ ] **Step 6: Implementar las rutas**

```typescript
// api/src/modules/shoppingList/shoppingList.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth';
import { generateShoppingList } from './shoppingList.service';

export const shoppingListRouter = Router();

shoppingListRouter.get('/:mealPlanId', requireAuth, async (req, res) => {
  try {
    res.json(await generateShoppingList(req.userId!, req.params.mealPlanId));
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});
```

- [ ] **Step 7: Montar el router**

```typescript
import { shoppingListRouter } from './modules/shoppingList/shoppingList.routes';
app.use('/shopping-list', shoppingListRouter);
```

- [ ] **Step 8: Commit**

```bash
git add api/src/modules/shoppingList api/src/app.ts
git commit -m "feat: add shopping list generation with package suggestion"
```

---

## Task 7: Pantalla móvil de lista de compra

**Files:**
- Create: `mobile/app/(tabs)/shopping-list.tsx`

- [ ] **Step 1: Implementar la pantalla**

```tsx
// mobile/app/(tabs)/shopping-list.tsx
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

export default function ShoppingListScreen() {
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data } = useQuery({
    queryKey: ['shopping-list', mealPlanId],
    queryFn: async () => (await apiClient.get(`/shopping-list/${mealPlanId}`)).data,
    enabled: !!mealPlanId,
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Lista de compra</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(i: any) => i.foodItemId}
        renderItem={({ item }: any) => (
          <View style={{ marginVertical: 8 }}>
            <Text>{item.foodName} — {Math.round(item.neededGrams)}g necesarios</Text>
            {item.suggestedPackage
              ? <Text>Comprar: {item.suggestedPackage.productNameRaw} (${item.suggestedPackage.price})</Text>
              : <Text style={{ color: 'gray' }}>Precio no disponible hoy</Text>}
          </View>
        )}
      />
    </View>
  );
}
```

- [ ] **Step 2: Enlazar desde la pantalla del planificador**

Modificar `mobile/app/(tabs)/planner.tsx` (Fase 1) para navegar a `/(tabs)/shopping-list?mealPlanId=<id>` tras generar el plan.

- [ ] **Step 3: Probar el flujo en el simulador**

Expected: con precios scrapeados en `supermarket_prices` (correr `runScrapeJob` manualmente una vez con `npx tsx` para no esperar al cron), la lista de compra muestra gramos necesarios y presentación sugerida por ingrediente; sin precios, muestra "Precio no disponible hoy" sin romper la pantalla.

- [ ] **Step 4: Commit**

```bash
git add mobile/app/\(tabs\)/shopping-list.tsx mobile/app/\(tabs\)/planner.tsx
git commit -m "feat: add shopping list screen"
```

---

## Self-review de esta fase (cobertura vs. sección 15, Fase 4 del documento)

1. Scraper + cron + matching contra `food_items` → Tareas 1-5. ✅
2. Lista de compra con precios y sugerencia de presentación → Tareas 6-7. ✅
3. Manejo de fallos del scraper sin romper el flujo de planificación (sección 10.5) → Tarea 4 (test explícito de degradación con gracia) + Tarea 6 (fallback "precio no disponible hoy" en la UI). ✅

**Nota de alcance**: solo se implementa el scraper de Walmart en detalle; Costco y otros supermercados se añaden repitiendo el patrón de la Tarea 2 con selectores propios — no representan una decisión de arquitectura nueva.
