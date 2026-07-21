import { chromium } from 'playwright';
import type { Scraper, ScrapedProduct } from './scraper';
import * as cheerio from 'cheerio';

// NOTA: los selectores CSS de abajo son de EJEMPLO (placeholder). La búsqueda real de
// Walmart usa un DOM ofuscado y tiene detección anti-bot; adaptar estos selectores y el
// manejo de bloqueo cuando se conecte contra el sitio real. El parser es puro y testeable.
function parsePackageSizeG(name: string): number | null {
  const match = name.match(/([\d.]+)\s*(kg|g)\b/i);
  if (!match) return null;
  const value = parseFloat(match[1]!);
  return match[2]!.toLowerCase() === 'kg' ? value * 1000 : value;
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
