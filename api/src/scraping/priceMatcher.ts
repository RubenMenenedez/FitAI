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

export function matchScrapedProductToFoodItem(
  productNameRaw: string,
  candidates: FoodItemCandidate[],
  translations: Record<string, string> = ES_EN_INGREDIENT_MAP,
): FoodItemCandidate | undefined {
  const normalized = normalizeName(productNameRaw);
  const translatedEntry = Object.entries(translations).find(([es]) => normalized.includes(es));
  const searchTerm = translatedEntry ? translatedEntry[1] : normalized;
  return findBestFoodItemMatch(searchTerm, candidates);
}
