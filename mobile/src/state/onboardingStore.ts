import { create } from 'zustand';

export interface OnboardingData {
  sex?: 'male' | 'female';
  birthDate?: string;              // YYYY-MM-DD
  heightCm?: number;
  weightKg?: number;
  bodyFatPercent?: number;         // optional
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  trainingDaysPerWeek?: number;    // 0..7
  goal?: 'lose_fat' | 'maintain' | 'gain_muscle';
  targetWeightKg?: number;         // only if goal != maintain
  weeklyRateKg?: number;           // 0.25 | 0.5 | 0.75, only if goal != maintain
  dietMode?: 'standard' | 'keto' | 'high_protein' | 'vegetarian_vegan';
  allergies?: string[];
  mealsPerDay?: '3' | '5_6';
  pregnancyStatus?: 'none' | 'pregnant' | 'breastfeeding'; // only if sex === 'female'
  medicalConditions?: string[];
  sleepHours?: number;
  stressLevel?: 'low' | 'medium' | 'high';
  waterIntakeMl?: number;
}

export const useOnboardingStore = create<{
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}>((set) => ({
  data: {},
  setData: (d) => set((s) => ({ data: { ...s.data, ...d } })),
}));
