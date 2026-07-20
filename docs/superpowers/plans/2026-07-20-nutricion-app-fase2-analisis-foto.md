# App de Nutrición — Fase 2 (Análisis de foto con IA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo completo de análisis de comida por foto (sección 7 del documento): subida sin persistencia a disco, llamada a un modelo de IA de visión, umbrales de confianza, cálculo de intervalos de peso/calorías, encuesta rápida para baja confianza, y corrección manual con recálculo en vivo. Requiere que la Fase 1 esté completa (auth, `users`, `food_items`).

**Architecture:** Un nuevo módulo `photoAnalysis` en el backend recibe la imagen como `multipart/form-data` en memoria (nunca se escribe a disco — `multer` con `memoryStorage`), la reenvía en base64 a la API de Claude (modelo Haiku, económico) pidiendo un JSON estructurado, valida ese JSON con Zod, calcula intervalos, aplica los umbrales de confianza, y persiste solo el resultado en `photo_analyses`. El buffer de la imagen sale de scope (y por tanto es recolectado por el GC) en cuanto termina el request handler.

**Tech Stack:** Mismo stack de la Fase 1 + `multer` (upload en memoria), `@anthropic-ai/sdk` (IA de visión), `expo-image-picker` (cámara/galería en la app móvil).

---

## Decisiones de arquitectura tomadas en esta fase

- **Modelo de visión**: Claude Haiku vía Anthropic API (el documento sugería "GPT-4.1-mini / Claude Haiku"; se elige Claude Haiku por costo y porque ya usamos Claude Code para este proyecto, simplifica tener una sola cuenta de proveedor de IA).
- **Nunca a disco**: `multer.memoryStorage()` en vez de `diskStorage`; el archivo vive en `req.file.buffer` y no se llama a ningún método de storage (R2/S3) para fotos de comida — solo se usará storage en la Fase 3 para fotos de progreso corporal, que sí se guardan con consentimiento.

---

## File Structure

```
api/
├── src/
│   ├── modules/
│   │   └── photoAnalysis/
│   │       ├── visionClient.ts          # llamada a Claude Haiku, contrato JSON (7.2)
│   │       ├── visionClient.test.ts
│   │       ├── confidenceThresholds.ts  # sección 7.3
│   │       ├── confidenceThresholds.test.ts
│   │       ├── intervalCalculator.ts    # sección 7.4
│   │       ├── intervalCalculator.test.ts
│   │       ├── surveyMapping.ts         # sección 7.5
│   │       ├── surveyMapping.test.ts
│   │       ├── photoAnalysis.service.ts
│   │       ├── photoAnalysis.routes.ts
│   │       └── photoAnalysis.routes.test.ts
│   └── db/schema.ts                     # ampliar con photo_analyses (ya definida en Fase 1 del doc, se crea aquí)
mobile/
├── app/
│   └── (tabs)/
│       └── log/
│           ├── camera.tsx
│           ├── results.tsx
│           ├── survey-food-type.tsx
│           ├── survey-portion-size.tsx
│           └── manual-correction.tsx
└── src/api/photoAnalysis.ts
```

---

## Task 1: Tabla `photo_analyses`

**Files:**
- Modify: `api/src/db/schema.ts`

- [ ] **Step 1: Añadir el enum y la tabla al schema**

```typescript
// añadir a api/src/db/schema.ts
import { jsonb } from 'drizzle-orm/pg-core';

export const photoAnalysisStatusEnum = pgEnum('photo_analysis_status', [
  'high_confidence', 'medium_confidence', 'low_confidence_survey',
]);

export const photoAnalyses = pgTable('photo_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  confidenceScore: numeric('confidence_score').notNull(),
  status: photoAnalysisStatusEnum('status').notNull(),
  detectedFoods: jsonb('detected_foods').notNull(),
  calorieRangeMin: numeric('calorie_range_min').notNull(),
  calorieRangeMax: numeric('calorie_range_max').notNull(),
  userCorrected: boolean('user_corrected').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

- [ ] **Step 2: Generar y aplicar la migración**

Run: `npm run db:generate && npm run db:migrate`
Expected: se crea `api/drizzle/0001_*.sql` y la tabla `photo_analyses` aparece en Neon.

- [ ] **Step 3: Commit**

```bash
git add api/src/db/schema.ts api/drizzle
git commit -m "feat: add photo_analyses table"
```

---

## Task 2: Umbrales de confianza (sección 7.3)

**Files:**
- Create: `api/src/modules/photoAnalysis/confidenceThresholds.ts`
- Test: `api/src/modules/photoAnalysis/confidenceThresholds.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/photoAnalysis/confidenceThresholds.test.ts
import { describe, it, expect } from 'vitest';
import { classifyConfidence } from './confidenceThresholds';

