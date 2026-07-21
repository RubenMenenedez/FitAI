// RevenueCat configuration for FitAI.
// IMPORTANT: these strings must match your RevenueCat dashboard EXACTLY
// (case- and space-sensitive). Verify in RevenueCat → Entitlements / Products.
export const PREMIUM_ENTITLEMENT_ID = 'FitAI Pro';

// Store product identifiers (RevenueCat → Products). Internal keys stay
// monthly/annual for the UI; the values are the real store product ids.
export const PLAN_PRODUCTS = { monthly: 'monthly', annual: 'yearly' } as const;

// Reference prices shown before RevenueCat resolves the real localized store price.
export const REFERENCE_PRICES = { monthly: 6.99, annual: 49.99 };
