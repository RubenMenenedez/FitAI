// Unit conversions for onboarding. The store always persists metric (kg, cm);
// these helpers convert to/from the imperial units shown when the user toggles.

export function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}

/** cm → { ft, inch } with inches rounded to the nearest whole inch. */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return { ft, inch };
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54);
}

/** Format a ft/in pair as e.g. 5'7". */
export function formatFtIn(ft: number, inch: number): string {
  return `${ft}'${inch}"`;
}
