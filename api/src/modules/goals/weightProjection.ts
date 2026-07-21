const KCAL_PER_KG_FAT = 7700;

// Convención: dailyCalorieDeficit positivo = déficit (se baja peso);
// negativo = superávit (se sube peso).
export function projectWeeksToGoal(input: { currentWeightKg: number; targetWeightKg: number; dailyCalorieDeficit: number }): number | null {
  const weightToChangeKg = input.targetWeightKg - input.currentWeightKg;
  if (weightToChangeKg === 0) return 0;
  if (input.dailyCalorieDeficit === 0) return null;

  const goalDirection = Math.sign(weightToChangeKg);           // -1 = quiere bajar, +1 = quiere subir
  const actualWeeklyDirection = input.dailyCalorieDeficit > 0 ? -1 : 1; // déficit baja, superávit sube
  if (actualWeeklyDirection !== goalDirection) return null;

  const weeklyMagnitudeKg = Math.abs((input.dailyCalorieDeficit * 7) / KCAL_PER_KG_FAT);
  return Math.abs(weightToChangeKg) / weeklyMagnitudeKg;
}
