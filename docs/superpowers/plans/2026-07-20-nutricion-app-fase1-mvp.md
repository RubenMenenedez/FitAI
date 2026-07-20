# App de Nutrición — Fase 1 (MVP base) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la base funcional de la app: modelo de datos completo, autenticación, onboarding con cálculo de TMB/TDEE/macros, importación de datos nutricionales (USDA + Open Food Facts + TheMealDB), planificador semanal con escalado de recetas, y seguimiento de peso/IMC. Al terminar esta fase, un usuario puede registrarse, completar el onboarding, ver su plan semanal de comidas escalado a sus calorías objetivo, y registrar pesajes — todo sin fotos, sin funciones sociales y sin cobros (esas son fases 2-5).

**Architecture:** Monorepo simple con dos carpetas de nivel superior: `api/` (Express + TypeScript, Drizzle ORM sobre Neon Postgres, autenticación vía Neon Auth) y `mobile/` (React Native con Expo, expo-router). El backend expone una API REST; la app móvil consume esa API y nunca habla directo con la base de datos. Los scripts de importación (USDA/OFF/TheMealDB) corren una sola vez como scripts de Node independientes que pueblan `food_items` y `recipes`.

**Tech Stack:** React Native (Expo, TypeScript), Express + TypeScript, Neon (Postgres serverless), Neon Auth (JWT), Drizzle ORM + drizzle-kit, Vitest (backend), Jest + React Native Testing Library (mobile), Zod (validación de payloads).

---

## Decisiones de arquitectura tomadas en esta fase

- **DB/Auth**: Neon Postgres + Neon Auth (decisión del usuario, sustituye a Supabase/Clerk mencionados como opciones en el documento original).
- **Storage**: Cloudflare R2 (compatible con S3) para `recipes.image_url` y, en fases posteriores, `progress_photos.photo_url`. Neon no incluye storage de archivos, así que se necesita un proveedor aparte; R2 no cobra egress, lo que lo hace más barato que S3 para servir imágenes a la app.
- **Backend framework**: Express (no NestJS) — para un equipo pequeño/solo, Express con una estructura de carpetas por módulo da la misma claridad sin la ceremonia de decoradores/DI de NestJS.
- **ORM**: Drizzle — tiene soporte de primera clase para el driver serverless de Neon (`@neondatabase/serverless`) y genera SQL explícito, fácil de razonar.
- **Comidas por día**: se pregunta en el onboarding (3 vs 5-6), ver Tarea 4.

---

## File Structure

```
fitai/
├── api/
│   ├── src/
│   │   ├── db/
│   │   │   ├── client.ts                 # conexión Neon + instancia Drizzle
│   │   │   ├── schema.ts                 # todas las tablas de la Fase 1
│   │   │   └── seed/
│   │   │       ├── importUsda.ts
│   │   │       ├── importOpenFoodFacts.ts
│   │   │       └── importTheMealDb.ts
│   │   ├── auth/
│   │   │   ├── verifyToken.ts            # valida JWT de Neon Auth
│   │   │   └── requireAuth.ts            # middleware Express
│   │   ├── modules/
│   │   │   ├── users/
│   │   │   │   ├── calorieCalculator.ts  # TMB/TDEE/macros (sección 5)
│   │   │   │   ├── calorieCalculator.test.ts
│   │   │   │   ├── users.routes.ts
│   │   │   │   └── users.service.ts
│   │   │   ├── weighIns/
│   │   │   │   ├── bmiCalculator.ts
│   │   │   │   ├── bmiCalculator.test.ts
│   │   │   │   ├── weighIns.routes.ts
│   │   │   │   └── weighIns.service.ts
│   │   │   └── mealPlans/
│   │   │       ├── mealDistribution.ts   # % de calorías por comida (3 vs 5-6)
│   │   │       ├── mealDistribution.test.ts
│   │   │       ├── recipeScaling.ts      # sección 6.2
│   │   │       ├── recipeScaling.test.ts
│   │   │       ├── recipeSelector.ts     # sección 6.1
│   │   │       ├── recipeSelector.test.ts
│   │   │       ├── mealPlans.routes.ts
│   │   │       └── mealPlans.service.ts
│   │   ├── app.ts                        # ensambla Express app + rutas
│   │   └── server.ts                     # entrypoint (listen)
│   ├── drizzle.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env.example
├── mobile/
│   ├── app/
│   │   ├── (onboarding)/
│   │   │   ├── personal-data.tsx
│   │   │   ├── activity-goal.tsx
│   │   │   └── meals-per-day.tsx
│   │   ├── (tabs)/
│   │   │   ├── dashboard.tsx
│   │   │   ├── planner.tsx
│   │   │   └── progress.tsx
│   │   └── _layout.tsx
│   ├── src/
│   │   ├── api/client.ts
│   │   └── types/index.ts
│   ├── package.json
│   └── app.json
└── docs/superpowers/plans/               # este archivo y los de las otras fases
```

---

## Task 1: Monorepo scaffolding + Neon project

**Files:**
- Create: `api/package.json`, `api/tsconfig.json`, `api/.env.example`
- Create: `mobile/` (vía `create-expo-app`)

- [ ] **Step 1: Crear el proyecto Neon**

En https://console.neon.tech, crear un proyecto nuevo llamado `fitai`. Copiar el connection string (formato `postgresql://<user>:<password>@<host>/<db>?sslmode=require`).

- [ ] **Step 2: Habilitar Neon Auth en el proyecto**

En el dashboard del proyecto Neon, ir a la pestaña "Auth" y habilitarlo. Neon Auth crea automáticamente un esquema `neon_auth` con la tabla `neon_auth.users_sync` (sincronizada desde Stack Auth) y expone `NEXT_PUBLIC_STACK_PROJECT_ID`, `STACK_SECRET_SERVER_KEY` y `JWKS_URL`. Guardar esos tres valores.

- [ ] **Step 3: Inicializar el backend**

```bash
mkdir -p api && cd api
npm init -y
npm install express cors dotenv zod drizzle-orm @neondatabase/serverless jose
npm install -D typescript tsx vitest @types/express @types/node @types/cors drizzle-kit
npx tsc --init --rootDir src --outDir dist --module commonjs --target es2022 --esModuleInterop --strict --skipLibCheck
```

- [ ] **Step 4: Crear `api/.env.example`**

```bash
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
NEON_AUTH_PROJECT_ID=
NEON_AUTH_JWKS_URL=
PORT=3000
```

Copiar a `api/.env` (no versionado) con los valores reales del Paso 1 y 2.

- [ ] **Step 5: Configurar scripts en `api/package.json`**

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 6: Inicializar la app móvil**

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npm install @tanstack/react-query axios zod
```

- [ ] **Step 7: Commit**

```bash
git init
git add api/package.json api/tsconfig.json api/.env.example mobile/
git commit -m "chore: scaffold api and mobile projects"
```

---

## Task 2: Schema de base de datos (Fase 1) + migraciones

**Files:**
- Create: `api/src/db/client.ts`
- Create: `api/src/db/schema.ts`
- Create: `api/drizzle.config.ts`
- Test: `api/src/db/schema.test.ts`

- [ ] **Step 1: Escribir `api/src/db/client.ts`**

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 2: Escribir `api/src/db/schema.ts` (tablas de la Fase 1)**

```typescript
import {
  pgTable, uuid, text, numeric, integer, timestamp, date, boolean, pgEnum,
} from 'drizzle-orm/pg-core';

