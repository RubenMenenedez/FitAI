import { db } from '../../db/client';
import { goals, users, weighIns } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { projectWeeksToGoal } from './weightProjection';

export interface CreateGoalInput { goalType: string; targetValue: number; targetDate?: string }

export async function createGoal(userId: string, input: CreateGoalInput) {
  const values: Parameters<typeof db.insert>[0] extends never ? never : {
    userId: string;
    goalType: 'target_weight' | 'daily_calories' | 'daily_protein' | 'weekly_workouts' | 'water_intake' | 'custom';
    targetValue: string;
    targetDate?: string;
  } = {
    userId,
    goalType: input.goalType as 'target_weight' | 'daily_calories' | 'daily_protein' | 'weekly_workouts' | 'water_intake' | 'custom',
    targetValue: String(input.targetValue),
    ...(input.targetDate !== undefined ? { targetDate: input.targetDate } : {}),
  };

  const [row] = await db.insert(goals).values(values).returning();
  if (!row) throw new Error('goal insert did not return a row');
  return row;
}

export async function listGoalsWithProjection(userId: string) {
  const rows = await db.select().from(goals).where(eq(goals.userId, userId));
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('user not found');
  const [latestWeighIn] = await db
    .select()
    .from(weighIns)
    .where(eq(weighIns.userId, userId))
    .orderBy(desc(weighIns.recordedAt))
    .limit(1);

  return rows.map((goal) => {
    if (goal.goalType !== 'target_weight' || !latestWeighIn) return { ...goal, projectedWeeks: null };
    const tdee = Number(user.dailyCalorieTarget);
    const deficit =
      user.goal === 'lose_fat' ? tdee * 0.175
      : user.goal === 'gain_muscle' ? -tdee * 0.125
      : 0;
    const projectedWeeks = projectWeeksToGoal({
      currentWeightKg: Number(latestWeighIn.weightKg),
      targetWeightKg: Number(goal.targetValue),
      dailyCalorieDeficit: deficit,
    });
    return { ...goal, projectedWeeks };
  });
}
