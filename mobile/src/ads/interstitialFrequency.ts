export const INTERSTITIAL_FREQUENCY = 3; // every 3 photo analyses

export function shouldShowInterstitial(analysisCount: number): boolean {
  return analysisCount > 0 && analysisCount % INTERSTITIAL_FREQUENCY === 0;
}
