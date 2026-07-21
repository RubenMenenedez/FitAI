// react-native-purchases is a native module that needs a dev build (expo prebuild).
// The require() inside try/catch is intentional: Metro treats it as an OPTIONAL
// dependency, so the bundle keeps working in Expo Go / web; the feature just no-ops
// until a dev build includes the native module. Same pattern as healthSync.ts.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { PREMIUM_ENTITLEMENT_ID } from './plans';

function loadPurchases(): any | null {
  try {
    return (require('react-native-purchases') as any).default;
  } catch {
    return null;
  }
}

export function initPurchases(appUserId: string) {
  const Purchases = loadPurchases();
  if (!Purchases) return; // dev build / native module absent
  const apiKey =
    Platform.OS === 'ios'
      ? (Constants.expoConfig?.extra?.revenueCatIosKey as string | undefined)
      : (Constants.expoConfig?.extra?.revenueCatAndroidKey as string | undefined);
  if (!apiKey) return;
  try {
    Purchases.configure({ apiKey, appUserID: appUserId });
  } catch {
    /* no-op */
  }
}

export async function getOfferings(): Promise<any | null> {
  const Purchases = loadPurchases();
  if (!Purchases) return null;
  try {
    return ((await Purchases.getOfferings()) as any).current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any): Promise<any> {
  const Purchases = loadPurchases();
  if (!Purchases) throw new Error('purchases unavailable');
  const { customerInfo } = (await Purchases.purchasePackage(pkg)) as any;
  return customerInfo;
}

export async function restorePurchases(): Promise<any | null> {
  const Purchases = loadPurchases();
  if (!Purchases) return null;
  return (Purchases.restorePurchases() as Promise<any>);
}

export function isPremium(customerInfo: any): boolean {
  return !!(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]);
}
