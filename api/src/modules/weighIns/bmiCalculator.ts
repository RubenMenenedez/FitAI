export function calculateBmi(input: { weightKg: number; heightCm: number }): number {
  const heightM = input.heightCm / 100;
  return input.weightKg / (heightM * heightM);
}

export function classifyBmi(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}
