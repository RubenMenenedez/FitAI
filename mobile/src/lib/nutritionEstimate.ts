// Client-side preview of the daily calorie target and time-to-goal shown on the
// pace step. This is an ESTIMATE for instant feedback (Mifflin-St Jeor); the
// backend remains the source of truth once onboarding is submitted.

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const KCAL_PER_KG = 7700;

export interface EstimateInput {
  sex?: 'male' | 'female';
  birthDate?: string; // YYYY-MM-DD
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  goal?: 'lose_fat' | 'maintain' | 'gain_muscle';
  targetWeightKg?: number;
  weeklyRateKg?: number;
}

function ageFrom(birthDate?: string): number {
  if (!birthDate) return 30;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return 30;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/** Returns null when required fields are missing. */
export function estimateDailyCalories(d: EstimateInput): number | null {
  if (!d.sex || !d.heightCm || !d.weightKg) return null;
  const age = ageFrom(d.birthDate);
  const s = d.sex === 'male' ? 5 : -161;
  const bmr = 10 * d.weightKg + 6.25 * d.heightCm - 5 * age + s;
  const tdee = bmr * (ACTIVITY_FACTOR[d.activityLevel ?? 'sedentary'] ?? 1.2);

  const rate = d.weeklyRateKg ?? 0;
  const dailyDelta = (rate * KCAL_PER_KG) / 7;
  let target = tdee;
  if (d.goal === 'lose_fat') target = tdee - dailyDelta;
  else if (d.goal === 'gain_muscle') target = tdee + dailyDelta;

  return Math.max(1200, Math.round(target / 10) * 10);
}

/** Estimated weeks to reach the target weight at the chosen pace (or null). */
export function estimateWeeksToGoal(d: EstimateInput): number | null {
  if (!d.weightKg || !d.targetWeightKg || !d.weeklyRateKg || d.weeklyRateKg <= 0) return null;
  const diff = Math.abs(d.weightKg - d.targetWeightKg);
  if (diff < 0.1) return null;
  return Math.ceil(diff / d.weeklyRateKg);
}
