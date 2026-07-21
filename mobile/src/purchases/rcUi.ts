// RevenueCat UI helpers: the dashboard-managed remote Paywall and the Customer
// Center (self-service subscription management). These live in a SEPARATE
// package — `react-native-purchases-ui` — which, like react-native-purchases,
// is a native module that needs a dev build (expo prebuild). Loaded lazily via
// require() inside try/catch so the app keeps bundling on web / Expo Go; the
// helpers no-op (return null) until the native module is in the build.
//
// Docs: https://www.revenuecat.com/docs/tools/paywalls
//       https://www.revenuecat.com/docs/tools/customer-center

function loadRcUi(): any | null {
  try {
    return (require('react-native-purchases-ui') as any).default;
  } catch {
    return null;
  }
}

// Presents the remote paywall configured in the RevenueCat dashboard.
// Returns the PAYWALL_RESULT string (PURCHASED / RESTORED / CANCELLED / ...),
// or null if the RevenueCatUI native module isn't in this build.
export async function presentRevenueCatPaywall(): Promise<string | null> {
  const RevenueCatUI = loadRcUi();
  if (!RevenueCatUI) return null;
  try {
    return await RevenueCatUI.presentPaywall();
  } catch {
    return null;
  }
}

// Presents the paywall only if the user does NOT already have the entitlement.
export async function presentPaywallIfNeeded(entitlementId: string): Promise<string | null> {
  const RevenueCatUI = loadRcUi();
  if (!RevenueCatUI) return null;
  try {
    return await RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: entitlementId });
  } catch {
    return null;
  }
}

// Opens the Customer Center so users can manage / cancel / restore their
// subscription without leaving the app. Returns false if unavailable.
export async function presentCustomerCenter(): Promise<boolean> {
  const RevenueCatUI = loadRcUi();
  if (!RevenueCatUI) return false;
  try {
    await RevenueCatUI.presentCustomerCenter();
    return true;
  } catch {
    return false;
  }
}
