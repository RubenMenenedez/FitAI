// Fit AI design system — clean, modern, blue-accented (matches the Fit AI mockup).
// Vivid blue is the primary brand color: buttons, camera FAB, active nav, links,
// progress. White cards on a light-gray canvas with soft shadows. Consumed by
// src/ui and every screen.

export const colors = {
  // Near-black ink for strong text / dark chrome.
  ink: '#0F0F12',
  inkPressed: '#26262B',

  // Brand primary — vivid blue (buttons, FAB, active nav, links, progress).
  primary: '#2E6BF6',
  primaryDark: '#1F55D6',
  primarySoft: '#EAF1FF',

  // Positive / success (trends up, confirmations, calorie progress).
  success: '#22C55E',
  successDark: '#16A34A',
  successSoft: '#E7F8EE',

  // Macro accents (protein green / carbs blue / fat amber — matching the mockup).
  protein: '#22C55E',
  carbs: '#3B82F6',
  fat: '#F59E0B',

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
