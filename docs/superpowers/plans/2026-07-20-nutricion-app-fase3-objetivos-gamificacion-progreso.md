# App de Nutrición — Fase 3 (Objetivos, gamificación y progreso) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la sección 8 del documento: objetivos personalizados medibles con proyección de tiempo, rachas diarias + insignias, grupos privados/públicos con feed y reacciones de emoji, fotos de progreso corporal (que sí se almacenan, a diferencia de las de comida), sincronización con Apple Health/Google Health Connect, y modos de dieta predefinidos. Requiere Fases 1 y 2 completas.

**Architecture:** Se añaden 8 tablas nuevas (sección 8.7) y sus módulos correspondientes en `api/`. Las fotos de progreso se suben a Cloudflare R2 (S3-compatible) desde la app, a diferencia de las fotos de comida de la Fase 2 que nunca se persisten. La sincronización de salud usa los SDKs nativos de Expo y empuja datos hacia el backend vía un endpoint genérico de "health samples".

**Tech Stack:** Mismo stack de Fases 1-2 + `@aws-sdk/client-s3` (compatible con R2), `expo-file-system` + `expo-image-picker` (fotos de progreso), `react-native-health` (HealthKit, iOS) y `react-native-health-connect` (Android).

---

## Decisiones de arquitectura tomadas en esta fase

- **Storage de fotos de progreso**: Cloudflare R2, con URLs firmadas (`PutObjectCommand` con expiración corta) para que la app suba directo al bucket sin pasar el binario por el backend — más barato y simple que proxear el archivo por Express.
- **Comentarios en el feed de grupo**: solo reacciones de emoji en esta fase (el documento marca el texto libre como [DECISIÓN PENDIENTE] y recomienda emoji-only para evitar moderación de contenido desde el día uno).

---

## File Structure

```
api/
├── src/
│   ├── modules/
│   │   ├── goals/
│   │   │   ├── weightProjection.ts       # 8.1
│   │   │   ├── weightProjection.test.ts
│   │   │   ├── goals.service.ts
│   │   │   └── goals.routes.ts
│   │   ├── streaks/
│   │   │   ├── streakLogic.ts            # 8.3
│   │   │   ├── streakLogic.test.ts
│   │   │   ├── milestones.ts
│   │   │   ├── milestones.test.ts
│   │   │   ├── streaks.service.ts
│   │   │   └── streaks.routes.ts
│   │   ├── groups/
│   │   │   ├── groups.service.ts
│   │   │   └── groups.routes.ts
│   │   ├── progressPhotos/
│   │   │   ├── r2Storage.ts
│   │   │   ├── progressPhotos.service.ts
│   │   │   └── progressPhotos.routes.ts
│   │   ├── healthSync/
│   │   │   ├── healthSync.service.ts
│   │   │   └── healthSync.routes.ts
│   │   └── dietModes/
│   │       ├── dietModePresets.ts        # 8.6
│   │       └── dietModePresets.test.ts
│   └── db/schema.ts                      # ampliar con las 8 tablas de 8.7
mobile/
├── app/
│   └── (tabs)/
│       ├── goals.tsx
│       ├── groups/
│       │   ├── index.tsx
│       │   ├── [groupId].tsx
│       │   └── create.tsx
│       └── progress-photos.tsx
```

---

## Task 1: Tablas nuevas de la Fase 3 (sección 8.7)

**Files:**
- Modify: `api/src/db/schema.ts`

- [ ] **Step 1: Añadir las 8 tablas al schema**

```typescript
// añadir a api/src/db/schema.ts
export const goalTypeEnum = pgEnum('goal_type', ['target_weight', 'daily_calories', 'daily_protein', 'weekly_workouts', 'water_intake', 'custom']);
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'abandoned']);
export const groupVisibilityEnum = pgEnum('group_visibility', ['private', 'public']);
export const dietModeEnum = pgEnum('diet_mode', ['standard', 'keto', 'high_protein', 'vegetarian_vegan']);

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  goalType: goalTypeEnum('goal_type').notNull(),
  targetValue: numeric('target_value').notNull(),
  currentValue: numeric('current_value').default('0'),
  targetDate: date('target_date'),
  status: goalStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const streaks = pgTable('streaks', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  currentStreakDays: integer('current_streak_days').default(0),
  longestStreakDays: integer('longest_streak_days').default(0),
  lastLoggedDate: date('last_logged_date'),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  badgeCode: text('badge_code').notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  visibility: groupVisibilityEnum('visibility').notNull(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  inviteCode: text('invite_code').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (t) => ({ pk: primaryKey({ columns: [t.groupId, t.userId] }) }));

export const groupPosts = pgTable('group_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  photoAnalysisId: uuid('photo_analysis_id').references(() => photoAnalyses.id),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const groupReactions = pgTable('group_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupPostId: uuid('group_post_id').references(() => groupPosts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  emoji: text('emoji').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const progressPhotos = pgTable('progress_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  photoUrl: text('photo_url').notNull(),
  weightAtTimeKg: numeric('weight_at_time_kg'),
  takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow(),
});
```

Añadir `primaryKey` al import de `drizzle-orm/pg-core` y las columnas `waistCm`/`bodyFatPercent` a `weighIns`:

```typescript
// modificar la definición de weighIns (Fase 1) para añadir:
waistCm: numeric('waist_cm'),
bodyFatPercent: numeric('body_fat_percent'),
```

También añadir `dietMode: dietModeEnum('diet_mode').default('standard')` a la tabla `users`.

- [ ] **Step 2: Generar y aplicar la migración**

