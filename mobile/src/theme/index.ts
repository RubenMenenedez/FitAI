// FitAI design system — energetic light theme.
// Palette: energy orange primary + success green CTA (fitness/nutrition mood).
// Consumed by the components in src/ui and by every screen. Keep values here;
// screens should never hardcode colors/spacing.

export const colors = {
  // Brand
  primary: '#F97316', // energy orange
  primaryDark: '#EA580C',
  primarySoft: '#FFF1E7', // tinted surface for orange accents
  success: '#22C55E', // CTA green
  successDark: '#16A34A',
  successSoft: '#E9F9EF',

  // Neutrals
  bg: '#F6F7F9', // app background
  surface: '#FFFFFF', // cards
  surfaceAlt: '#F1F5F9',
  text: '#0F172A', // slate-900
  textMuted: '#475569', // slate-600 (min contrast for muted per a11y)
  textFaint: '#94A3B8', // slate-400 — only for placeholders / disabled
  border: '#E2E8F0', // slate-200
  borderStrong: '#CBD5E1',

  // Feedback
  danger: '#EF4444',
  dangerSoft: '#FEECEC',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  tiny: 12,
  small: 14,
  body: 16,
  h3: 18,
  h2: 22,
  h1: 28,
  display: 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Card / floating element shadow (cross-platform).
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, fontSize, fontWeight, shadow } as const;
export type Theme = typeof theme;
