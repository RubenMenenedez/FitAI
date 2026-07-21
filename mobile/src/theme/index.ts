// FitAI design system — clean, minimal, high-contrast (Cal AI-inspired, not identical).
// Black "ink" chrome + white cards + sparing color accents for data viz (macro
// rings, streak orange, positive green). Consumed by src/ui and every screen.

export const colors = {
  // Chrome — near-black ink for primary buttons / FABs / strong text.
  ink: '#0F0F12',
  inkPressed: '#26262B',

  // Brand accent (used sparingly: calorie ring, streak, highlights, active nav).
  primary: '#FF7A1A',
  primaryDark: '#E86A0C',
  primarySoft: '#FFF2E8',

  // Positive / success (trends up, confirmations).
  success: '#16C47F',
  successDark: '#0FA968',
  successSoft: '#E4F8EF',

  // Macro accents (protein / carbs / fat rings, matching the reference look).
  protein: '#FF4D6D',
  carbs: '#FF8A3D',
  fat: '#3E7BFA',

  // Neutrals.
  bg: '#F4F4F5', // app background (slightly off-white so white cards pop)
  surface: '#FFFFFF', // cards
  surfaceAlt: '#F1F1F3',
  text: '#0B0B0F', // near-black body/headings
  textMuted: '#6B7280', // gray-500
  textFaint: '#9CA3AF', // gray-400 — placeholders / disabled only
  border: '#ECECEE', // hairline card border
  borderStrong: '#E4E4E7',

  // Feedback.
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
  warning: '#F59E0B',

  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  tiny: 12,
  small: 14,
  body: 16,
  h3: 18,
  h2: 22,
  h1: 30,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Soft, diffuse shadows (cards float gently on the off-white bg).
export const shadow = {
  card: {
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  soft: {
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, fontSize, fontWeight, shadow } as const;
export type Theme = typeof theme;