Run: `npm run db:generate && npm run db:migrate`
Expected: se crea `api/drizzle/0002_*.sql`; las 8 tablas y las columnas nuevas aparecen en Neon.

- [ ] **Step 3: Commit**

```bash
git add api/src/db/schema.ts api/drizzle
git commit -m "feat: add fase 3 tables (goals, streaks, groups, progress photos)"
```

---

## Task 2: Proyección de tiempo hacia el objetivo de peso (sección 8.1)

**Files:**
- Create: `api/src/modules/goals/weightProjection.ts`
- Test: `api/src/modules/goals/weightProjection.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/goals/weightProjection.test.ts
import { describe, it, expect } from 'vitest';
import { projectWeeksToGoal } from './weightProjection';

describe('projectWeeksToGoal', () => {
  it('estima semanas para bajar de peso a partir del déficit calórico semanal', () => {
    // déficit diario de 500 kcal ≈ 0.45 kg/semana (7700 kcal ≈ 1kg de grasa)
    const weeks = projectWeeksToGoal({ currentWeightKg: 85, targetWeightKg: 75, dailyCalorieDeficit: 500 });
    expect(weeks).toBeCloseTo((85 - 75) / (500 * 7 / 7700), 0);
  });

  it('devuelve null si el objetivo va en dirección contraria al superávit/déficit actual', () => {
    const weeks = projectWeeksToGoal({ currentWeightKg: 75, targetWeightKg: 85, dailyCalorieDeficit: 500 });
    expect(weeks).toBeNull();
  });

  it('devuelve 0 si ya se alcanzó el peso objetivo', () => {
    expect(projectWeeksToGoal({ currentWeightKg: 75, targetWeightKg: 75, dailyCalorieDeficit: 500 })).toBe(0);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- weightProjection`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/goals/weightProjection.ts`**

```typescript
const KCAL_PER_KG_FAT = 7700;

