import { create } from 'zustand';

export interface OnboardingData {
  sex?: 'male' | 'female';
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'lose_fat' | 'maintain' | 'gain_muscle';
  mealsPerDay?: '3' | '5_6';
}

export const useOnboardingStore = create<{
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}>((set) => ({
  data: {},
  setData: (d) => set((s) => ({ data: { ...s.data, ...d } })),
}));
