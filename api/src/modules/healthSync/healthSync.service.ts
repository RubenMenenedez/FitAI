import { db } from '../../db/client';
import { weighIns, users } from '../../db/schema';
import { calculateBmi, classifyBmi } from '../weighIns/bmiCalculator';
import { eq } from 'drizzle-orm';

export interface HealthSample { type: 'weight'; valueKg: number; recordedAt: string }

export async function ingestHealthSamples(userId: string, samples: HealthSample[]) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('user not found');
  const inserted = [];
  for (const sample of samples) {
    if (sample.type !== 'weight') continue;
    const bmi = calculateBmi({ weightKg: sample.valueKg, heightCm: Number(user.heightCm) });
    const [row] = await db.insert(weighIns).values({
      userId, weightKg: String(sample.valueKg), bmi: bmi.toFixed(1), bmiCategory: classifyBmi(bmi), recordedAt: new Date(sample.recordedAt),
    }).returning();
    if (row) inserted.push(row);
  }
  return inserted;
}
