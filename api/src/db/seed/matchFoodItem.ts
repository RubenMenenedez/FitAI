import { normalizeName } from './normalizeName';

export interface FoodItemCandidate { id: string; nameNormalized: string }

export function findBestFoodItemMatch(ingredientName: string, candidates: FoodItemCandidate[]): FoodItemCandidate | undefined {
  const target = normalizeName(ingredientName);
  const targetWords = target.split(' ').filter((w) => w.length > 2);

  let best: { candidate: FoodItemCandidate; score: number } | undefined;
  for (const candidate of candidates) {
    const matchingWords = targetWords.filter((w) => candidate.nameNormalized.includes(w));
    const score = matchingWords.length / Math.max(targetWords.length, 1);
    if (score > 0.5 && (!best || score > best.score)) {
      best = { candidate, score };
    }
  }
  return best?.candidate;
}
