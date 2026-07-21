// react-native-google-mobile-ads is a native module that needs a dev build (expo prebuild).
// The require() inside try/catch is intentional: Metro treats it as an OPTIONAL
// dependency, so the bundle keeps working in Expo Go / web. Same pattern as healthSync.ts.
import { type ReactElement } from 'react';

function loadAds(): any | null {
  try {
    return require('react-native-google-mobile-ads') as any;
  } catch {
    return null;
  }
}

let interstitial: any = null;

function ensureInterstitial() {
  const Ads = loadAds();
  if (!Ads) return null;
  if (!interstitial) {
    const unitId = __DEV__
      ? (Ads.TestIds.INTERSTITIAL as string)
      : 'ca-app-pub-xxxxxxxx/xxxxxxxx';
    interstitial = Ads.InterstitialAd.createForAdRequest(unitId) as any;
    (interstitial as any).load();
  }
  return interstitial;
}

export function showInterstitialIfLoaded() {
  const Ads = loadAds();
  const ad = ensureInterstitial();
  if (Ads && (ad as any)?.loaded) {
    (ad as any).show();
    interstitial = null;
    ensureInterstitial();
  }
}

// Renders a native banner ad when the module is available, otherwise nothing.
export function AdBanner(): ReactElement | null {
  const Ads = loadAds();
  if (!Ads) return null;
  const unitId = __DEV__
    ? (Ads.TestIds.BANNER as string)
    : 'ca-app-pub-xxxxxxxx/xxxxxxxx';
  const { BannerAd, BannerAdSize } = Ads as {
    BannerAd: any;
    BannerAdSize: any;
  };
  return <BannerAd unitId={unitId} size={BannerAdSize.BANNER} />;
}