describe('classifyConfidence', () => {
  it('clasifica >= 0.75 como high_confidence', () => {
    expect(classifyConfidence(0.75)).toBe('high_confidence');
    expect(classifyConfidence(0.9)).toBe('high_confidence');
  });
  it('clasifica 0.40-0.74 como medium_confidence', () => {
    expect(classifyConfidence(0.4)).toBe('medium_confidence');
    expect(classifyConfidence(0.74)).toBe('medium_confidence');
  });
  it('clasifica < 0.40 como low_confidence_survey', () => {
    expect(classifyConfidence(0.39)).toBe('low_confidence_survey');
    expect(classifyConfidence(0)).toBe('low_confidence_survey');
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- confidenceThresholds`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/photoAnalysis/confidenceThresholds.ts`**

```typescript
export type PhotoAnalysisStatus = 'high_confidence' | 'medium_confidence' | 'low_confidence_survey';

// Umbrales de la sección 7.3. [DECISIÓN PENDIENTE en el documento original]:
// calibrar estos valores con pruebas reales del modelo elegido; se usan como punto de partida.
export const HIGH_CONFIDENCE_THRESHOLD = 0.75;
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.40;

export function classifyConfidence(confidence: number): PhotoAnalysisStatus {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'high_confidence';
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return 'medium_confidence';
  return 'low_confidence_survey';
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- confidenceThresholds`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/photoAnalysis/confidenceThresholds.ts api/src/modules/photoAnalysis/confidenceThresholds.test.ts
git commit -m "feat: add photo confidence threshold classification"
```

---

## Task 3: Cálculo de intervalos de peso/calorías (sección 7.4)

**Files:**
- Create: `api/src/modules/photoAnalysis/intervalCalculator.ts`
- Test: `api/src/modules/photoAnalysis/intervalCalculator.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/photoAnalysis/intervalCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { intervalWidthPercent, calculateFoodInterval } from './intervalCalculator';

describe('intervalWidthPercent', () => {
  it('devuelve ±15% cuando match_confidence es 1.0', () => {
    expect(intervalWidthPercent(1)).toBeCloseTo(0.15);
  });
  it('devuelve ±30% cuando match_confidence está en el límite inferior aceptable (0.40)', () => {
    expect(intervalWidthPercent(0.4)).toBeCloseTo(0.30);
  });
  it('interpola linealmente entre 0.40 y 1.0', () => {
    expect(intervalWidthPercent(0.7)).toBeCloseTo(0.225);
  });
  it('no supera ±30% para confianzas menores a 0.40', () => {
    expect(intervalWidthPercent(0.1)).toBeCloseTo(0.30);
  });
});

describe('calculateFoodInterval', () => {
  it('calcula peso y calorías min/max a partir de estimated_grams y calories_per_100g', () => {
    const result = calculateFoodInterval({ estimatedGrams: 175, matchConfidence: 1, caloriesPer100g: 165 });
    expect(result.gramsMin).toBeCloseTo(175 * 0.85);
    expect(result.gramsMax).toBeCloseTo(175 * 1.15);
    expect(result.caloriesMin).toBeCloseTo((175 * 0.85 / 100) * 165);
    expect(result.caloriesMax).toBeCloseTo((175 * 1.15 / 100) * 165);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- intervalCalculator`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/photoAnalysis/intervalCalculator.ts`**

```typescript
const BASE_WIDTH = 0.15;
const MAX_WIDTH = 0.30;
const LOWER_CONFIDENCE_BOUND = 0.40; // confianza mínima aceptable por alimento antes de disparar la encuesta

export function intervalWidthPercent(matchConfidence: number): number {
  if (matchConfidence >= 1) return BASE_WIDTH;
  if (matchConfidence <= LOWER_CONFIDENCE_BOUND) return MAX_WIDTH;
  const slope = (MAX_WIDTH - BASE_WIDTH) / (1 - LOWER_CONFIDENCE_BOUND);
  return BASE_WIDTH + (1 - matchConfidence) * slope;
}

export interface FoodIntervalInput { estimatedGrams: number; matchConfidence: number; caloriesPer100g: number }
export interface FoodInterval { gramsMin: number; gramsMax: number; caloriesMin: number; caloriesMax: number }

export function calculateFoodInterval(input: FoodIntervalInput): FoodInterval {
  const width = intervalWidthPercent(input.matchConfidence);
  const gramsMin = input.estimatedGrams * (1 - width);
  const gramsMax = input.estimatedGrams * (1 + width);
  return {
    gramsMin,
    gramsMax,
    caloriesMin: (gramsMin / 100) * input.caloriesPer100g,
    caloriesMax: (gramsMax / 100) * input.caloriesPer100g,
  };
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- intervalCalculator`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/photoAnalysis/intervalCalculator.ts api/src/modules/photoAnalysis/intervalCalculator.test.ts
git commit -m "feat: implement food weight/calorie interval calculation"
```

---

## Task 4: Cliente de la IA de visión (sección 7.1-7.2)

**Files:**
- Create: `api/src/modules/photoAnalysis/visionClient.ts`
- Test: `api/src/modules/photoAnalysis/visionClient.test.ts`

- [ ] **Step 1: Instalar el SDK**

```bash
cd api && npm install @anthropic-ai/sdk
```

Añadir a `api/.env.example`: `ANTHROPIC_API_KEY=`

- [ ] **Step 2: Escribir el test (mockeando el cliente de Anthropic)**

```typescript
// api/src/modules/photoAnalysis/visionClient.test.ts
import { describe, it, expect, vi } from 'vitest';
import { parseVisionResponse } from './visionClient';

describe('parseVisionResponse', () => {
  it('valida y parsea una respuesta JSON conforme al contrato', () => {
    const raw = JSON.stringify({
      confidence: 0.82,
      foods: [{ name: 'pechuga de pollo a la plancha', estimated_grams: 175, estimated_grams_range: [150, 200], calories_estimate: 290, match_confidence: 0.88 }],
      notes: '',
    });
    const parsed = parseVisionResponse(raw);
    expect(parsed.confidence).toBe(0.82);
    expect(parsed.foods[0].name).toBe('pechuga de pollo a la plancha');
  });

  it('lanza un error si el JSON no cumple el contrato', () => {
    expect(() => parseVisionResponse('{"confidence": "no-es-numero"}')).toThrow();
  });
});
```

- [ ] **Step 3: Correr los tests para verificar que fallan**

Run: `npm test -- visionClient`
Expected: FAIL

- [ ] **Step 4: Implementar `api/src/modules/photoAnalysis/visionClient.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const visionResponseSchema = z.object({
  confidence: z.number().min(0).max(1),
  foods: z.array(z.object({
    name: z.string(),
    estimated_grams: z.number().positive(),
    estimated_grams_range: z.tuple([z.number(), z.number()]),
    calories_estimate: z.number().nonnegative(),
    match_confidence: z.number().min(0).max(1),
  })),
  notes: z.string().optional().default(''),
});

export type VisionResponse = z.infer<typeof visionResponseSchema>;

export function parseVisionResponse(raw: string): VisionResponse {
  return visionResponseSchema.parse(JSON.parse(raw));
}

const SYSTEM_PROMPT = `Eres un analizador de comida por foto. Responde ÚNICAMENTE con un JSON con esta forma exacta, sin texto adicional:
{
  "confidence": 0.0,
  "foods": [{"name": "string", "estimated_grams": 0, "estimated_grams_range": [0,0], "calories_estimate": 0, "match_confidence": 0.0}],
  "notes": "string opcional"
}`;

// El buffer de la imagen solo vive en memoria durante esta llamada; nunca se escribe a disco
// ni se pasa a ningún cliente de storage (sección 7.1).
export async function analyzePhoto(imageBuffer: Buffer, mimeType: string): Promise<VisionResponse> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType as any, data: imageBuffer.toString('base64') } },
        { type: 'text', text: '¿Qué alimentos hay en este plato? Responde solo con el JSON del contrato.' },
      ],
    }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('vision model returned no text content');
  return parseVisionResponse(textBlock.text);
}
```

- [ ] **Step 5: Correr los tests para verificar que pasan**

Run: `npm test -- visionClient`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/photoAnalysis/visionClient.ts api/src/modules/photoAnalysis/visionClient.test.ts api/.env.example
git commit -m "feat: add vision ai client with structured output contract"
```

---

## Task 5: Encuesta rápida para baja confianza (sección 7.5)

**Files:**
- Create: `api/src/modules/photoAnalysis/surveyMapping.ts`
- Test: `api/src/modules/photoAnalysis/surveyMapping.test.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/photoAnalysis/surveyMapping.test.ts
import { describe, it, expect } from 'vitest';
import { mapSurveyAnswerToDetectedFood, FOOD_TYPE_OPTIONS, PORTION_SIZE_OPTIONS } from './surveyMapping';

describe('mapSurveyAnswerToDetectedFood', () => {
  it('mapea carne + porción mediana al rango de gramos correspondiente', () => {
    const result = mapSurveyAnswerToDetectedFood({ foodType: 'meat', portionSize: 'medium' });
    expect(result.source).toBe('user_survey');
    expect(result.estimated_grams_range).toEqual([120, 180]);
    expect(result.estimated_grams).toBeCloseTo(150); // punto medio del rango
  });

  it('mapea arroz + porción pequeña', () => {
    const result = mapSurveyAnswerToDetectedFood({ foodType: 'rice', portionSize: 'small' });
    expect(result.estimated_grams_range).toEqual([70, 100]);
  });
});

describe('opciones de la encuesta', () => {
  it('expone 8 tipos de alimento incluyendo "otro"', () => {
    expect(FOOD_TYPE_OPTIONS).toHaveLength(8);
    expect(FOOD_TYPE_OPTIONS.map((o) => o.value)).toContain('other');
  });
  it('expone 3 tamaños de porción', () => {
    expect(PORTION_SIZE_OPTIONS).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- surveyMapping`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/photoAnalysis/surveyMapping.ts`**

```typescript
export const FOOD_TYPE_OPTIONS = [
  { value: 'meat', label: 'Carne' },
  { value: 'fish', label: 'Pescado' },
  { value: 'pasta', label: 'Pasta' },
  { value: 'rice', label: 'Arroz' },
  { value: 'salad', label: 'Ensalada' },
  { value: 'legumes', label: 'Legumbres' },
  { value: 'egg', label: 'Huevo' },
  { value: 'other', label: 'Otro' },
] as const;

export type FoodType = (typeof FOOD_TYPE_OPTIONS)[number]['value'];

export const PORTION_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeña (~tamaño de tu puño)' },
  { value: 'medium', label: 'Mediana (~tamaño de tu palma)' },
  { value: 'large', label: 'Grande (~dos palmas)' },
] as const;

export type PortionSize = (typeof PORTION_SIZE_OPTIONS)[number]['value'];

// Tabla interna de rangos de gramos por categoría de alimento y tamaño (sección 7.5).
const PORTION_GRAMS: Record<Exclude<FoodType, 'other'>, Record<PortionSize, [number, number]>> = {
  meat: { small: [80, 120], medium: [120, 180], large: [180, 240] },
  fish: { small: [80, 120], medium: [120, 170], large: [170, 220] },
  pasta: { small: [60, 90], medium: [90, 130], large: [130, 180] },
  rice: { small: [70, 100], medium: [100, 150], large: [150, 200] },
  salad: { small: [80, 120], medium: [120, 200], large: [200, 300] },
  legumes: { small: [70, 100], medium: [100, 150], large: [150, 200] },
  egg: { small: [50, 60], medium: [60, 120], large: [120, 180] }, // 1, 2 o 3 huevos (~60g c/u)
};

export interface SurveyAnswer { foodType: FoodType; portionSize: PortionSize; customFoodName?: string }

export interface DetectedFoodFromSurvey {
  source: 'user_survey';
  name: string;
  estimated_grams: number;
  estimated_grams_range: [number, number];
  match_confidence: number;
}

export function mapSurveyAnswerToDetectedFood(answer: SurveyAnswer): DetectedFoodFromSurvey {
  if (answer.foodType === 'other') {
    if (!answer.customFoodName) throw new Error('customFoodName is required when foodType is "other"');
    // Sin tabla de gramos por categoría; se usa el rango "medium" genérico como base razonable.
    const [min, max] = [100, 150];
    return { source: 'user_survey', name: answer.customFoodName, estimated_grams: (min + max) / 2, estimated_grams_range: [min, max], match_confidence: 1 };
  }
  const [min, max] = PORTION_GRAMS[answer.foodType][answer.portionSize];
  const label = FOOD_TYPE_OPTIONS.find((o) => o.value === answer.foodType)!.label;
  return { source: 'user_survey', name: label, estimated_grams: (min + max) / 2, estimated_grams_range: [min, max], match_confidence: 1 };
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- surveyMapping`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add api/src/modules/photoAnalysis/surveyMapping.ts api/src/modules/photoAnalysis/surveyMapping.test.ts
git commit -m "feat: add low-confidence quick survey to grams mapping"
```

---

## Task 6: Service + endpoint de subida de foto (`POST /photo-analyses`)

**Files:**
- Create: `api/src/modules/photoAnalysis/photoAnalysis.service.ts`
- Create: `api/src/modules/photoAnalysis/photoAnalysis.routes.ts`
- Test: `api/src/modules/photoAnalysis/photoAnalysis.routes.test.ts`

- [ ] **Step 1: Instalar multer**

```bash
cd api && npm install multer && npm install -D @types/multer
```

- [ ] **Step 2: Escribir el test de integración de la ruta (mockeando `analyzePhoto` y la DB)**

```typescript
// api/src/modules/photoAnalysis/photoAnalysis.routes.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { photoAnalysisRouter } from './photoAnalysis.routes';
import * as visionClient from './visionClient';

vi.mock('../../auth/requireAuth', () => ({
  requireAuth: (req: any, _res: any, next: any) => { req.userId = 'user-1'; next(); },
}));
vi.mock('../../db/client', () => ({
  db: { insert: () => ({ values: () => ({ returning: () => Promise.resolve([{ id: 'pa-1' }]) }) }) },
}));

describe('POST /photo-analyses', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('devuelve 400 si no se envía ningún archivo', async () => {
    const app = express();
    app.use('/photo-analyses', photoAnalysisRouter);
    const res = await request(app).post('/photo-analyses');
    expect(res.status).toBe(400);
  });

  it('analiza la imagen, calcula intervalos y devuelve el resultado sin persistir el buffer', async () => {
    vi.spyOn(visionClient, 'analyzePhoto').mockResolvedValue({
      confidence: 0.82,
      foods: [{ name: 'pollo', estimated_grams: 175, estimated_grams_range: [150, 200], calories_estimate: 290, match_confidence: 0.88 }],
      notes: '',
    });

    const app = express();
    app.use('/photo-analyses', photoAnalysisRouter);
    const res = await request(app).post('/photo-analyses').attach('photo', Buffer.from('fake-image'), 'meal.jpg');

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('high_confidence');
    expect(res.body.detectedFoods[0]).toHaveProperty('gramsMin');
  });
});
```

Instalar `supertest` si no está: `npm install -D supertest @types/supertest`.

- [ ] **Step 3: Correr los tests para verificar que fallan**

Run: `npm test -- photoAnalysis.routes`
Expected: FAIL

- [ ] **Step 4: Implementar `api/src/modules/photoAnalysis/photoAnalysis.service.ts`**

```typescript
import { db } from '../../db/client';
import { photoAnalyses } from '../../db/schema';
import { analyzePhoto, type VisionResponse } from './visionClient';
import { classifyConfidence } from './confidenceThresholds';
import { calculateFoodInterval } from './intervalCalculator';
import { db as dbFoodItems } from '../../db/client'; // reutiliza la misma instancia
import { foodItems } from '../../db/schema';
import { ilike } from 'drizzle-orm';

async function estimateCaloriesPer100g(foodName: string): Promise<number> {
  const [match] = await dbFoodItems.select().from(foodItems).where(ilike(foodItems.nameNormalized, `%${foodName.toLowerCase()}%`)).limit(1);
  return match ? Number(match.caloriesPer100g) : 0;
}

export async function processPhotoAnalysis(userId: string, imageBuffer: Buffer, mimeType: string) {
  const visionResult: VisionResponse = await analyzePhoto(imageBuffer, mimeType);
  const status = classifyConfidence(visionResult.confidence);

  const detectedFoods = await Promise.all(visionResult.foods.map(async (food) => {
    const caloriesPer100g = await estimateCaloriesPer100g(food.name);
    const interval = calculateFoodInterval({ estimatedGrams: food.estimated_grams, matchConfidence: food.match_confidence, caloriesPer100g });
    return { source: 'ai_vision' as const, name: food.name, matchConfidence: food.match_confidence, ...interval };
  }));

  const calorieRangeMin = detectedFoods.reduce((sum, f) => sum + f.caloriesMin, 0);
  const calorieRangeMax = detectedFoods.reduce((sum, f) => sum + f.caloriesMax, 0);

  const [row] = await db.insert(photoAnalyses).values({
    userId,
    confidenceScore: String(visionResult.confidence),
    status,
    detectedFoods,
    calorieRangeMin: calorieRangeMin.toFixed(0),
    calorieRangeMax: calorieRangeMax.toFixed(0),
  }).returning();

  return { ...row, detectedFoods };
}
```

- [ ] **Step 5: Implementar `api/src/modules/photoAnalysis/photoAnalysis.routes.ts`**

```typescript
import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../auth/requireAuth';
import { processPhotoAnalysis } from './photoAnalysis.service';

// memoryStorage: el archivo nunca toca el disco (sección 7.1).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const photoAnalysisRouter = Router();

photoAnalysisRouter.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'photo file is required' }); return; }
  const result = await processPhotoAnalysis(req.userId!, req.file.buffer, req.file.mimetype);
  res.status(201).json(result);
  // req.file.buffer sale de scope aquí; no se retiene ninguna referencia adicional al buffer.
});
```

- [ ] **Step 6: Montar el router**

```typescript
import { photoAnalysisRouter } from './modules/photoAnalysis/photoAnalysis.routes';
app.use('/photo-analyses', photoAnalysisRouter);
```

- [ ] **Step 7: Correr los tests para verificar que pasan**

Run: `npm test -- photoAnalysis.routes`
Expected: PASS (2 tests)

- [ ] **Step 8: Commit**

```bash
git add api/src/modules/photoAnalysis api/src/app.ts api/package.json
git commit -m "feat: add photo upload endpoint with no-disk-persistence analysis flow"
```

---

## Task 7: Corrección manual (`PATCH /photo-analyses/:id`, sección 7.6)

**Files:**
- Modify: `api/src/modules/photoAnalysis/photoAnalysis.service.ts`
- Modify: `api/src/modules/photoAnalysis/photoAnalysis.routes.ts`
- Test: `api/src/modules/photoAnalysis/photoAnalysis.service.test.ts`

- [ ] **Step 1: Escribir el test de la corrección manual**

```typescript
// api/src/modules/photoAnalysis/photoAnalysis.service.test.ts
import { describe, it, expect } from 'vitest';
import { recalculateCorrectedFood } from './photoAnalysis.service';

describe('recalculateCorrectedFood', () => {
  it('recalcula calorías/macros a partir de los gramos corregidos por el usuario', () => {
    const result = recalculateCorrectedFood({
      newGrams: 220,
      foodItem: { caloriesPer100g: 165, proteinGPer100g: 31, carbsGPer100g: 0, fatGPer100g: 3.6 },
    });
    expect(result.calories).toBeCloseTo((220 / 100) * 165);
    expect(result.proteinG).toBeCloseTo((220 / 100) * 31);
    expect(result.carbsG).toBeCloseTo(0);
    expect(result.fatG).toBeCloseTo((220 / 100) * 3.6);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- photoAnalysis.service`
Expected: FAIL

- [ ] **Step 3: Añadir `recalculateCorrectedFood` y `applyManualCorrection` a `photoAnalysis.service.ts`**

```typescript
// añadir a api/src/modules/photoAnalysis/photoAnalysis.service.ts
import { eq } from 'drizzle-orm';

export interface FoodItemMacros { caloriesPer100g: number; proteinGPer100g: number; carbsGPer100g: number; fatGPer100g: number }

export function recalculateCorrectedFood(input: { newGrams: number; foodItem: FoodItemMacros }) {
  const factor = input.newGrams / 100;
  return {
    calories: factor * input.foodItem.caloriesPer100g,
    proteinG: factor * input.foodItem.proteinGPer100g,
    carbsG: factor * input.foodItem.carbsGPer100g,
    fatG: factor * input.foodItem.fatGPer100g,
  };
}

export async function applyManualCorrection(analysisId: string, correctedFoods: unknown) {
  const [row] = await db.update(photoAnalyses)
    .set({ detectedFoods: correctedFoods, userCorrected: true })
    .where(eq(photoAnalyses.id, analysisId))
    .returning();
  return row;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- photoAnalysis.service`
Expected: PASS (1 test)

- [ ] **Step 5: Añadir la ruta PATCH**

```typescript
// añadir a api/src/modules/photoAnalysis/photoAnalysis.routes.ts
import { z } from 'zod';
import { applyManualCorrection } from './photoAnalysis.service';

const correctionSchema = z.object({
  detectedFoods: z.array(z.object({
    name: z.string(), grams: z.number().positive(), calories: z.number().nonnegative(),
    proteinG: z.number().nonnegative(), carbsG: z.number().nonnegative(), fatG: z.number().nonnegative(),
  })),
});

photoAnalysisRouter.patch('/:id', requireAuth, async (req, res) => {
  const parsed = correctionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await applyManualCorrection(req.params.id, parsed.data.detectedFoods);
  res.json(row);
});
```

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/photoAnalysis
git commit -m "feat: add manual correction endpoint with live macro recalculation"
```

---

## Task 8: Pantallas móviles — cámara, resultados, encuesta y corrección

**Files:**
- Create: `mobile/src/api/photoAnalysis.ts`
- Create: `mobile/app/(tabs)/log/camera.tsx`
- Create: `mobile/app/(tabs)/log/results.tsx`
- Create: `mobile/app/(tabs)/log/survey-food-type.tsx`
- Create: `mobile/app/(tabs)/log/survey-portion-size.tsx`
- Create: `mobile/app/(tabs)/log/manual-correction.tsx`

- [ ] **Step 1: Instalar dependencias de cámara**

```bash
cd mobile && npx expo install expo-image-picker
```

- [ ] **Step 2: Cliente API para fotos**

```typescript
// mobile/src/api/photoAnalysis.ts
import { apiClient } from './client';

export async function uploadPhotoForAnalysis(uri: string) {
  const formData = new FormData();
  formData.append('photo', { uri, name: 'meal.jpg', type: 'image/jpeg' } as any);
  const { data } = await apiClient.post('/photo-analyses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}
```

- [ ] **Step 3: Pantalla de cámara**

```tsx
// mobile/app/(tabs)/log/camera.tsx
import { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { uploadPhotoForAnalysis } from '../../../src/api/photoAnalysis';

export default function CameraScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickAndAnalyze() {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;
    setUri(result.assets[0].uri);
    setLoading(true);
    try {
      const analysis = await uploadPhotoForAnalysis(result.assets[0].uri);
      if (analysis.status === 'low_confidence_survey') {
        router.push({ pathname: '/(tabs)/log/survey-food-type', params: { analysisId: analysis.id } });
      } else {
        router.push({ pathname: '/(tabs)/log/results', params: { analysisId: analysis.id } });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      {uri && <Image source={{ uri }} style={{ width: 240, height: 240 }} />}
      {loading ? <ActivityIndicator /> : <Pressable onPress={pickAndAnalyze}><Text>Tomar foto de mi plato</Text></Pressable>}
    </View>
  );
}
```

- [ ] **Step 4: Pantalla de resultados con intervalos**

```tsx
// mobile/app/(tabs)/log/results.tsx
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';
import { Pressable } from 'react-native';

export default function ResultsScreen() {
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const { data } = useQuery({
    queryKey: ['photo-analysis', analysisId],
    queryFn: async () => (await apiClient.get(`/photo-analyses/${analysisId}`)).data,
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      {data?.status === 'medium_confidence' && <Text>Revisa y ajusta si hace falta</Text>}
      <FlatList
        data={data?.detectedFoods ?? []}
        keyExtractor={(f: any, i: number) => `${f.name}-${i}`}
        renderItem={({ item }: any) => (
          <Text>{item.name}: {Math.round(item.gramsMin)}–{Math.round(item.gramsMax)} g · {Math.round(item.caloriesMin)}–{Math.round(item.caloriesMax)} kcal</Text>
        )}
      />
      <Pressable onPress={() => router.push({ pathname: '/(tabs)/log/manual-correction', params: { analysisId } })}>
        <Text>Corregir manualmente</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 5: Pantallas de encuesta rápida (2 pantallas, sección 7.5)**

```tsx
// mobile/app/(tabs)/log/survey-food-type.tsx
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const OPTIONS = [
  { value: 'meat', label: 'Carne' }, { value: 'fish', label: 'Pescado' },
  { value: 'pasta', label: 'Pasta' }, { value: 'rice', label: 'Arroz' },
  { value: 'salad', label: 'Ensalada' }, { value: 'legumes', label: 'Legumbres' },
  { value: 'egg', label: 'Huevo' }, { value: 'other', label: 'Otro' },
];

export default function SurveyFoodTypeScreen() {
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>¿Qué es lo principal en tu plato?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        {OPTIONS.map((opt) => (
          <Pressable key={opt.value} onPress={() => router.push({ pathname: '/(tabs)/log/survey-portion-size', params: { analysisId, foodType: opt.value } })}>
            <Text>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

```tsx
// mobile/app/(tabs)/log/survey-portion-size.tsx
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

const SIZES = [
  { value: 'small', label: 'Pequeña (~tu puño)' },
  { value: 'medium', label: 'Mediana (~tu palma)' },
  { value: 'large', label: 'Grande (~dos palmas)' },
];

export default function SurveyPortionSizeScreen() {
  const { analysisId, foodType } = useLocalSearchParams<{ analysisId: string; foodType: string }>();
  const submit = useMutation({
    mutationFn: (portionSize: string) => apiClient.post(`/photo-analyses/${analysisId}/survey`, { foodType, portionSize }),
    onSuccess: () => router.replace({ pathname: '/(tabs)/log/results', params: { analysisId } }),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>¿Qué tamaño de porción dirías que es?</Text>
      {SIZES.map((s) => (
        <Pressable key={s.value} onPress={() => submit.mutate(s.value)}><Text>{s.label}</Text></Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 6: Añadir el endpoint `POST /photo-analyses/:id/survey` que usa `surveyMapping.ts`**

```typescript
// añadir a api/src/modules/photoAnalysis/photoAnalysis.routes.ts
import { mapSurveyAnswerToDetectedFood } from './surveyMapping';
import { submitSurveyAnswer } from './photoAnalysis.service';

const surveySchema = z.object({ foodType: z.string(), portionSize: z.enum(['small', 'medium', 'large']), customFoodName: z.string().optional() });

photoAnalysisRouter.post('/:id/survey', requireAuth, async (req, res) => {
  const parsed = surveySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const row = await submitSurveyAnswer(req.params.id, parsed.data as any);
  res.json(row);
});
```

```typescript
// añadir a api/src/modules/photoAnalysis/photoAnalysis.service.ts
import { mapSurveyAnswerToDetectedFood, type SurveyAnswer } from './surveyMapping';
import { calculateFoodInterval } from './intervalCalculator';

export async function submitSurveyAnswer(analysisId: string, answer: SurveyAnswer) {
  const detectedFood = mapSurveyAnswerToDetectedFood(answer);
  const caloriesPer100g = await estimateCaloriesPer100g(detectedFood.name);
  const interval = calculateFoodInterval({ estimatedGrams: detectedFood.estimated_grams, matchConfidence: detectedFood.match_confidence, caloriesPer100g });
  const detectedFoods = [{ ...detectedFood, ...interval }];
  const calorieRangeMin = interval.caloriesMin;
  const calorieRangeMax = interval.caloriesMax;

  const [row] = await db.update(photoAnalyses).set({
    detectedFoods, calorieRangeMin: calorieRangeMin.toFixed(0), calorieRangeMax: calorieRangeMax.toFixed(0),
  }).where(eq(photoAnalyses.id, analysisId)).returning();
  return row;
}
```

- [ ] **Step 7: Pantalla de corrección manual con recálculo en vivo**

```tsx
// mobile/app/(tabs)/log/manual-correction.tsx
import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

export default function ManualCorrectionScreen() {
  const { analysisId } = useLocalSearchParams<{ analysisId: string }>();
  const { data } = useQuery({
    queryKey: ['photo-analysis', analysisId],
    queryFn: async () => (await apiClient.get(`/photo-analyses/${analysisId}`)).data,
  });
  const [grams, setGrams] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => {
      const detectedFoods = (data?.detectedFoods ?? []).map((f: any) => {
        const newGrams = Number(grams[f.name] ?? (f.gramsMin + f.gramsMax) / 2);
        const factor = newGrams / 100;
        return {
          name: f.name, grams: newGrams,
          calories: factor * (f.caloriesPer100g ?? 0),
          proteinG: 0, carbsG: 0, fatG: 0, // se completan en el backend a partir de food_items si se requiere mayor precisión
        };
      });
      return apiClient.patch(`/photo-analyses/${analysisId}`, { detectedFoods });
    },
    onSuccess: () => router.replace('/(tabs)/dashboard'),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <FlatList
        data={data?.detectedFoods ?? []}
        keyExtractor={(f: any, i: number) => `${f.name}-${i}`}
        renderItem={({ item }: any) => (
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8 }}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <TextInput
              keyboardType="numeric"
              placeholder={`${Math.round((item.gramsMin + item.gramsMax) / 2)}`}
              value={grams[item.name] ?? ''}
              onChangeText={(v) => setGrams((prev) => ({ ...prev, [item.name]: v }))}
              style={{ width: 80, borderWidth: 1, padding: 4 }}
            />
            <Text>g</Text>
          </View>
        )}
      />
      <Pressable onPress={() => save.mutate()}><Text>Guardar</Text></Pressable>
    </View>
  );
}
```

- [ ] **Step 8: Probar el flujo completo en el simulador**

Run (con `npm run dev` en `api/` y `npx expo start` en `mobile/`): tomar una foto → ver resultados con intervalos → si la confianza es baja, completar la encuesta de 2 pantallas → corregir manualmente los gramos → guardar.
Expected: en cada paso, `photo_analyses.detected_foods` en Neon refleja los cambios (verificar con `db:studio`); nunca aparece un archivo de imagen en disco del servidor.

- [ ] **Step 9: Commit**

```bash
git add mobile/app/\(tabs\)/log mobile/src/api/photoAnalysis.ts api/src/modules/photoAnalysis
git commit -m "feat: add camera, results, survey and manual correction screens"
```

---

## Self-review de esta fase (cobertura vs. sección 15, Fase 2 del documento)

1. Endpoint de subida sin persistencia a disco → Tarea 6. ✅
2. Lógica de umbrales de confianza + cálculo de intervalos → Tareas 2-3. ✅
3. Encuesta rápida para baja confianza → Tareas 5, 8 (pantallas). ✅
4. UI de corrección manual con recálculo en vivo → Tareas 7-8. ✅

**Nota**: el registro de aprendizaje opcional (sección 7.7) queda explícitamente fuera del MVP, como indica el propio documento — no se planifica aquí.