export function projectWeeksToGoal(input: { currentWeightKg: number; targetWeightKg: number; dailyCalorieDeficit: number }): number | null {
  const weightToChangeKg = input.targetWeightKg - input.currentWeightKg;
  if (weightToChangeKg === 0) return 0;

  // dailyCalorieDeficit positivo = superávit está bajando (fase de déficit); negativo = superávit (volumen)
  const weeklyChangeKg = (input.dailyCalorieDeficit * 7) / KCAL_PER_KG_FAT;
  // el signo del cambio de peso esperado (bajar = negativo) debe coincidir con el signo del objetivo
  const expectedDirection = Math.sign(-weeklyChangeKg || weeklyChangeKg === 0 ? 0 : -weeklyChangeKg);
  const goalDirection = Math.sign(weightToChangeKg);

  if (weeklyChangeKg === 0) return null;
  const actualWeeklyDirection = input.dailyCalorieDeficit > 0 ? -1 : 1; // déficit baja peso, superávit lo sube
  if (actualWeeklyDirection !== goalDirection) return null;

  const weeklyMagnitude = Math.abs(weeklyChangeKg);
  return Math.abs(weightToChangeKg) / weeklyMagnitude;
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- weightProjection`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/goals/weightProjection.ts api/src/modules/goals/weightProjection.test.ts
git commit -m "feat: implement weight goal time projection"
```

---

## Task 3: Endpoints de objetivos (`POST/GET /goals`)

**Files:**
- Create: `api/src/modules/goals/goals.service.ts`
- Create: `api/src/modules/goals/goals.routes.ts`

- [ ] **Step 1: Implementar el service**

```typescript
// api/src/modules/goals/goals.service.ts
import { db } from '../../db/client';
import { goals, users, weighIns } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { projectWeeksToGoal } from './weightProjection';

export interface CreateGoalInput { goalType: string; targetValue: number; targetDate?: string }

export async function createGoal(userId: string, input: CreateGoalInput) {
  const [row] = await db.insert(goals).values({
    userId, goalType: input.goalType as any, targetValue: String(input.targetValue), targetDate: input.targetDate,
  }).returning();
  return row;
}

export async function listGoalsWithProjection(userId: string) {
  const rows = await db.select().from(goals).where(eq(goals.userId, userId));
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [latestWeighIn] = await db.select().from(weighIns).where(eq(weighIns.userId, userId)).orderBy(desc(weighIns.recordedAt)).limit(1);

  return rows.map((goal) => {
    if (goal.goalType !== 'target_weight' || !latestWeighIn) return { ...goal, projectedWeeks: null };
    const tdee = Number(user.dailyCalorieTarget); // ya incluye el ajuste por objetivo (sección 5.3)
    const maintenanceEstimate = tdee; // aproximación: se usa el propio target como proxy del ritmo actual
    const deficit = maintenanceEstimate - tdee === 0 ? (user.goal === 'lose_fat' ? tdee * 0.175 : user.goal === 'gain_muscle' ? -tdee * 0.125 : 0) : 0;
    const projectedWeeks = projectWeeksToGoal({
      currentWeightKg: Number(latestWeighIn.weightKg),
      targetWeightKg: Number(goal.targetValue),
      dailyCalorieDeficit: deficit,
    });
    return { ...goal, projectedWeeks };
  });
}
```

- [ ] **Step 2: Implementar las rutas**

```typescript
// api/src/modules/goals/goals.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { createGoal, listGoalsWithProjection } from './goals.service';

export const goalsRouter = Router();

const createGoalSchema = z.object({
  goalType: z.enum(['target_weight', 'daily_calories', 'daily_protein', 'weekly_workouts', 'water_intake', 'custom']),
  targetValue: z.number(),
  targetDate: z.string().date().optional(),
});

goalsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await createGoal(req.userId!, parsed.data));
});

goalsRouter.get('/', requireAuth, async (req, res) => {
  res.json(await listGoalsWithProjection(req.userId!));
});
```

- [ ] **Step 3: Montar el router y probar manualmente**

```typescript
import { goalsRouter } from './modules/goals/goals.routes';
app.use('/goals', goalsRouter);
```

Run: `npm run dev`, luego `curl -X POST http://localhost:3000/goals -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"goalType":"target_weight","targetValue":75,"targetDate":"2026-10-01"}'`
Expected: `201` con el objetivo creado; `GET /goals` devuelve el objetivo con `projectedWeeks` calculado si hay al menos un pesaje registrado.

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/goals api/src/app.ts
git commit -m "feat: add goals endpoints with weight projection"
```

---

## Task 4: Lógica de rachas diarias (sección 8.3)

**Files:**
- Create: `api/src/modules/streaks/streakLogic.ts`
- Test: `api/src/modules/streaks/streakLogic.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/streaks/streakLogic.test.ts
import { describe, it, expect } from 'vitest';
import { computeStreakUpdate } from './streakLogic';

describe('computeStreakUpdate', () => {
  it('incrementa la racha si el último registro fue ayer', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-19', currentStreakDays: 4, longestStreakDays: 4 });
    expect(result).toEqual({ currentStreakDays: 5, longestStreakDays: 5, lastLoggedDate: '2026-07-20' });
  });

  it('no hace nada si ya se registró hoy', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-20', currentStreakDays: 4, longestStreakDays: 4 });
    expect(result).toEqual({ currentStreakDays: 4, longestStreakDays: 4, lastLoggedDate: '2026-07-20' });
  });

  it('reinicia la racha a 1 si se rompió (gap > 1 día)', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-10', currentStreakDays: 8, longestStreakDays: 8 });
    expect(result).toEqual({ currentStreakDays: 1, longestStreakDays: 8, lastLoggedDate: '2026-07-20' });
  });

  it('actualiza longestStreakDays cuando la racha actual lo supera', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: '2026-07-19', currentStreakDays: 10, longestStreakDays: 8 });
    expect(result.longestStreakDays).toBe(11);
  });

  it('primer registro (sin lastLoggedDate previo) inicia racha en 1', () => {
    const result = computeStreakUpdate({ today: '2026-07-20', lastLoggedDate: null, currentStreakDays: 0, longestStreakDays: 0 });
    expect(result).toEqual({ currentStreakDays: 1, longestStreakDays: 1, lastLoggedDate: '2026-07-20' });
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- streakLogic`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/streaks/streakLogic.ts`**

```typescript
export interface StreakState { currentStreakDays: number; longestStreakDays: number; lastLoggedDate: string | null }
export interface StreakUpdateResult { currentStreakDays: number; longestStreakDays: number; lastLoggedDate: string }

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay);
}

export function computeStreakUpdate(input: { today: string } & StreakState): StreakUpdateResult {
  const { today, lastLoggedDate, currentStreakDays, longestStreakDays } = input;

  if (lastLoggedDate === today) {
    return { currentStreakDays, longestStreakDays, lastLoggedDate: today };
  }

  let newCurrent: number;
  if (lastLoggedDate && daysBetween(today, lastLoggedDate) === 1) {
    newCurrent = currentStreakDays + 1;
  } else {
    newCurrent = 1; // no había registro previo, o se rompió la racha
  }

  return { currentStreakDays: newCurrent, longestStreakDays: Math.max(longestStreakDays, newCurrent), lastLoggedDate: today };
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- streakLogic`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/streaks/streakLogic.ts api/src/modules/streaks/streakLogic.test.ts
git commit -m "feat: implement daily streak update logic"
```

---

## Task 5: Insignias por hitos (sección 8.3)

**Files:**
- Create: `api/src/modules/streaks/milestones.ts`
- Test: `api/src/modules/streaks/milestones.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/streaks/milestones.test.ts
import { describe, it, expect } from 'vitest';
import { badgesEarnedForStreak } from './milestones';

describe('badgesEarnedForStreak', () => {
  it('otorga first_week al llegar a 7 días y no lo repite si ya se tenía', () => {
    expect(badgesEarnedForStreak({ newStreakDays: 7, alreadyEarnedCodes: [] })).toEqual(['first_week']);
    expect(badgesEarnedForStreak({ newStreakDays: 7, alreadyEarnedCodes: ['first_week'] })).toEqual([]);
  });

  it('otorga streak_30 al llegar a 30 días', () => {
    expect(badgesEarnedForStreak({ newStreakDays: 30, alreadyEarnedCodes: ['first_week'] })).toEqual(['streak_30']);
  });

  it('otorga múltiples insignias si se saltan varios umbrales de una vez', () => {
    expect(badgesEarnedForStreak({ newStreakDays: 30, alreadyEarnedCodes: [] })).toEqual(['first_week', 'streak_30']);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- milestones`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/streaks/milestones.ts`**

```typescript
const STREAK_BADGE_THRESHOLDS: { days: number; code: string }[] = [
  { days: 7, code: 'first_week' },
  { days: 30, code: 'streak_30' },
  { days: 100, code: 'streak_100' },
];

export function badgesEarnedForStreak(input: { newStreakDays: number; alreadyEarnedCodes: string[] }): string[] {
  return STREAK_BADGE_THRESHOLDS
    .filter((t) => input.newStreakDays >= t.days && !input.alreadyEarnedCodes.includes(t.code))
    .map((t) => t.code);
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- milestones`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/streaks/milestones.ts api/src/modules/streaks/milestones.test.ts
git commit -m "feat: implement streak milestone badge awarding"
```

---

## Task 6: Endpoints de rachas (`POST /streaks/log`, `POST /streaks/restore`)

**Files:**
- Create: `api/src/modules/streaks/streaks.service.ts`
- Create: `api/src/modules/streaks/streaks.routes.ts`

- [ ] **Step 1: Implementar el service**

```typescript
// api/src/modules/streaks/streaks.service.ts
import { db } from '../../db/client';
import { streaks, milestones, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { computeStreakUpdate } from './streakLogic';
import { badgesEarnedForStreak } from './milestones';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function logActivityForStreak(userId: string) {
  let [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId));
  if (!streak) {
    [streak] = await db.insert(streaks).values({ userId, currentStreakDays: 0, longestStreakDays: 0 }).returning();
  }

  const update = computeStreakUpdate({
    today: todayIso(),
    lastLoggedDate: streak.lastLoggedDate,
    currentStreakDays: streak.currentStreakDays ?? 0,
    longestStreakDays: streak.longestStreakDays ?? 0,
  });

  await db.update(streaks).set(update).where(eq(streaks.userId, userId));

  const existingBadges = await db.select().from(milestones).where(eq(milestones.userId, userId));
  const newBadgeCodes = badgesEarnedForStreak({ newStreakDays: update.currentStreakDays, alreadyEarnedCodes: existingBadges.map((b) => b.badgeCode) });
  if (newBadgeCodes.length > 0) {
    await db.insert(milestones).values(newBadgeCodes.map((code) => ({ userId, badgeCode: code })));
  }

  return { ...update, newBadges: newBadgeCodes };
}

// Restaurar racha (función premium, sección 8.3): solo si se saltó exactamente un día
// (today - lastLoggedDate == 2) y el usuario tiene suscripción activa.
export async function restoreStreak(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (user.subscriptionStatus === 'free') {
    throw new Object.assign(new Error('premium required'), { code: 'PREMIUM_REQUIRED' });
  }
  const [streak] = await db.select().from(streaks).where(eq(streaks.userId, userId));
  if (!streak?.lastLoggedDate) throw new Error('no streak to restore');

  const gapDays = Math.round((new Date(todayIso()).getTime() - new Date(streak.lastLoggedDate).getTime()) / (1000 * 60 * 60 * 24));
  if (gapDays !== 2) throw new Error('streak is not in a restorable state');

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [updated] = await db.update(streaks).set({ lastLoggedDate: yesterday }).where(eq(streaks.userId, userId)).returning();
  return updated;
}
```

- [ ] **Step 2: Implementar las rutas**

```typescript
// api/src/modules/streaks/streaks.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth';
import { logActivityForStreak, restoreStreak } from './streaks.service';

export const streaksRouter = Router();

streaksRouter.post('/log', requireAuth, async (req, res) => {
  res.json(await logActivityForStreak(req.userId!));
});

streaksRouter.post('/restore', requireAuth, async (req, res) => {
  try {
    res.json(await restoreStreak(req.userId!));
  } catch (err: any) {
    if (err.code === 'PREMIUM_REQUIRED') { res.status(402).json({ error: 'premium required to restore streak' }); return; }
    res.status(400).json({ error: err.message });
  }
});
```

Llamar a `logActivityForStreak` desde `photoAnalysis.service.ts` (Fase 2) cada vez que se crea o corrige un análisis, para que registrar comida cuente para la racha.

- [ ] **Step 3: Montar el router**

```typescript
import { streaksRouter } from './modules/streaks/streaks.routes';
app.use('/streaks', streaksRouter);
```

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/streaks api/src/app.ts
git commit -m "feat: add streak logging and premium restore endpoints"
```

---

## Task 7: Grupos — creación, unión, feed y reacciones (sección 8.2)

**Files:**
- Create: `api/src/modules/groups/groups.service.ts`
- Create: `api/src/modules/groups/groups.routes.ts`

- [ ] **Step 1: Implementar el service**

```typescript
// api/src/modules/groups/groups.service.ts
import { db } from '../../db/client';
import { groups, groupMembers, groupPosts, groupReactions } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

const ALLOWED_EMOJI = ['🔥', '💪', '👏', '🎉', '❤️'];

export async function createGroup(userId: string, name: string, visibility: 'private' | 'public') {
  const inviteCode = visibility === 'private' ? randomBytes(4).toString('hex') : null;
  const [group] = await db.insert(groups).values({ name, visibility, createdBy: userId, inviteCode }).returning();
  await db.insert(groupMembers).values({ groupId: group.id, userId });
  return group;
}

export async function joinGroupByInviteCode(userId: string, inviteCode: string) {
  const [group] = await db.select().from(groups).where(eq(groups.inviteCode, inviteCode));
  if (!group) throw new Error('invalid invite code');
  await db.insert(groupMembers).values({ groupId: group.id, userId }).onConflictDoNothing();
  return group;
}

export async function listPublicGroups() {
  return db.select().from(groups).where(eq(groups.visibility, 'public'));
}

export async function createPost(userId: string, groupId: string, input: { message?: string; photoAnalysisId?: string }) {
  const [membership] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  if (!membership) throw new Error('not a member of this group');
  const [post] = await db.insert(groupPosts).values({ groupId, userId, message: input.message, photoAnalysisId: input.photoAnalysisId }).returning();
  return post;
}

export async function listFeed(groupId: string) {
  return db.select().from(groupPosts).where(eq(groupPosts.groupId, groupId)).orderBy(desc(groupPosts.createdAt));
}

export async function addReaction(userId: string, postId: string, emoji: string) {
  if (!ALLOWED_EMOJI.includes(emoji)) throw new Error('emoji not allowed');
  const [reaction] = await db.insert(groupReactions).values({ groupPostId: postId, userId, emoji }).returning();
  return reaction;
}
```

- [ ] **Step 2: Implementar las rutas**

```typescript
// api/src/modules/groups/groups.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { createGroup, joinGroupByInviteCode, listPublicGroups, createPost, listFeed, addReaction } from './groups.service';

export const groupsRouter = Router();

groupsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ name: z.string().min(1), visibility: z.enum(['private', 'public']) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await createGroup(req.userId!, parsed.data.name, parsed.data.visibility));
});

groupsRouter.post('/join', requireAuth, async (req, res) => {
  const parsed = z.object({ inviteCode: z.string() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try { res.json(await joinGroupByInviteCode(req.userId!, parsed.data.inviteCode)); }
  catch (err: any) { res.status(404).json({ error: err.message }); }
});

groupsRouter.get('/public', requireAuth, async (_req, res) => res.json(await listPublicGroups()));

groupsRouter.post('/:groupId/posts', requireAuth, async (req, res) => {
  const parsed = z.object({ message: z.string().optional(), photoAnalysisId: z.string().uuid().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try { res.status(201).json(await createPost(req.userId!, req.params.groupId, parsed.data)); }
  catch (err: any) { res.status(403).json({ error: err.message }); }
});

groupsRouter.get('/:groupId/posts', requireAuth, async (req, res) => res.json(await listFeed(req.params.groupId)));

groupsRouter.post('/posts/:postId/reactions', requireAuth, async (req, res) => {
  const parsed = z.object({ emoji: z.string() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try { res.status(201).json(await addReaction(req.userId!, req.params.postId, parsed.data.emoji)); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
});
```

- [ ] **Step 3: Montar el router**

```typescript
import { groupsRouter } from './modules/groups/groups.routes';
app.use('/groups', groupsRouter);
```

- [ ] **Step 4: Commit**

```bash
git add api/src/modules/groups api/src/app.ts
git commit -m "feat: add groups, feed and emoji reactions endpoints"
```

---

## Task 8: Racha de grupo (todos los miembros registran comida)

**Files:**
- Modify: `api/src/modules/groups/groups.service.ts`

- [ ] **Step 1: Añadir el cálculo de racha de grupo**

```typescript
// añadir a api/src/modules/groups/groups.service.ts
import { streaks } from '../../db/schema';
import { inArray } from 'drizzle-orm';

// Racha de grupo activa el día que todos los miembros (o el mínimo configurable)
// registraron al menos una comida (sección 8.2).
export async function isGroupStreakActiveToday(groupId: string, minRatio = 1.0) {
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  if (members.length === 0) return false;

  const today = new Date().toISOString().slice(0, 10);
  const memberStreaks = await db.select().from(streaks).where(inArray(streaks.userId, members.map((m) => m.userId)));
  const loggedToday = memberStreaks.filter((s) => s.lastLoggedDate === today).length;

  return loggedToday / members.length >= minRatio;
}
```

- [ ] **Step 2: Exponer el endpoint**

```typescript
// añadir a api/src/modules/groups/groups.routes.ts
import { isGroupStreakActiveToday } from './groups.service';

groupsRouter.get('/:groupId/streak-active', requireAuth, async (req, res) => {
  res.json({ active: await isGroupStreakActiveToday(req.params.groupId) });
});
```

- [ ] **Step 3: Commit**

```bash
git add api/src/modules/groups
git commit -m "feat: add group streak activity check"
```

---

## Task 9: Fotos de progreso corporal en Cloudflare R2 (sección 8.4)

**Files:**
- Create: `api/src/modules/progressPhotos/r2Storage.ts`
- Create: `api/src/modules/progressPhotos/progressPhotos.service.ts`
- Create: `api/src/modules/progressPhotos/progressPhotos.routes.ts`

- [ ] **Step 1: Crear el bucket R2 y credenciales**

En el dashboard de Cloudflare, crear un bucket `fitai-progress-photos` y un API token con permisos de R2 (Object Read & Write). Añadir a `api/.env.example`:

```bash
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=fitai-progress-photos
R2_PUBLIC_URL_BASE=https://<bucket-public-domain>
```

- [ ] **Step 2: Instalar el SDK de S3**

```bash
cd api && npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 3: Implementar `api/src/modules/progressPhotos/r2Storage.ts`**

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});

export async function createUploadUrl(userId: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const key = `progress-photos/${userId}/${randomUUID()}.jpg`;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, ContentType: 'image/jpeg' }), { expiresIn: 300 });
  const publicUrl = `${process.env.R2_PUBLIC_URL_BASE}/${key}`;
  return { uploadUrl, publicUrl };
}
```

- [ ] **Step 4: Implementar el service y las rutas**

```typescript
// api/src/modules/progressPhotos/progressPhotos.service.ts
import { db } from '../../db/client';
import { progressPhotos } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export async function recordProgressPhoto(userId: string, photoUrl: string, weightAtTimeKg?: number) {
  const [row] = await db.insert(progressPhotos).values({ userId, photoUrl, weightAtTimeKg: weightAtTimeKg ? String(weightAtTimeKg) : null }).returning();
  return row;
}

export async function listProgressPhotos(userId: string) {
  return db.select().from(progressPhotos).where(eq(progressPhotos.userId, userId)).orderBy(desc(progressPhotos.takenAt));
}

export async function deleteProgressPhoto(userId: string, photoId: string) {
  await db.delete(progressPhotos).where(eq(progressPhotos.id, photoId));
  // Nota: el objeto en R2 no se borra automáticamente aquí; añadir una llamada a
  // DeleteObjectCommand con la key derivada de photoUrl si se requiere borrado físico inmediato.
}
```

```typescript
// api/src/modules/progressPhotos/progressPhotos.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { createUploadUrl } from './r2Storage';
import { recordProgressPhoto, listProgressPhotos, deleteProgressPhoto } from './progressPhotos.service';

export const progressPhotosRouter = Router();

progressPhotosRouter.post('/upload-url', requireAuth, async (req, res) => {
  res.json(await createUploadUrl(req.userId!));
});

progressPhotosRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ photoUrl: z.string().url(), weightAtTimeKg: z.number().positive().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await recordProgressPhoto(req.userId!, parsed.data.photoUrl, parsed.data.weightAtTimeKg));
});

progressPhotosRouter.get('/', requireAuth, async (req, res) => res.json(await listProgressPhotos(req.userId!)));

progressPhotosRouter.delete('/:id', requireAuth, async (req, res) => {
  await deleteProgressPhoto(req.userId!, req.params.id);
  res.status(204).send();
});
```

- [ ] **Step 5: Montar el router**

```typescript
import { progressPhotosRouter } from './modules/progressPhotos/progressPhotos.routes';
app.use('/progress-photos', progressPhotosRouter);
```

- [ ] **Step 6: Pantalla móvil de fotos de progreso (con consentimiento explícito)**

```tsx
// mobile/app/(tabs)/progress-photos.tsx
import { useState } from 'react';
import { View, Text, Pressable, FlatList, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

export default function ProgressPhotosScreen() {
  const queryClient = useQueryClient();
  const { data: photos } = useQuery({ queryKey: ['progress-photos'], queryFn: async () => (await apiClient.get('/progress-photos')).data });

  const upload = useMutation({
    mutationFn: async () => {
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (result.canceled) return;
      const { data: urls } = await apiClient.post('/progress-photos/upload-url');
      const fileData = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
      await fetch(urls.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.from(fileData, 'base64') });
      await apiClient.post('/progress-photos', { photoUrl: urls.publicUrl });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['progress-photos'] }),
  });

  function confirmAndUpload() {
    Alert.alert(
      'Guardar foto de progreso',
      'Esta foto se almacenará de forma persistente para que puedas comparar tu progreso en el tiempo. ¿Confirmas?',
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Guardar', onPress: () => upload.mutate() }],
    );
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Pressable onPress={confirmAndUpload}><Text>Añadir foto de progreso</Text></Pressable>
      <FlatList
        data={photos ?? []}
        keyExtractor={(p: any) => p.id}
        numColumns={2}
        renderItem={({ item }: any) => <Image source={{ uri: item.photoUrl }} style={{ width: 150, height: 150, margin: 4 }} />}
      />
    </View>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/progressPhotos api/src/app.ts mobile/app/\(tabs\)/progress-photos.tsx api/.env.example
git commit -m "feat: add progress photos with r2 storage and explicit consent"
```

---

## Task 10: Modos de dieta predefinidos (sección 8.6)

**Files:**
- Create: `api/src/modules/dietModes/dietModePresets.ts`
- Test: `api/src/modules/dietModes/dietModePresets.test.ts`
- Modify: `api/src/modules/users/users.service.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/dietModes/dietModePresets.test.ts
import { describe, it, expect } from 'vitest';
import { applyDietModeMacros } from './dietModePresets';

describe('applyDietModeMacros', () => {
  it('modo keto: carbos <= 10%, grasa ~70%, proteína ~20%', () => {
    const macros = applyDietModeMacros({ dietMode: 'keto', weightKg: 80, dailyCalories: 2000 });
    const carbCalories = macros.carbsG * 4;
    expect(carbCalories / 2000).toBeLessThanOrEqual(0.10 + 1e-6);
    expect((macros.fatG * 9) / 2000).toBeCloseTo(0.70, 1);
    expect((macros.proteinG * 4) / 2000).toBeCloseTo(0.20, 1);
  });

  it('modo alta proteína: 2.2-2.6 g/kg', () => {
    const macros = applyDietModeMacros({ dietMode: 'high_protein', weightKg: 80, dailyCalories: 2000 });
    expect(macros.proteinG).toBeCloseTo(80 * 2.4); // punto medio de 2.2-2.6
  });

  it('modo standard delega en el reparto por defecto de la sección 5.4', () => {
    const macros = applyDietModeMacros({ dietMode: 'standard', weightKg: 80, dailyCalories: 2000, goal: 'maintain' });
    expect(macros.proteinG).toBeCloseTo(80 * 1.8);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- dietModePresets`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/dietModes/dietModePresets.ts`**

```typescript
import { calculateMacros, type Goal } from '../users/calorieCalculator';

export type DietMode = 'standard' | 'keto' | 'high_protein' | 'vegetarian_vegan';

export interface DietModeMacroInput { dietMode: DietMode; weightKg: number; dailyCalories: number; goal?: Goal }

export function applyDietModeMacros(input: DietModeMacroInput) {
  if (input.dietMode === 'keto') {
    const fatCalories = input.dailyCalories * 0.70;
    const proteinCalories = input.dailyCalories * 0.20;
    const carbCalories = input.dailyCalories * 0.10;
    return { proteinG: proteinCalories / 4, fatG: fatCalories / 9, carbsG: carbCalories / 4 };
  }

  if (input.dietMode === 'high_protein') {
    const proteinG = input.weightKg * 2.4; // punto medio de 2.2-2.6 g/kg
    const fatCalories = input.dailyCalories * 0.275;
    const fatG = fatCalories / 9;
    const carbCalories = input.dailyCalories - proteinG * 4 - fatCalories;
    return { proteinG, fatG, carbsG: Math.max(carbCalories, 0) / 4 };
  }

  // 'standard' y 'vegetarian_vegan' usan el reparto por objetivo de la sección 5.4;
  // vegetarian_vegan solo cambia el filtrado de recetas (recipes.tags), no los macros.
  return calculateMacros({ weightKg: input.weightKg, dailyCalories: input.dailyCalories, goal: input.goal ?? 'maintain' });
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- dietModePresets`
Expected: PASS (3 tests)

- [ ] **Step 5: Usar `applyDietModeMacros` en `completeOnboarding` (Fase 1) en vez de `calculateMacros` directo, y añadir `dietMode` al payload de onboarding**

Modificar `api/src/modules/users/users.service.ts`: reemplazar la llamada a `calculateMacros(...)` por `applyDietModeMacros({ dietMode: input.dietMode ?? 'standard', weightKg: input.weightKg, dailyCalories: dailyCalorieTarget, goal: input.goal })`, y añadir `dietMode: z.enum(['standard','keto','high_protein','vegetarian_vegan']).default('standard')` al `onboardingSchema` en `users.routes.ts`.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/dietModes api/src/modules/users
git commit -m "feat: add diet mode macro presets (keto, high protein)"
```

---

## Task 11: Sincronización con Apple Health / Google Health Connect (sección 8.5)

**Files:**
- Create: `api/src/modules/healthSync/healthSync.service.ts`
- Create: `api/src/modules/healthSync/healthSync.routes.ts`
- Create: `mobile/src/health/healthSync.ts`

- [ ] **Step 1: Endpoint genérico de muestras de salud en el backend**

```typescript
// api/src/modules/healthSync/healthSync.service.ts
import { db } from '../../db/client';
import { weighIns } from '../../db/schema';
import { calculateBmi, classifyBmi } from '../weighIns/bmiCalculator';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export interface HealthSample { type: 'weight'; valueKg: number; recordedAt: string }

export async function ingestHealthSamples(userId: string, samples: HealthSample[]) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const inserted = [];
  for (const sample of samples) {
    if (sample.type !== 'weight') continue;
    const bmi = calculateBmi({ weightKg: sample.valueKg, heightCm: Number(user.heightCm) });
    const [row] = await db.insert(weighIns).values({
      userId, weightKg: String(sample.valueKg), bmi: bmi.toFixed(1), bmiCategory: classifyBmi(bmi), recordedAt: new Date(sample.recordedAt),
    }).returning();
    inserted.push(row);
  }
  return inserted;
}
```

```typescript
// api/src/modules/healthSync/healthSync.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { ingestHealthSamples } from './healthSync.service';

export const healthSyncRouter = Router();

const sampleSchema = z.object({ type: z.literal('weight'), valueKg: z.number().positive(), recordedAt: z.string().datetime() });

healthSyncRouter.post('/samples', requireAuth, async (req, res) => {
  const parsed = z.object({ samples: z.array(sampleSchema) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  res.status(201).json(await ingestHealthSamples(req.userId!, parsed.data.samples));
});
```

- [ ] **Step 2: Montar el router**

```typescript
import { healthSyncRouter } from './modules/healthSync/healthSync.routes';
app.use('/health-sync', healthSyncRouter);
```

- [ ] **Step 3: Instalar los SDKs nativos en la app móvil**

```bash
cd mobile
npm install react-native-health react-native-health-connect
npx expo prebuild # necesario porque estos SDKs requieren código nativo (no funcionan en Expo Go)
```

- [ ] **Step 4: Implementar el módulo de sincronización, pidiendo permiso explícito**

```typescript
// mobile/src/health/healthSync.ts
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

export async function requestHealthPermissionsAndSync() {
  if (Platform.OS === 'ios') {
    const AppleHealthKit = require('react-native-health').default;
    const permissions = { permissions: { read: [AppleHealthKit.Constants.Permissions.Weight], write: [] } };
    await new Promise<void>((resolve, reject) => AppleHealthKit.initHealthKit(permissions, (err: string) => (err ? reject(new Error(err)) : resolve())));

    const options = { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() };
    const samples = await new Promise<any[]>((resolve, reject) =>
      AppleHealthKit.getWeightSamples(options, (err: string, results: any[]) => (err ? reject(new Error(err)) : resolve(results))));

    await apiClient.post('/health-sync/samples', {
      samples: samples.map((s) => ({ type: 'weight', valueKg: s.value, recordedAt: s.startDate })),
    });
  } else {
    const { initialize, requestPermission, readRecords } = require('react-native-health-connect');
    await initialize();
    await requestPermission([{ accessType: 'read', recordType: 'Weight' }]);
    const { records } = await readRecords('Weight', { timeRangeFilter: { operator: 'after', startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } });

    await apiClient.post('/health-sync/samples', {
      samples: records.map((r: any) => ({ type: 'weight', valueKg: r.weight.inKilograms, recordedAt: r.time })),
    });
  }
}
```

- [ ] **Step 5: Botón de sincronización en la pantalla de progreso**

Añadir en `mobile/app/(tabs)/progress.tsx` un `Pressable` que llame a `requestHealthPermissionsAndSync()` y luego invalide la query `['weigh-ins']`. No se llama automáticamente al abrir la app — requiere acción explícita del usuario, como indica la sección 8.5.

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/healthSync api/src/app.ts mobile/src/health mobile/package.json
git commit -m "feat: add apple health / health connect weight sync"
```

---

## Task 12: Pantallas móviles de objetivos, rachas y grupos

**Files:**
- Create: `mobile/app/(tabs)/goals.tsx`
- Create: `mobile/app/(tabs)/groups/index.tsx`
- Create: `mobile/app/(tabs)/groups/create.tsx`
- Create: `mobile/app/(tabs)/groups/[groupId].tsx`

- [ ] **Step 1: Pantalla de objetivos con anillos de progreso**

```tsx
// mobile/app/(tabs)/goals.tsx
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

export default function GoalsScreen() {
  const { data: goals } = useQuery({ queryKey: ['goals'], queryFn: async () => (await apiClient.get('/goals')).data });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Tus objetivos</Text>
      <FlatList
        data={goals ?? []}
        keyExtractor={(g: any) => g.id}
        renderItem={({ item }: any) => (
          <View style={{ marginVertical: 12 }}>
            <Text>{item.goalType}: {item.currentValue} / {item.targetValue}</Text>
            {item.projectedWeeks != null && <Text>A este ritmo, llegas en ~{Math.round(item.projectedWeeks)} semanas</Text>}
          </View>
        )}
      />
    </View>
  );
}
```

- [ ] **Step 2: Lista/creación de grupos**

```tsx
// mobile/app/(tabs)/groups/index.tsx
import { View, Text, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

export default function GroupsListScreen() {
  const { data: publicGroups } = useQuery({ queryKey: ['public-groups'], queryFn: async () => (await apiClient.get('/groups/public')).data });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Pressable onPress={() => router.push('/(tabs)/groups/create')}><Text>Crear grupo</Text></Pressable>
      <Text style={{ marginTop: 16, fontWeight: '600' }}>Grupos públicos</Text>
      <FlatList
        data={publicGroups ?? []}
        keyExtractor={(g: any) => g.id}
        renderItem={({ item }: any) => (
          <Pressable onPress={() => router.push(`/(tabs)/groups/${item.id}`)}><Text>{item.name}</Text></Pressable>
        )}
      />
    </View>
  );
}
```

```tsx
// mobile/app/(tabs)/groups/create.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const create = useMutation({
    mutationFn: () => apiClient.post('/groups', { name, visibility }),
    onSuccess: ({ data }) => router.replace(`/(tabs)/groups/${data.id}`),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <TextInput placeholder="Nombre del grupo" value={name} onChangeText={setName} />
      <Pressable onPress={() => setVisibility('private')}><Text style={{ fontWeight: visibility === 'private' ? '700' : '400' }}>Privado</Text></Pressable>
      <Pressable onPress={() => setVisibility('public')}><Text style={{ fontWeight: visibility === 'public' ? '700' : '400' }}>Público</Text></Pressable>
      <Pressable onPress={() => create.mutate()}><Text>Crear</Text></Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Feed de grupo con reacciones**

```tsx
// mobile/app/(tabs)/groups/[groupId].tsx
import { View, Text, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

const EMOJIS = ['🔥', '💪', '👏', '🎉', '❤️'];

export default function GroupFeedScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { data: posts } = useQuery({ queryKey: ['group-posts', groupId], queryFn: async () => (await apiClient.get(`/groups/${groupId}/posts`)).data });

  const react = useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) => apiClient.post(`/groups/posts/${postId}/reactions`, { emoji }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] }),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(p: any) => p.id}
        renderItem={({ item }: any) => (
          <View style={{ marginVertical: 12 }}>
            <Text>{item.message}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {EMOJIS.map((emoji) => (
                <Pressable key={emoji} onPress={() => react.mutate({ postId: item.id, emoji })}><Text>{emoji}</Text></Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}
```

- [ ] **Step 4: Probar el flujo en el simulador**

Run (con `api/` y `mobile/` corriendo): crear un grupo privado, verificar el `inviteCode` en `db:studio`, publicar un post, reaccionar con un emoji.
Expected: el feed se actualiza tras cada reacción; un usuario no miembro recibe `403` al intentar publicar.

- [ ] **Step 5: Commit**

```bash
git add mobile/app/\(tabs\)/goals.tsx mobile/app/\(tabs\)/groups
git commit -m "feat: add goals, groups list, create and feed screens"
```

---

## Self-review de esta fase (cobertura vs. sección 15, Fase 3 del documento)

1. Sistema de objetivos + anillos de progreso → Tareas 2-3, 12. ✅
2. Rachas diarias + insignias/milestones → Tareas 4-6. ✅
3. Fotos de progreso corporal + tendencia → Tarea 9. La gráfica de tendencia (promedio móvil de 7 días) se implementa en la pantalla de progreso de la Fase 1 (`mobile/app/(tabs)/progress.tsx`) añadiendo un cálculo de media móvil sobre `weigh_ins`; no requiere endpoint nuevo, solo post-procesar la lista ya devuelta por `GET /weigh-ins`.
4. Grupos privados/públicos con feed y reacciones → Tareas 7-8, 12. ✅ (comentarios de texto libre quedan fuera, como recomienda el documento).
5. Sincronización con Apple Health / Google Health Connect → Tarea 11. ✅

**Pendiente explícito**: el reporte semanal automático (mencionado en 8.4) y el ajuste dinámico del presupuesto calórico por calorías activas quemadas (8.5, marcado como "función premium sugerida") no se detallan en esta fase — encajan mejor como una iteración posterior una vez que la Fase 5 (monetización) esté lista para condicionar features por `subscription_status`.
