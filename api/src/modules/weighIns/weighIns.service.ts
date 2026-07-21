import { db } from '../../db/client';
import { weighIns, users } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateBmi, classifyBmi } from './bmiCalculator';

// Thrown when a weigh-in cannot be recorded because the user has not set a
// height yet (i.e. hasn't completed onboarding). Without a height, BMI is
// undefined; computing it anyway yields Infinity/NaN which would corrupt the
// numeric column. The route maps this to a 400 instead of a 500.
export class MissingHeightError extends Error {
  constructor() {
    super('height not set — complete onboarding first');
    this.name = 'MissingHeightError';
  }
}

export async function recordWeighIn(userId: string, weightKg: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.heightCm == null) {
    throw new MissingHeightError();
  }
  const bmi = calculateBmi({ weightKg, heightCm: Number(user.heightCm) });
  const [row] = await db.insert(weighIns).values({
    userId, weightKg: String(weightKg), bmi: bmi.toFixed(1), bmiCategory: classifyBmi(bmi),
  }).returning();
  return row;
}

export async function listWeighIns(userId: string) {
  return db.select().from(weighIns).where(eq(weighIns.userId, userId)).orderBy(desc(weighIns.recordedAt));
}