export const sexEnum = pgEnum('sex', ['male', 'female']);
export const activityLevelEnum = pgEnum('activity_level', [
  'sedentary', 'light', 'moderate', 'active', 'very_active',
]);
export const goalEnum = pgEnum('goal', ['lose_fat', 'maintain', 'gain_muscle']);
export const mealsPerDayEnum = pgEnum('meals_per_day', ['3', '5_6']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['free', 'monthly', 'annual']);
export const bmiCategoryEnum = pgEnum('bmi_category', ['underweight', 'normal', 'overweight', 'obese']);
export const foodSourceEnum = pgEnum('food_source', ['usda', 'off']);
export const recipeSourceEnum = pgEnum('recipe_source', ['themealdb', 'ai_generated']);
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // igual al id de neon_auth.users_sync
  email: text('email').unique().notNull(),
  name: text('name'),
  sex: sexEnum('sex'),
  birthDate: date('birth_date'),
  heightCm: numeric('height_cm'),
  activityLevel: activityLevelEnum('activity_level'),
  goal: goalEnum('goal'),
  mealsPerDay: mealsPerDayEnum('meals_per_day').default('3'),
  dailyCalorieTarget: numeric('daily_calorie_target'),
  dailyProteinTargetG: numeric('daily_protein_target_g'),
  dailyCarbsTargetG: numeric('daily_carbs_target_g'),
  dailyFatTargetG: numeric('daily_fat_target_g'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const weighIns = pgTable('weigh_ins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  weightKg: numeric('weight_kg').notNull(),
  bmi: numeric('bmi').notNull(),
  bmiCategory: bmiCategoryEnum('bmi_category').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow(),
});

export const foodItems = pgTable('food_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: foodSourceEnum('source').notNull(),
  sourceId: text('source_id').notNull(),
  name: text('name').notNull(),
  nameNormalized: text('name_normalized').notNull(),
  caloriesPer100g: numeric('calories_per_100g').notNull(),
  proteinGPer100g: numeric('protein_g_per_100g').notNull(),
  carbsGPer100g: numeric('carbs_g_per_100g').notNull(),
  fatGPer100g: numeric('fat_g_per_100g').notNull(),
  category: text('category'),
});

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: recipeSourceEnum('source').notNull(),
  title: text('title').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  tags: text('tags').array().default([]),
  baseServings: integer('base_servings').notNull(),
  instructions: text('instructions'),
  imageUrl: text('image_url'),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  foodItemId: uuid('food_item_id').references(() => foodItems.id).notNull(),
  baseGrams: numeric('base_grams').notNull(),
});

export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  weekStartDate: date('week_start_date').notNull(),
});

export const mealPlanItems = pgTable('meal_plan_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealPlanId: uuid('meal_plan_id').references(() => mealPlans.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  slotOrder: integer('slot_order').notNull(), // desambigua múltiples snacks el mismo día
  mealType: mealTypeEnum('meal_type').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
  scaleFactor: numeric('scale_factor').notNull(),
  targetCalories: numeric('target_calories').notNull(),
});
```

- [ ] **Step 3: Configurar `api/drizzle.config.ts`**

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 4: Generar y aplicar la migración**

```bash
npm run db:generate
npm run db:migrate
```

Expected: se crea `api/drizzle/0000_*.sql` y las tablas aparecen en Neon (verificar con `npm run db:studio`).

- [ ] **Step 5: Escribir test de humo del schema**

```typescript
// api/src/db/schema.test.ts
import { describe, it, expect } from 'vitest';
import { db } from './client';
import { foodItems } from './schema';

describe('db schema', () => {
  it('conecta y puede hacer un select vacío sobre food_items', async () => {
    const rows = await db.select().from(foodItems).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
```

- [ ] **Step 6: Correr el test**

Run: `npm test`
Expected: PASS (1 test)

- [ ] **Step 7: Commit**

```bash
git add api/src/db api/drizzle.config.ts api/drizzle
git commit -m "feat: add fase 1 db schema and migration"
```

---

## Task 3: Autenticación (Neon Auth) y middleware `requireAuth`

**Files:**
- Create: `api/src/auth/verifyToken.ts`
- Create: `api/src/auth/requireAuth.ts`
- Test: `api/src/auth/requireAuth.test.ts`

- [ ] **Step 1: Escribir el test del middleware**

```typescript
// api/src/auth/requireAuth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from './requireAuth';
import * as verifyTokenModule from './verifyToken';

function mockReqRes(authHeader?: string) {
  const req: any = { headers: { authorization: authHeader } };
  const res: any = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('requireAuth', () => {
  it('responde 401 si no hay header Authorization', async () => {
    const { req, res, next } = mockReqRes(undefined);
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('adjunta req.userId y llama next() si el token es válido', async () => {
    vi.spyOn(verifyTokenModule, 'verifyToken').mockResolvedValue({ sub: 'user-123' } as any);
    const { req, res, next } = mockReqRes('Bearer valid-token');
    await requireAuth(req, res, next);
    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- requireAuth`
Expected: FAIL (los archivos `verifyToken.ts` / `requireAuth.ts` no existen)

- [ ] **Step 3: Implementar `api/src/auth/verifyToken.ts`**

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: undefined, // Neon Auth (Stack Auth) firma sin issuer fijo por proyecto; validar solo firma+exp
  });
  return payload as { sub: string; email?: string };
}
```

- [ ] **Step 4: Implementar `api/src/auth/requireAuth.ts`**

```typescript
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './verifyToken';

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing bearer token' });
    return;
  }
  try {
    const payload = await verifyToken(header.slice('Bearer '.length));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npm test -- requireAuth`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add api/src/auth
git commit -m "feat: add neon auth token verification middleware"
```

---

## Task 4: Cálculo de TMB/TDEE/macros (sección 5 del documento)

**Files:**
- Create: `api/src/modules/users/calorieCalculator.ts`
- Test: `api/src/modules/users/calorieCalculator.test.ts`

- [ ] **Step 1: Escribir los tests (fórmula Mifflin-St Jeor + ajuste por objetivo + macros)**

```typescript
// api/src/modules/users/calorieCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBmr, calculateTdee, calculateCalorieTarget, calculateMacros } from './calorieCalculator';

describe('calculateBmr', () => {
  it('calcula TMB para un hombre (Mifflin-St Jeor)', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBmr({ sex: 'male', weightKg: 80, heightCm: 180, age: 30 })).toBeCloseTo(1780);
  });

  it('calcula TMB para una mujer (Mifflin-St Jeor)', () => {
    // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
    expect(calculateBmr({ sex: 'female', weightKg: 65, heightCm: 165, age: 28 })).toBeCloseTo(1380.25);
  });
});

describe('calculateTdee', () => {
  it('multiplica TMB por el factor de actividad', () => {
    expect(calculateTdee(1780, 'moderate')).toBeCloseTo(1780 * 1.55);
  });
});

describe('calculateCalorieTarget', () => {
  it('aplica déficit del 17.5% (punto medio de 15-20%) para bajar grasa', () => {
    expect(calculateCalorieTarget(2000, 'lose_fat')).toBeCloseTo(2000 * 0.825);
  });
  it('no cambia las calorías para mantener', () => {
    expect(calculateCalorieTarget(2000, 'maintain')).toBeCloseTo(2000);
  });
  it('aplica superávit del 12.5% (punto medio de 10-15%) para ganar músculo', () => {
    expect(calculateCalorieTarget(2000, 'gain_muscle')).toBeCloseTo(2000 * 1.125);
  });
});

describe('calculateMacros', () => {
  it('reparte proteína, grasa y carbos para bajar grasa', () => {
    // proteína 2.2 g/kg (punto medio de 2.0-2.4), grasa 27.5% (punto medio de 25-30%)
    const macros = calculateMacros({ weightKg: 80, dailyCalories: 1650, goal: 'lose_fat' });
    expect(macros.proteinG).toBeCloseTo(80 * 2.2);
    const fatCalories = 1650 * 0.275;
    expect(macros.fatG).toBeCloseTo(fatCalories / 9);
    const proteinCalories = macros.proteinG * 4;
    const carbCalories = 1650 - proteinCalories - fatCalories;
    expect(macros.carbsG).toBeCloseTo(carbCalories / 4);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- calorieCalculator`
Expected: FAIL (`calorieCalculator.ts` no existe)

- [ ] **Step 3: Implementar `api/src/modules/users/calorieCalculator.ts`**

```typescript
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose_fat' | 'maintain' | 'gain_muscle';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_fat: -0.175,   // punto medio de -15% a -20%
  maintain: 0,
  gain_muscle: 0.125, // punto medio de +10% a +15%
};

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_fat: 2.2,      // punto medio 2.0-2.4
  maintain: 1.8,      // punto medio 1.6-2.0
  gain_muscle: 2.0,   // punto medio 1.8-2.2
};

const FAT_PERCENT: Record<Goal, number> = {
  lose_fat: 0.275,    // punto medio 25-30%
  maintain: 0.275,
  gain_muscle: 0.275,
};

export function calculateBmr(input: { sex: Sex; weightKg: number; heightCm: number; age: number }): number {
  const { sex, weightKg, heightCm, age } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  return tdee * (1 + CALORIE_ADJUSTMENT[goal]);
}

export function calculateMacros(input: { weightKg: number; dailyCalories: number; goal: Goal }) {
  const { weightKg, dailyCalories, goal } = input;
  const proteinG = weightKg * PROTEIN_G_PER_KG[goal];
  const fatCalories = dailyCalories * FAT_PERCENT[goal];
  const fatG = fatCalories / 9;
  const proteinCalories = proteinG * 4;
  const carbCalories = dailyCalories - proteinCalories - fatCalories;
  const carbsG = Math.max(carbCalories, 0) / 4;
  return { proteinG, fatG, carbsG };
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- calorieCalculator`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/users/calorieCalculator.ts api/src/modules/users/calorieCalculator.test.ts
git commit -m "feat: implement bmr/tdee/macro calculation (mifflin-st jeor)"
```

---

## Task 5: Endpoint de onboarding (`POST /users/onboarding`)

**Files:**
- Create: `api/src/modules/users/users.service.ts`
- Create: `api/src/modules/users/users.routes.ts`
- Test: `api/src/modules/users/users.service.test.ts`

- [ ] **Step 1: Escribir el test del service**

```typescript
// api/src/modules/users/users.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeOnboarding } from './users.service';
import { db } from '../../db/client';

vi.mock('../../db/client', () => ({
  db: { update: vi.fn(), where: vi.fn(), set: vi.fn(), returning: vi.fn() },
}));

describe('completeOnboarding', () => {
  it('calcula y persiste daily_calorie_target y macros a partir de los datos del onboarding', async () => {
    const chain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'u1', dailyCalorieTarget: '1650' }]),
    };
    (db.update as any).mockReturnValue(chain);

    const result = await completeOnboarding('u1', {
      sex: 'male', birthDate: '1996-01-15', heightCm: 180, weightKg: 80,
      activityLevel: 'moderate', goal: 'lose_fat', mealsPerDay: '3',
    });

    expect(chain.set).toHaveBeenCalled();
    const setArg = chain.set.mock.calls[0][0];
    expect(setArg.dailyCalorieTarget).toBeGreaterThan(0);
    expect(setArg.dailyProteinTargetG).toBeGreaterThan(0);
    expect(result.id).toBe('u1');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- users.service`
Expected: FAIL (`users.service.ts` no existe)

- [ ] **Step 3: Implementar `api/src/modules/users/users.service.ts`**

```typescript
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { calculateBmr, calculateTdee, calculateCalorieTarget, calculateMacros, type Sex, type ActivityLevel, type Goal } from './calorieCalculator';

export interface OnboardingInput {
  sex: Sex;
  birthDate: string; // ISO date
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  mealsPerDay: '3' | '5_6';
}

function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const diffMs = Date.now() - birth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const age = ageFromBirthDate(input.birthDate);
  const bmr = calculateBmr({ sex: input.sex, weightKg: input.weightKg, heightCm: input.heightCm, age });
  const tdee = calculateTdee(bmr, input.activityLevel);
  const dailyCalorieTarget = calculateCalorieTarget(tdee, input.goal);
  const macros = calculateMacros({ weightKg: input.weightKg, dailyCalories: dailyCalorieTarget, goal: input.goal });

  const [updated] = await db.update(users).set({
    sex: input.sex,
    birthDate: input.birthDate,
    heightCm: String(input.heightCm),
    activityLevel: input.activityLevel,
    goal: input.goal,
    mealsPerDay: input.mealsPerDay,
    dailyCalorieTarget: dailyCalorieTarget.toFixed(0),
    dailyProteinTargetG: macros.proteinG.toFixed(1),
    dailyCarbsTargetG: macros.carbsG.toFixed(1),
    dailyFatTargetG: macros.fatG.toFixed(1),
  }).where(eq(users.id, userId)).returning();

  return updated;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- users.service`
Expected: PASS (1 test)

- [ ] **Step 5: Implementar `api/src/modules/users/users.routes.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { completeOnboarding } from './users.service';

const onboardingSchema = z.object({
  sex: z.enum(['male', 'female']),
  birthDate: z.string().date(),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose_fat', 'maintain', 'gain_muscle']),
  mealsPerDay: z.enum(['3', '5_6']),
});

export const usersRouter = Router();

usersRouter.post('/onboarding', requireAuth, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await completeOnboarding(req.userId!, parsed.data);
  res.status(200).json(user);
});
```

- [ ] **Step 6: Montar el router en `api/src/app.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import { usersRouter } from './modules/users/users.routes';

export const app = express();
app.use(cors());
app.use(express.json());
app.use('/users', usersRouter);
```

- [ ] **Step 7: Crear `api/src/server.ts`**

```typescript
import 'dotenv/config';
import { app } from './app';

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`api listening on :${port}`));
```

- [ ] **Step 8: Levantar el servidor y probar manualmente**

Run: `npm run dev`, luego en otra terminal:
```bash
curl -X POST http://localhost:3000/users/onboarding \
  -H "Authorization: Bearer <token-de-prueba>" -H "Content-Type: application/json" \
  -d '{"sex":"male","birthDate":"1996-01-15","heightCm":180,"weightKg":80,"activityLevel":"moderate","goal":"lose_fat","mealsPerDay":"3"}'
```
Expected: `401` si el token no es válido (esperado sin un usuario real de Neon Auth todavía), o `200` con el usuario actualizado si se usa un token válido de un usuario ya sincronizado en `neon_auth.users_sync`.

- [ ] **Step 9: Commit**

```bash
git add api/src/modules/users api/src/app.ts api/src/server.ts
git commit -m "feat: add onboarding endpoint with calorie/macro calculation"
```

---

## Task 6: Pantallas de onboarding en la app móvil

**Files:**
- Create: `mobile/src/api/client.ts`
- Create: `mobile/app/(onboarding)/personal-data.tsx`
- Create: `mobile/app/(onboarding)/activity-goal.tsx`
- Create: `mobile/app/(onboarding)/meals-per-day.tsx`
- Create: `mobile/app/_layout.tsx`

- [ ] **Step 1: Crear el cliente API**

```typescript
// mobile/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
});

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
```

- [ ] **Step 2: Pantalla de datos personales**

```tsx
// mobile/app/(onboarding)/personal-data.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../src/state/onboardingStore';

export default function PersonalDataScreen() {
  const { data, setData } = useOnboardingStore();
  const [heightCm, setHeightCm] = useState(data.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(data.weightKg?.toString() ?? '');

  function handleNext() {
    setData({ heightCm: Number(heightCm), weightKg: Number(weightKg) });
    router.push('/(onboarding)/activity-goal');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Tus datos</Text>
      <TextInput placeholder="Altura (cm)" keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />
      <TextInput placeholder="Peso (kg)" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
      <Pressable onPress={handleNext}><Text>Siguiente</Text></Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Store de estado del onboarding**

```typescript
// mobile/src/state/onboardingStore.ts
import { create } from 'zustand';

export interface OnboardingData {
  sex?: 'male' | 'female';
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'lose_fat' | 'maintain' | 'gain_muscle';
  mealsPerDay?: '3' | '5_6';
}

export const useOnboardingStore = create<{ data: OnboardingData; setData: (d: Partial<OnboardingData>) => void }>((set) => ({
  data: {},
  setData: (d) => set((s) => ({ data: { ...s.data, ...d } })),
}));
```

Ejecutar `npm install zustand` dentro de `mobile/` antes de continuar.

- [ ] **Step 4: Pantalla de actividad/objetivo**

```tsx
// mobile/app/(onboarding)/activity-goal.tsx
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../src/state/onboardingStore';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentario' },
  { value: 'light', label: 'Ligero' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'active', label: 'Activo' },
  { value: 'very_active', label: 'Muy activo' },
] as const;

const GOAL_OPTIONS = [
  { value: 'lose_fat', label: 'Bajar grasa' },
  { value: 'maintain', label: 'Mantener' },
  { value: 'gain_muscle', label: 'Ganar músculo' },
] as const;

export default function ActivityGoalScreen() {
  const { data, setData } = useOnboardingStore();

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Actividad y objetivo</Text>
      {ACTIVITY_OPTIONS.map((opt) => (
        <Pressable key={opt.value} onPress={() => setData({ activityLevel: opt.value })}>
          <Text style={{ fontWeight: data.activityLevel === opt.value ? '700' : '400' }}>{opt.label}</Text>
        </Pressable>
      ))}
      {GOAL_OPTIONS.map((opt) => (
        <Pressable key={opt.value} onPress={() => setData({ goal: opt.value })}>
          <Text style={{ fontWeight: data.goal === opt.value ? '700' : '400' }}>{opt.label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={() => router.push('/(onboarding)/meals-per-day')}><Text>Siguiente</Text></Pressable>
    </View>
  );
}
```

- [ ] **Step 5: Pantalla de comidas por día + envío final**

```tsx
// mobile/app/(onboarding)/meals-per-day.tsx
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../src/state/onboardingStore';
import { apiClient } from '../../src/api/client';

export default function MealsPerDayScreen() {
  const { data, setData } = useOnboardingStore();

  async function handleFinish(mealsPerDay: '3' | '5_6') {
    setData({ mealsPerDay });
    await apiClient.post('/users/onboarding', { ...data, mealsPerDay });
    router.replace('/(tabs)/dashboard');
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>¿Cuántas comidas al día prefieres?</Text>
      <Pressable onPress={() => handleFinish('3')}><Text>3 comidas (desayuno, comida, cena)</Text></Pressable>
      <Pressable onPress={() => handleFinish('5_6')}><Text>5-6 comidas (con snacks)</Text></Pressable>
    </View>
  );
}
```

- [ ] **Step 6: Layout raíz con expo-router**

```tsx
// mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Probar el flujo en el simulador/dispositivo**

Run (dentro de `mobile/`): `npx expo start`
Expected: la app abre en `personal-data`, se puede navegar por las 3 pantallas y al finalizar hace `POST /users/onboarding` (verificar en los logs del backend con `npm run dev` corriendo).

- [ ] **Step 8: Commit**

```bash
git add mobile/app mobile/src
git commit -m "feat: add onboarding flow screens"
```

---

## Task 7: Seguimiento de peso + IMC (`weigh_ins`)

**Files:**
- Create: `api/src/modules/weighIns/bmiCalculator.ts`
- Create: `api/src/modules/weighIns/weighIns.service.ts`
- Create: `api/src/modules/weighIns/weighIns.routes.ts`
- Test: `api/src/modules/weighIns/bmiCalculator.test.ts`

- [ ] **Step 1: Escribir el test del cálculo de IMC**

```typescript
// api/src/modules/weighIns/bmiCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculateBmi, classifyBmi } from './bmiCalculator';

describe('calculateBmi', () => {
  it('calcula IMC = peso / altura_m^2', () => {
    expect(calculateBmi({ weightKg: 80, heightCm: 180 })).toBeCloseTo(80 / (1.8 * 1.8));
  });
});

describe('classifyBmi', () => {
  it('clasifica bajo peso', () => expect(classifyBmi(17)).toBe('underweight'));
  it('clasifica normal', () => expect(classifyBmi(22)).toBe('normal'));
  it('clasifica sobrepeso', () => expect(classifyBmi(27)).toBe('overweight'));
  it('clasifica obesidad', () => expect(classifyBmi(32)).toBe('obese'));
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- bmiCalculator`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/weighIns/bmiCalculator.ts`**

```typescript
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
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- bmiCalculator`
Expected: PASS (5 tests)

- [ ] **Step 5: Implementar el service y las rutas**

```typescript
// api/src/modules/weighIns/weighIns.service.ts
import { db } from '../../db/client';
import { weighIns, users } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { calculateBmi, classifyBmi } from './bmiCalculator';

export async function recordWeighIn(userId: string, weightKg: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const bmi = calculateBmi({ weightKg, heightCm: Number(user.heightCm) });
  const [row] = await db.insert(weighIns).values({
    userId, weightKg: String(weightKg), bmi: bmi.toFixed(1), bmiCategory: classifyBmi(bmi),
  }).returning();
  return row;
}

export async function listWeighIns(userId: string) {
  return db.select().from(weighIns).where(eq(weighIns.userId, userId)).orderBy(desc(weighIns.recordedAt));
}
```

```typescript
// api/src/modules/weighIns/weighIns.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { recordWeighIn, listWeighIns } from './weighIns.service';

export const weighInsRouter = Router();

weighInsRouter.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ weightKg: z.number().positive() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await recordWeighIn(req.userId!, parsed.data.weightKg);
  res.status(201).json(row);
});

weighInsRouter.get('/', requireAuth, async (req, res) => {
  res.json(await listWeighIns(req.userId!));
});
```

- [ ] **Step 6: Montar el router en `api/src/app.ts`**

```typescript
import { weighInsRouter } from './modules/weighIns/weighIns.routes';
app.use('/weigh-ins', weighInsRouter);
```

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/weighIns api/src/app.ts
git commit -m "feat: add weigh-in tracking with bmi calculation"
```

---

## Task 8: Importación de USDA FoodData Central → `food_items`

**Files:**
- Create: `api/src/db/seed/importUsda.ts`
- Test: `api/src/db/seed/normalizeName.test.ts`
- Create: `api/src/db/seed/normalizeName.ts`

- [ ] **Step 1: Descargar el dataset**

Descargar "Foundation Foods" (JSON) desde https://fdc.nal.usda.gov/download-datasets → guardar como `api/src/db/seed/data/foundationFoods.json` (no versionar, añadir `api/src/db/seed/data/` a `.gitignore`).

- [ ] **Step 2: Escribir el test de normalización de nombres**

```typescript
// api/src/db/seed/normalizeName.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeName } from './normalizeName';

describe('normalizeName', () => {
  it('pasa a minúsculas y quita espacios extra', () => {
    expect(normalizeName('Chicken Breast,  Raw')).toBe('chicken breast, raw');
  });
  it('quita marcas entre paréntesis', () => {
    expect(normalizeName('Peanut Butter (Jif)')).toBe('peanut butter');
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `npm test -- normalizeName`
Expected: FAIL

- [ ] **Step 4: Implementar `api/src/db/seed/normalizeName.ts`**

```typescript
export function normalizeName(raw: string): string {
  return raw
    .replace(/\([^)]*\)/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npm test -- normalizeName`
Expected: PASS (2 tests)

- [ ] **Step 6: Implementar el script de importación**

```typescript
// api/src/db/seed/importUsda.ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../client';
import { foodItems } from '../schema';
import { normalizeName } from './normalizeName';

const NUTRIENT_IDS = { calories: 1008, protein: 1003, fat: 1004, carbs: 1005 } as const;

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: { nutrient: { id: number }; amount: number }[];
}

function nutrientAmount(food: UsdaFood, nutrientId: number): number {
  return food.foodNutrients.find((n) => n.nutrient.id === nutrientId)?.amount ?? 0;
}

async function main() {
  const raw = fs.readFileSync(path.join(__dirname, 'data/foundationFoods.json'), 'utf-8');
  const { FoundationFoods } = JSON.parse(raw) as { FoundationFoods: UsdaFood[] };

  const rows = FoundationFoods.map((food) => ({
    source: 'usda' as const,
    sourceId: String(food.fdcId),
    name: food.description,
    nameNormalized: normalizeName(food.description),
    caloriesPer100g: String(nutrientAmount(food, NUTRIENT_IDS.calories)),
    proteinGPer100g: String(nutrientAmount(food, NUTRIENT_IDS.protein)),
    carbsGPer100g: String(nutrientAmount(food, NUTRIENT_IDS.carbs)),
    fatGPer100g: String(nutrientAmount(food, NUTRIENT_IDS.fat)),
    category: null,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(foodItems).values(rows.slice(i, i + BATCH_SIZE));
    console.log(`insertados ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 7: Correr la importación**

Run: `npx tsx src/db/seed/importUsda.ts`
Expected: log de progreso hasta completar; verificar con `npm run db:studio` que `food_items` tiene filas con `source = 'usda'`.

- [ ] **Step 8: Commit**

```bash
echo "api/src/db/seed/data/" >> .gitignore
git add api/src/db/seed api/.gitignore
git commit -m "feat: add usda food data import script"
```

---

## Task 9: Importación de TheMealDB → `recipes` + `recipe_ingredients`

**Files:**
- Create: `api/src/db/seed/importTheMealDb.ts`
- Test: `api/src/db/seed/matchFoodItem.test.ts`
- Create: `api/src/db/seed/matchFoodItem.ts`

- [ ] **Step 1: Escribir el test de matching difuso contra `food_items`**

```typescript
// api/src/db/seed/matchFoodItem.test.ts
import { describe, it, expect } from 'vitest';
import { findBestFoodItemMatch } from './matchFoodItem';

describe('findBestFoodItemMatch', () => {
  const candidates = [
    { id: '1', nameNormalized: 'chicken breast, raw' },
    { id: '2', nameNormalized: 'white rice, cooked' },
  ];

  it('encuentra la coincidencia más cercana por substring', () => {
    const match = findBestFoodItemMatch('chicken breast', candidates);
    expect(match?.id).toBe('1');
  });

  it('devuelve undefined si no hay ninguna coincidencia razonable', () => {
    const match = findBestFoodItemMatch('xyz-nonexistent', candidates);
    expect(match).toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- matchFoodItem`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/db/seed/matchFoodItem.ts`**

```typescript
import { normalizeName } from './normalizeName';

export interface FoodItemCandidate { id: string; nameNormalized: string }

export function findBestFoodItemMatch(ingredientName: string, candidates: FoodItemCandidate[]): FoodItemCandidate | undefined {
  const target = normalizeName(ingredientName);
  const targetWords = target.split(' ').filter((w) => w.length > 2);

  let best: { candidate: FoodItemCandidate; score: number } | undefined;
  for (const candidate of candidates) {
    const matchingWords = targetWords.filter((w) => candidate.nameNormalized.includes(w));
    const score = matchingWords.length / Math.max(targetWords.length, 1);
    if (score > 0.5 && (!best || score > best.score)) {
      best = { candidate, score };
    }
  }
  return best?.candidate;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- matchFoodItem`
Expected: PASS (2 tests)

- [ ] **Step 5: Implementar el script de importación de TheMealDB**

```typescript
// api/src/db/seed/importTheMealDb.ts
import 'dotenv/config';
import { db } from '../client';
import { foodItems, recipes, recipeIngredients } from '../schema';
import { findBestFoodItemMatch } from './matchFoodItem';

const CATEGORY_TO_MEAL_TYPE: Record<string, 'breakfast' | 'lunch' | 'dinner' | 'snack'> = {
  Breakfast: 'breakfast',
  Starter: 'snack',
  Side: 'snack',
  Dessert: 'snack',
};

interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strInstructions: string;
  strMealThumb: string;
  [key: `strIngredient${number}`]: string | undefined;
  [key: `strMeasure${number}`]: string | undefined;
}

function extractIngredients(meal: MealDbMeal): { name: string; measure: string }[] {
  const result: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i += 1) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name?.trim()) result.push({ name: name.trim(), measure: (measure ?? '').trim() });
  }
  return result;
}

function measureToGrams(measure: string): number {
  const match = measure.match(/([\d.]+)\s*(g|kg|ml|l)?/i);
  if (!match) return 100; // fallback conservador si no se puede parsear la medida
  const value = parseFloat(match[1]);
  const unit = (match[2] ?? 'g').toLowerCase();
  if (unit === 'kg' || unit === 'l') return value * 1000;
  return value;
}

async function main() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const allFoodItems = await db.select({ id: foodItems.id, nameNormalized: foodItems.nameNormalized }).from(foodItems);

  for (const letter of letters) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
    const { meals } = (await response.json()) as { meals: MealDbMeal[] | null };
    if (!meals) continue;

    for (const meal of meals) {
      const [recipe] = await db.insert(recipes).values({
        source: 'themealdb',
        title: meal.strMeal,
        mealType: CATEGORY_TO_MEAL_TYPE[meal.strCategory] ?? 'lunch',
        tags: [meal.strCategory.toLowerCase()],
        baseServings: 1,
        instructions: meal.strInstructions,
        imageUrl: meal.strMealThumb,
      }).returning();

      const ingredients = extractIngredients(meal);
      for (const ingredient of ingredients) {
        const match = findBestFoodItemMatch(ingredient.name, allFoodItems);
        if (!match) continue; // se descarta el ingrediente si no hay match nutricional confiable
        await db.insert(recipeIngredients).values({
          recipeId: recipe.id,
          foodItemId: match.id,
          baseGrams: String(measureToGrams(ingredient.measure)),
        });
      }
    }
    console.log(`letra ${letter} procesada`);
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 6: Correr la importación**

Run: `npx tsx src/db/seed/importTheMealDb.ts`
Expected: procesa las 26 letras y crea filas en `recipes` y `recipe_ingredients` (verificar en `db:studio`; nota: requiere haber corrido primero la importación de USDA de la Tarea 8 para que existan candidatos de matching).

- [ ] **Step 7: Commit**

```bash
git add api/src/db/seed
git commit -m "feat: add themealdb recipe import with fuzzy ingredient matching"
```

---

## Task 10: Escalado de recetas (sección 6.2)

**Files:**
- Create: `api/src/modules/mealPlans/recipeScaling.ts`
- Test: `api/src/modules/mealPlans/recipeScaling.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/mealPlans/recipeScaling.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScaleFactor, scaleIngredients, clampScaleFactor } from './recipeScaling';

const recipeIngredients = [
  { foodItemId: 'chicken', baseGrams: 150, caloriesPer100g: 165 },
  { foodItemId: 'rice', baseGrams: 100, caloriesPer100g: 130 },
];

describe('calculateScaleFactor', () => {
  it('divide las calorías objetivo entre las calorías base de la receta', () => {
    // base = 150*1.65 + 100*1.30 = 247.5 + 130 = 377.5
    const factor = calculateScaleFactor({ targetCalories: 755, ingredients: recipeIngredients });
    expect(factor).toBeCloseTo(2);
  });
});

describe('scaleIngredients', () => {
  it('multiplica base_grams por el scale_factor para cada ingrediente', () => {
    const scaled = scaleIngredients(recipeIngredients, 2);
    expect(scaled[0].grams).toBeCloseTo(300);
    expect(scaled[1].grams).toBeCloseTo(200);
  });
});

describe('clampScaleFactor', () => {
  it('deja pasar factores dentro de 0.5x-2.5x', () => expect(clampScaleFactor(1.5)).toBe(1.5));
  it('limita por debajo a 0.5x', () => expect(clampScaleFactor(0.2)).toBe(0.5));
  it('limita por arriba a 2.5x', () => expect(clampScaleFactor(4)).toBe(2.5));
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- recipeScaling`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/mealPlans/recipeScaling.ts`**

```typescript
export interface ScalableIngredient { foodItemId: string; baseGrams: number; caloriesPer100g: number }

export function baseCalories(ingredients: ScalableIngredient[]): number {
  return ingredients.reduce((sum, ing) => sum + (ing.baseGrams / 100) * ing.caloriesPer100g, 0);
}

export function calculateScaleFactor(input: { targetCalories: number; ingredients: ScalableIngredient[] }): number {
  const base = baseCalories(input.ingredients);
  if (base === 0) return 1;
  return input.targetCalories / base;
}

// Límites de la sección 6.2: fuera de este rango se recomienda combinar con otra receta
// en vez de escalar (una receta a 0.1x o 5x deja de parecerse al plato original).
export function clampScaleFactor(factor: number): number {
  return Math.min(Math.max(factor, 0.5), 2.5);
}

export function scaleIngredients(ingredients: ScalableIngredient[], scaleFactor: number) {
  return ingredients.map((ing) => ({ foodItemId: ing.foodItemId, grams: ing.baseGrams * scaleFactor }));
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- recipeScaling`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/mealPlans/recipeScaling.ts api/src/modules/mealPlans/recipeScaling.test.ts
git commit -m "feat: implement recipe scaling algorithm"
```

---

## Task 11: Distribución de calorías por comida (3 vs 5-6 comidas)

**Files:**
- Create: `api/src/modules/mealPlans/mealDistribution.ts`
- Test: `api/src/modules/mealPlans/mealDistribution.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/mealPlans/mealDistribution.test.ts
import { describe, it, expect } from 'vitest';
import { getMealSlots } from './mealDistribution';

describe('getMealSlots', () => {
  it('devuelve 3 slots que suman 100% para mealsPerDay = 3', () => {
    const slots = getMealSlots('3');
    expect(slots).toHaveLength(3);
    expect(slots.reduce((sum, s) => sum + s.percentOfDailyCalories, 0)).toBeCloseTo(1);
    expect(slots.map((s) => s.mealType)).toEqual(['breakfast', 'lunch', 'dinner']);
  });

  it('devuelve 6 slots que suman 100% para mealsPerDay = 5_6', () => {
    const slots = getMealSlots('5_6');
    expect(slots).toHaveLength(6);
    expect(slots.reduce((sum, s) => sum + s.percentOfDailyCalories, 0)).toBeCloseTo(1);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- mealDistribution`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/mealPlans/mealDistribution.ts`**

```typescript
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export interface MealSlot { slotOrder: number; mealType: MealType; percentOfDailyCalories: number }

const THREE_MEALS: MealSlot[] = [
  { slotOrder: 0, mealType: 'breakfast', percentOfDailyCalories: 0.25 },
  { slotOrder: 1, mealType: 'lunch', percentOfDailyCalories: 0.40 },
  { slotOrder: 2, mealType: 'dinner', percentOfDailyCalories: 0.35 },
];

const FIVE_SIX_MEALS: MealSlot[] = [
  { slotOrder: 0, mealType: 'breakfast', percentOfDailyCalories: 0.20 },
  { slotOrder: 1, mealType: 'snack', percentOfDailyCalories: 0.10 },
  { slotOrder: 2, mealType: 'lunch', percentOfDailyCalories: 0.30 },
  { slotOrder: 3, mealType: 'snack', percentOfDailyCalories: 0.10 },
  { slotOrder: 4, mealType: 'dinner', percentOfDailyCalories: 0.25 },
  { slotOrder: 5, mealType: 'snack', percentOfDailyCalories: 0.05 },
];

export function getMealSlots(mealsPerDay: '3' | '5_6'): MealSlot[] {
  return mealsPerDay === '3' ? THREE_MEALS : FIVE_SIX_MEALS;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- mealDistribution`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/mealPlans/mealDistribution.ts api/src/modules/mealPlans/mealDistribution.test.ts
git commit -m "feat: add meal calorie distribution for 3 vs 5-6 meals/day"
```

---

## Task 12: Selector de recetas (sección 6.1)

**Files:**
- Create: `api/src/modules/mealPlans/recipeSelector.ts`
- Test: `api/src/modules/mealPlans/recipeSelector.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/mealPlans/recipeSelector.test.ts
import { describe, it, expect } from 'vitest';
import { selectRecipeForSlot } from './recipeSelector';

const recipes = [
  { id: 'r1', mealType: 'breakfast' as const, tags: ['vegetarian'], baseCalories: 400 },
  { id: 'r2', mealType: 'breakfast' as const, tags: ['high_protein'], baseCalories: 450 },
];

describe('selectRecipeForSlot', () => {
  it('filtra por meal_type y excluye recetas usadas en los últimos N días', () => {
    const selected = selectRecipeForSlot({
      recipes, mealType: 'breakfast', targetCalories: 450,
      recentlyUsedRecipeIds: ['r2'], preferredTags: [],
    });
    expect(selected?.id).toBe('r1');
  });

  it('entre las candidatas, elige la de calorías base más cercana al objetivo', () => {
    const selected = selectRecipeForSlot({
      recipes, mealType: 'breakfast', targetCalories: 440,
      recentlyUsedRecipeIds: [], preferredTags: [],
    });
    expect(selected?.id).toBe('r2');
  });

  it('prioriza recetas que coincidan con las tags preferidas', () => {
    const selected = selectRecipeForSlot({
      recipes, mealType: 'breakfast', targetCalories: 400,
      recentlyUsedRecipeIds: [], preferredTags: ['high_protein'],
    });
    expect(selected?.id).toBe('r2');
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- recipeSelector`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/mealPlans/recipeSelector.ts`**

```typescript
export interface CandidateRecipe { id: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; tags: string[]; baseCalories: number }

export interface SelectRecipeInput {
  recipes: CandidateRecipe[];
  mealType: CandidateRecipe['mealType'];
  targetCalories: number;
  recentlyUsedRecipeIds: string[]; // últimos 3 días (constante RECENT_DAYS)
  preferredTags: string[];
}

export const RECENT_DAYS = 3;

export function selectRecipeForSlot(input: SelectRecipeInput): CandidateRecipe | undefined {
  const candidates = input.recipes.filter(
    (r) => r.mealType === input.mealType && !input.recentlyUsedRecipeIds.includes(r.id),
  );
  if (candidates.length === 0) return undefined;

  const withTagMatch = input.preferredTags.length > 0
    ? candidates.filter((r) => r.tags.some((t) => input.preferredTags.includes(t)))
    : [];
  const pool = withTagMatch.length > 0 ? withTagMatch : candidates;

  return pool.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.baseCalories - input.targetCalories);
    const currentDiff = Math.abs(current.baseCalories - input.targetCalories);
    return currentDiff < closestDiff ? current : closest;
  });
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- recipeSelector`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/mealPlans/recipeSelector.ts api/src/modules/mealPlans/recipeSelector.test.ts
git commit -m "feat: implement recipe selection algorithm"
```

---

## Task 13: Generación del plan semanal (`POST /meal-plans/generate`)

**Files:**
- Create: `api/src/modules/mealPlans/mealPlans.service.ts`
- Create: `api/src/modules/mealPlans/mealPlans.routes.ts`
- Test: `api/src/modules/mealPlans/mealPlans.service.test.ts`

- [ ] **Step 1: Escribir el test del service (con dependencias inyectadas para no golpear la DB real)**

```typescript
// api/src/modules/mealPlans/mealPlans.service.test.ts
import { describe, it, expect } from 'vitest';
import { buildWeeklyPlanItems } from './mealPlans.service';

describe('buildWeeklyPlanItems', () => {
  it('genera 7 días × slots de mealsPerDay, cada uno con receta, scale_factor y target_calories', () => {
    const recipes = [
      { id: 'b1', mealType: 'breakfast' as const, tags: [], baseCalories: 400 },
      { id: 'l1', mealType: 'lunch' as const, tags: [], baseCalories: 600 },
      { id: 'd1', mealType: 'dinner' as const, tags: [], baseCalories: 500 },
    ];

    const items = buildWeeklyPlanItems({
      dailyCalorieTarget: 2000,
      mealsPerDay: '3',
      recipes,
      preferredTags: [],
    });

    expect(items).toHaveLength(21); // 7 días * 3 comidas
    expect(items[0]).toMatchObject({ dayOfWeek: 0, mealType: 'breakfast', recipeId: 'b1' });
    expect(items[0].targetCalories).toBeCloseTo(500); // 25% de 2000
    expect(items[0].scaleFactor).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- mealPlans.service`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/mealPlans/mealPlans.service.ts`**

```typescript
import { db } from '../../db/client';
import { mealPlans, mealPlanItems, recipes as recipesTable, recipeIngredients, foodItems, users } from '../../db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { getMealSlots } from './mealDistribution';
import { selectRecipeForSlot, RECENT_DAYS, type CandidateRecipe } from './recipeSelector';
import { calculateScaleFactor, clampScaleFactor, baseCalories } from './recipeScaling';

export interface BuildPlanInput {
  dailyCalorieTarget: number;
  mealsPerDay: '3' | '5_6';
  recipes: CandidateRecipe[];
  preferredTags: string[];
}

export function buildWeeklyPlanItems(input: BuildPlanInput) {
  const slots = getMealSlots(input.mealsPerDay);
  const items: { dayOfWeek: number; slotOrder: number; mealType: string; recipeId: string; scaleFactor: number; targetCalories: number }[] = [];
  const recentlyUsed: string[] = [];

  for (let day = 0; day < 7; day += 1) {
    for (const slot of slots) {
      const targetCalories = input.dailyCalorieTarget * slot.percentOfDailyCalories;
      const recipe = selectRecipeForSlot({
        recipes: input.recipes,
        mealType: slot.mealType,
        targetCalories,
        recentlyUsedRecipeIds: recentlyUsed.slice(-RECENT_DAYS * slots.length),
        preferredTags: input.preferredTags,
      });
      if (!recipe) continue; // sin candidatas disponibles para este slot; se deja vacío

      const scaleFactor = clampScaleFactor(targetCalories / recipe.baseCalories);
      items.push({ dayOfWeek: day, slotOrder: slot.slotOrder, mealType: slot.mealType, recipeId: recipe.id, scaleFactor, targetCalories });
      recentlyUsed.push(recipe.id);
    }
  }
  return items;
}

export async function generateWeeklyPlan(userId: string, weekStartDate: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const allRecipes = await db.select().from(recipesTable);
  const allIngredients = await db.select().from(recipeIngredients);
  const allFoodItems = await db.select().from(foodItems);
  const foodItemById = new Map(allFoodItems.map((f) => [f.id, f]));

  const candidateRecipes: CandidateRecipe[] = allRecipes.map((r) => {
    const ingredients = allIngredients
      .filter((ri) => ri.recipeId === r.id)
      .map((ri) => ({
        foodItemId: ri.foodItemId,
        baseGrams: Number(ri.baseGrams),
        caloriesPer100g: Number(foodItemById.get(ri.foodItemId)?.caloriesPer100g ?? 0),
      }));
    return { id: r.id, mealType: r.mealType, tags: r.tags ?? [], baseCalories: baseCalories(ingredients) };
  });

  const items = buildWeeklyPlanItems({
    dailyCalorieTarget: Number(user.dailyCalorieTarget),
    mealsPerDay: (user.mealsPerDay ?? '3') as '3' | '5_6',
    recipes: candidateRecipes,
    preferredTags: [],
  });

  const [plan] = await db.insert(mealPlans).values({ userId, weekStartDate }).returning();
  if (items.length > 0) {
    await db.insert(mealPlanItems).values(items.map((it) => ({
      mealPlanId: plan.id,
      dayOfWeek: it.dayOfWeek,
      slotOrder: it.slotOrder,
      mealType: it.mealType as any,
      recipeId: it.recipeId,
      scaleFactor: it.scaleFactor.toFixed(3),
      targetCalories: it.targetCalories.toFixed(0),
    })));
  }
  return plan;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- mealPlans.service`
Expected: PASS (1 test)

- [ ] **Step 5: Implementar las rutas**

```typescript
// api/src/modules/mealPlans/mealPlans.routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../auth/requireAuth';
import { generateWeeklyPlan } from './mealPlans.service';

export const mealPlansRouter = Router();

mealPlansRouter.post('/generate', requireAuth, async (req, res) => {
  const parsed = z.object({ weekStartDate: z.string().date() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const plan = await generateWeeklyPlan(req.userId!, parsed.data.weekStartDate);
  res.status(201).json(plan);
});
```

- [ ] **Step 6: Montar el router**

```typescript
import { mealPlansRouter } from './modules/mealPlans/mealPlans.routes';
app.use('/meal-plans', mealPlansRouter);
```

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/mealPlans api/src/app.ts
git commit -m "feat: add weekly meal plan generation endpoint"
```

---

## Task 14: Pantallas de dashboard, planificador y progreso en la app móvil

**Files:**
- Create: `mobile/app/(tabs)/dashboard.tsx`
- Create: `mobile/app/(tabs)/planner.tsx`
- Create: `mobile/app/(tabs)/progress.tsx`

- [ ] **Step 1: Dashboard con anillos de calorías/macros objetivo**

```tsx
// mobile/app/(tabs)/dashboard.tsx
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

export default function DashboardScreen() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Hoy</Text>
      <Text>Calorías objetivo: {user?.dailyCalorieTarget ?? '—'} kcal</Text>
      <Text>Proteína: {user?.dailyProteinTargetG ?? '—'} g</Text>
      <Text>Carbohidratos: {user?.dailyCarbsTargetG ?? '—'} g</Text>
      <Text>Grasa: {user?.dailyFatTargetG ?? '—'} g</Text>
    </View>
  );
}
```

- [ ] **Step 2: Añadir `GET /users/me` en el backend (necesario para el dashboard)**

```typescript
// añadir en api/src/modules/users/users.routes.ts
usersRouter.get('/me', requireAuth, async (req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user) { res.status(404).json({ error: 'user not found' }); return; }
  res.json(user);
});
```

Añadir los imports necesarios (`db`, `users`, `eq`) al inicio del archivo.

- [ ] **Step 3: Pantalla del planificador semanal**

```tsx
// mobile/app/(tabs)/planner.tsx
import { View, Text, FlatList, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function PlannerScreen() {
  const queryClient = useQueryClient();
  const generatePlan = useMutation({
    mutationFn: () => apiClient.post('/meal-plans/generate', { weekStartDate: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meal-plan'] }),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Pressable onPress={() => generatePlan.mutate()}>
        <Text>{generatePlan.isPending ? 'Generando…' : 'Generar plan de esta semana'}</Text>
      </Pressable>
      <FlatList data={DAY_NAMES} keyExtractor={(d) => d} renderItem={({ item }) => <Text style={{ marginTop: 12 }}>{item}</Text>} />
    </View>
  );
}
```

- [ ] **Step 4: Pantalla de progreso (peso/IMC)**

```tsx
// mobile/app/(tabs)/progress.tsx
import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

export default function ProgressScreen() {
  const [weightKg, setWeightKg] = useState('');
  const queryClient = useQueryClient();

  const { data: weighIns } = useQuery({
    queryKey: ['weigh-ins'],
    queryFn: async () => (await apiClient.get('/weigh-ins')).data,
  });

  const recordWeighIn = useMutation({
    mutationFn: () => apiClient.post('/weigh-ins', { weightKg: Number(weightKg) }),
    onSuccess: () => { setWeightKg(''); queryClient.invalidateQueries({ queryKey: ['weigh-ins'] }); },
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Progreso</Text>
      <TextInput placeholder="Peso (kg)" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
      <Pressable onPress={() => recordWeighIn.mutate()}><Text>Registrar pesaje</Text></Pressable>
      <FlatList
        data={weighIns ?? []}
        keyExtractor={(w: any) => w.id}
        renderItem={({ item }: any) => <Text>{item.recordedAt}: {item.weightKg} kg (IMC {item.bmi}, {item.bmiCategory})</Text>}
      />
    </View>
  );
}
```

- [ ] **Step 5: Probar el flujo completo en el simulador**

Run (dentro de `mobile/`): `npx expo start`, con `npm run dev` corriendo en `api/`.
Expected: tras completar el onboarding, el dashboard muestra las calorías/macros calculadas; "Generar plan de esta semana" crea un plan (verificar en `db:studio` que `meal_plans`/`meal_plan_items` tienen filas); registrar un peso lo agrega a la lista de progreso.

- [ ] **Step 6: Commit**

```bash
git add mobile/app api/src/modules/users/users.routes.ts
git commit -m "feat: add dashboard, planner and progress screens"
```

---

## Self-review de esta fase (cobertura vs. sección 15, Fase 1 del documento)

1. Modelo de datos completo + auth → Tareas 1-3. ✅
2. Onboarding + TMB/TDEE/macros → Tareas 4-6. ✅
3. Importación USDA + OFF + TheMealDB → Tareas 8-9 cubren USDA y TheMealDB. **Open Food Facts queda pendiente**: se puede añadir como una Tarea 8b siguiendo el mismo patrón que `importUsda.ts` (mismo shape de `food_items`, fuente `'off'`) una vez que el equipo decida qué subconjunto del bulk export de OFF importar (es un dataset mucho más grande que USDA Foundation Foods); no se detalla aquí para no bloquear el resto de la fase con una decisión de alcance de datos.
4. Planificador semanal + escalado → Tareas 10-13. ✅
5. Seguimiento de peso + IMC → Tarea 7. ✅

**Pendiente explícito para no bloquear esta fase**: importación de Open Food Facts (ver punto 3 arriba). El resto de la Fase 1 queda completamente cubierta y produce una app usable de punta a punta (onboarding → plan semanal → seguimiento de peso).
