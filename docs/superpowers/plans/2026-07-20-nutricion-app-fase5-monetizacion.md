# App de Nutrición — Fase 5 (Monetización) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar RevenueCat + Apple/Google IAP para las suscripciones premium, un paywall en la app, anuncios de AdMob en el plan gratuito, restauración de compras, y el webhook que mantiene `users.subscription_status` sincronizado (sección 12 del documento). Requiere Fases 1-3 completas (en particular `users.subscription_status`, que ya existe desde la Fase 1, y la restauración de racha de la Fase 3 que depende de este campo).

**Architecture:** RevenueCat actúa como intermediario entre la app (SDK `react-native-purchases`) y las tiendas de Apple/Google. Cuando una compra se completa o cambia, RevenueCat envía un webhook firmado al backend, que actualiza `users.subscription_status`. El backend nunca procesa pagos ni ve datos de tarjeta — solo recibe notificaciones de estado de derecho ("entitlement").

**Tech Stack:** Mismo stack de Fases 1-4 + `react-native-purchases` (RevenueCat SDK), `react-native-google-mobile-ads` (AdMob).

---

## Decisiones de arquitectura tomadas en esta fase

- **Precio de los planes**: se usan los valores sugeridos del documento como punto de partida — $6.99/mes y $49.99/año — configurables después vía A/B testing de RevenueCat sin publicar una nueva versión de la app (11.4 del documento marca el precio final como [DECISIÓN PENDIENTE]; este plan deja el valor en una constante fácil de cambiar, no hardcodeado en múltiples lugares).
- **Frecuencia de anuncios intersticiales**: cada 3 análisis de foto (punto intermedio del rango sugerido "2-3").

---

## File Structure

```
api/
├── src/
│   ├── modules/
│   │   └── subscriptions/
│   │       ├── revenueCatWebhook.ts       # valida firma + mapea evento → subscription_status
│   │       ├── revenueCatWebhook.test.ts
│   │       ├── subscriptions.service.ts
│   │       └── subscriptions.routes.ts
mobile/
├── src/
│   ├── purchases/
│   │   ├── purchasesClient.ts             # init de react-native-purchases
│   │   └── plans.ts                       # constantes de producto/precio
│   └── ads/
│       ├── adsClient.ts                   # init de AdMob
│       └── interstitialFrequency.ts       # cada N análisis de foto
├── app/
│   └── (tabs)/
│       └── paywall.tsx
```

---

## Task 1: Crear los productos de suscripción en las tiendas y en RevenueCat

**Files:** (ninguno — configuración externa)

- [ ] **Step 1: Crear los productos en App Store Connect**

En https://appstoreconnect.apple.com, dentro de la app, crear dos suscripciones auto-renovables: `premium_monthly` ($6.99/mes) y `premium_annual` ($49.99/año), en el mismo grupo de suscripción para que sean mutuamente excluyentes.

- [ ] **Step 2: Crear los mismos productos en Google Play Console**

En https://play.google.com/console, crear los productos de suscripción con los mismos identificadores (`premium_monthly`, `premium_annual`) y precios equivalentes.

- [ ] **Step 3: Inscribirse en los programas de pequeños desarrolladores**

En la cuenta de desarrollador de Apple: inscribirse en el "App Store Small Business Program" (reduce la comisión de 30% a 15% para facturación menor a $1M/año). En Google Play Console: verificar que la cuenta califica automáticamente para la tasa reducida del 15% sobre el primer millón de ingresos anuales (sección 11.3 del documento). Esto no tiene contrapartida negativa y debe hacerse desde el día 1.

- [ ] **Step 4: Configurar el proyecto en RevenueCat**

En https://app.revenuecat.com, crear un proyecto, conectar las apps de iOS y Android, y crear los mismos dos productos (`premium_monthly`, `premium_annual`) vinculados a sus equivalentes de cada tienda. Crear un "Entitlement" llamado `premium` que ambos productos otorgan. Copiar las API keys públicas (iOS y Android) y la API key secreta del servidor.

- [ ] **Step 5: Guardar las credenciales**

Añadir a `mobile/app.json` (sección `extra`) las API keys públicas de RevenueCat, y a `api/.env.example`:

```bash
REVENUECAT_WEBHOOK_SECRET=
```

(RevenueCat firma sus webhooks con un `Authorization` header configurable — ver Tarea 3.)

---

## Task 2: SDK de RevenueCat en la app móvil + pantalla de paywall

**Files:**
- Create: `mobile/src/purchases/purchasesClient.ts`
- Create: `mobile/src/purchases/plans.ts`
- Create: `mobile/app/(tabs)/paywall.tsx`

- [ ] **Step 1: Instalar el SDK**

```bash
cd mobile && npx expo install react-native-purchases
```

- [ ] **Step 2: Definir las constantes de planes**

```typescript
// mobile/src/purchases/plans.ts
export const PREMIUM_ENTITLEMENT_ID = 'premium';

export const PLAN_PRODUCTS = {
  monthly: 'premium_monthly',
  annual: 'premium_annual',
} as const;

// Precios de referencia mostrados antes de que RevenueCat resuelva el precio localizado real
// de cada tienda; el precio final por región lo determina siempre RevenueCat, no esta constante.
export const REFERENCE_PRICES = { monthly: 6.99, annual: 49.99 };
```

- [ ] **Step 3: Inicializar el SDK**

```typescript
// mobile/src/purchases/purchasesClient.ts
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';

export function initPurchases(appUserId: string) {
  const apiKey = Platform.OS === 'ios'
    ? Constants.expoConfig?.extra?.revenueCatIosKey
    : Constants.expoConfig?.extra?.revenueCatAndroidKey;
  Purchases.configure({ apiKey, appUserID: appUserId });
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: any) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}

export function isPremium(customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean {
  return 'premium' in customerInfo.entitlements.active;
}
```

Llamar a `initPurchases(userId)` una vez, justo después del login, en `mobile/app/_layout.tsx`.

- [ ] **Step 4: Pantalla de paywall con botón de restaurar compras (obligatorio para Apple)**

```tsx
// mobile/app/(tabs)/paywall.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { getOfferings, purchasePackage, restorePurchases, isPremium } from '../../src/purchases/purchasesClient';

export default function PaywallScreen() {
  const [offering, setOffering] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOfferings().then((o) => { setOffering(o); setLoading(false); });
  }, []);

  async function handlePurchase(pkg: any) {
    try {
      const customerInfo = await purchasePackage(pkg);
      if (isPremium(customerInfo)) router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      if (!err.userCancelled) Alert.alert('No se pudo completar la compra', err.message);
    }
  }

  async function handleRestore() {
    const customerInfo = await restorePurchases();
    if (isPremium(customerInfo)) {
      Alert.alert('Compras restauradas', 'Tu suscripción premium está activa.');
      router.replace('/(tabs)/dashboard');
    } else {
      Alert.alert('No se encontraron compras', 'No hay ninguna suscripción activa asociada a tu cuenta.');
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Hazte premium</Text>
      <Text>Planificador semanal completo, análisis de foto ilimitado, comparador de supermercados, sin anuncios.</Text>
      {offering?.availablePackages?.map((pkg: any) => (
        <Pressable key={pkg.identifier} onPress={() => handlePurchase(pkg)}>
          <Text>{pkg.product.title} — {pkg.product.priceString}</Text>
        </Pressable>
      ))}
      <Pressable onPress={handleRestore}><Text>Restaurar compras</Text></Pressable>
    </View>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add mobile/src/purchases mobile/app/\(tabs\)/paywall.tsx
git commit -m "feat: add revenuecat sdk integration and paywall screen"
```

---

## Task 3: Webhook de RevenueCat → `users.subscription_status`

**Files:**
- Create: `api/src/modules/subscriptions/revenueCatWebhook.ts`
- Create: `api/src/modules/subscriptions/subscriptions.service.ts`
- Create: `api/src/modules/subscriptions/subscriptions.routes.ts`
- Test: `api/src/modules/subscriptions/revenueCatWebhook.test.ts`

- [ ] **Step 1: Escribir el test de mapeo de eventos**

```typescript
// api/src/modules/subscriptions/revenueCatWebhook.test.ts
import { describe, it, expect } from 'vitest';
import { mapRevenueCatEventToStatus, verifyWebhookAuth } from './revenueCatWebhook';

describe('mapRevenueCatEventToStatus', () => {
  it('mapea INITIAL_PURCHASE de premium_monthly a subscription_status = monthly', () => {
    expect(mapRevenueCatEventToStatus({ type: 'INITIAL_PURCHASE', product_id: 'premium_monthly' })).toBe('monthly');
  });
  it('mapea RENEWAL de premium_annual a subscription_status = annual', () => {
    expect(mapRevenueCatEventToStatus({ type: 'RENEWAL', product_id: 'premium_annual' })).toBe('annual');
  });
  it('mapea CANCELLATION/EXPIRATION a free', () => {
    expect(mapRevenueCatEventToStatus({ type: 'EXPIRATION', product_id: 'premium_monthly' })).toBe('free');
    expect(mapRevenueCatEventToStatus({ type: 'CANCELLATION', product_id: 'premium_annual' })).toBe('free');
  });
});

describe('verifyWebhookAuth', () => {
  it('acepta el header Authorization si coincide con el secreto configurado', () => {
    expect(verifyWebhookAuth('Bearer secret-123', 'secret-123')).toBe(true);
  });
  it('rechaza si no coincide', () => {
    expect(verifyWebhookAuth('Bearer wrong', 'secret-123')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run: `npm test -- revenueCatWebhook`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/subscriptions/revenueCatWebhook.ts`**

```typescript
export type SubscriptionStatus = 'free' | 'monthly' | 'annual';

const ACTIVE_EVENT_TYPES = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'];
const INACTIVE_EVENT_TYPES = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

export function mapRevenueCatEventToStatus(event: { type: string; product_id: string }): SubscriptionStatus {
  if (INACTIVE_EVENT_TYPES.includes(event.type)) return 'free';
  if (!ACTIVE_EVENT_TYPES.includes(event.type)) return 'free';
  return event.product_id === 'premium_annual' ? 'annual' : 'monthly';
}

export function verifyWebhookAuth(authHeader: string | undefined, expectedSecret: string): boolean {
  return authHeader === `Bearer ${expectedSecret}`;
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run: `npm test -- revenueCatWebhook`
Expected: PASS (5 tests)

- [ ] **Step 5: Implementar el service y la ruta**

```typescript
// api/src/modules/subscriptions/subscriptions.service.ts
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { SubscriptionStatus } from './revenueCatWebhook';

export async function updateSubscriptionStatus(appUserId: string, status: SubscriptionStatus) {
  await db.update(users).set({ subscriptionStatus: status }).where(eq(users.id, appUserId));
}
```

```typescript
// api/src/modules/subscriptions/subscriptions.routes.ts
import { Router } from 'express';
import { mapRevenueCatEventToStatus, verifyWebhookAuth } from './revenueCatWebhook';
import { updateSubscriptionStatus } from './subscriptions.service';

export const subscriptionsRouter = Router();

subscriptionsRouter.post('/revenuecat-webhook', async (req, res) => {
  if (!verifyWebhookAuth(req.headers.authorization, process.env.REVENUECAT_WEBHOOK_SECRET!)) {
    res.status(401).json({ error: 'invalid webhook auth' });
    return;
  }
  const event = req.body.event;
  const status = mapRevenueCatEventToStatus(event);
  await updateSubscriptionStatus(event.app_user_id, status);
  res.status(200).json({ received: true });
});
```

- [ ] **Step 6: Montar el router y configurar la URL del webhook en RevenueCat**

```typescript
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes';
app.use('/subscriptions', subscriptionsRouter);
```

En el dashboard de RevenueCat, configurar la URL del webhook (`https://<tu-api>/subscriptions/revenuecat-webhook`) con el mismo secreto guardado en `REVENUECAT_WEBHOOK_SECRET`.

- [ ] **Step 7: Commit**

```bash
git add api/src/modules/subscriptions api/src/app.ts
git commit -m "feat: add revenuecat webhook to sync subscription_status"
```

---

## Task 4: Gating de features premium en el backend

**Files:**
- Create: `api/src/auth/requirePremium.ts`
- Test: `api/src/auth/requirePremium.test.ts`
- Modify: `api/src/modules/mealPlans/mealPlans.routes.ts`
- Modify: `api/src/modules/shoppingList/shoppingList.routes.ts`

- [ ] **Step 1: Escribir el test del middleware**

```typescript
// api/src/auth/requirePremium.test.ts
import { describe, it, expect, vi } from 'vitest';
import { requirePremium } from './requirePremium';
import { db } from '../db/client';

vi.mock('../db/client', () => ({ db: { select: vi.fn() } }));

function mockReqRes(userId: string) {
  const req: any = { userId };
  const res: any = { statusCode: 200, status(c: number) { this.statusCode = c; return this; }, json(b: any) { this.body = b; return this; } };
  const next = vi.fn();
  return { req, res, next };
}

describe('requirePremium', () => {
  it('llama next() si el usuario tiene subscription_status distinto de free', async () => {
    (db.select as any).mockReturnValue({ from: () => ({ where: () => Promise.resolve([{ subscriptionStatus: 'monthly' }]) }) });
    const { req, res, next } = mockReqRes('u1');
    await requirePremium(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('responde 402 si el usuario está en el plan gratuito', async () => {
    (db.select as any).mockReturnValue({ from: () => ({ where: () => Promise.resolve([{ subscriptionStatus: 'free' }]) }) });
    const { req, res, next } = mockReqRes('u1');
    await requirePremium(req, res, next);
    expect(res.statusCode).toBe(402);
    expect(next).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- requirePremium`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/auth/requirePremium.ts`**

```typescript
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function requirePremium(req: Request, res: Response, next: NextFunction) {
  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  if (!user || user.subscriptionStatus === 'free') {
    res.status(402).json({ error: 'premium subscription required' });
    return;
  }
  next();
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- requirePremium`
Expected: PASS (2 tests)

- [ ] **Step 5: Aplicar el gating al comparador de supermercados (premium-only según sección 11.4)**

```typescript
// modificar api/src/modules/shoppingList/shoppingList.routes.ts
import { requirePremium } from '../../auth/requirePremium';

shoppingListRouter.get('/:mealPlanId', requireAuth, requirePremium, async (req, res) => { /* ... */ });
```

Nota: el plan gratuito permite 1-2 análisis de foto al día (sección 11.4) — ese límite se implementa en la Tarea 5 (es un conteo, no un gate binario, así que no usa `requirePremium`).

- [ ] **Step 6: Commit**

```bash
git add api/src/auth/requirePremium.ts api/src/auth/requirePremium.test.ts api/src/modules/shoppingList
git commit -m "feat: add premium feature gating middleware"
```

---

## Task 5: Límite de análisis de foto en el plan gratuito

**Files:**
- Create: `api/src/modules/photoAnalysis/dailyLimit.ts`
- Test: `api/src/modules/photoAnalysis/dailyLimit.test.ts`
- Modify: `api/src/modules/photoAnalysis/photoAnalysis.routes.ts`

- [ ] **Step 1: Escribir los tests**

```typescript
// api/src/modules/photoAnalysis/dailyLimit.test.ts
import { describe, it, expect } from 'vitest';
import { isUnderDailyLimit, FREE_DAILY_PHOTO_LIMIT } from './dailyLimit';

describe('isUnderDailyLimit', () => {
  it('permite analizar si el usuario es premium, sin importar el conteo', () => {
    expect(isUnderDailyLimit({ subscriptionStatus: 'monthly', countToday: 50 })).toBe(true);
  });
  it('permite analizar si el usuario gratuito no ha llegado al límite', () => {
    expect(isUnderDailyLimit({ subscriptionStatus: 'free', countToday: FREE_DAILY_PHOTO_LIMIT - 1 })).toBe(true);
  });
  it('bloquea si el usuario gratuito ya llegó al límite', () => {
    expect(isUnderDailyLimit({ subscriptionStatus: 'free', countToday: FREE_DAILY_PHOTO_LIMIT })).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test -- dailyLimit`
Expected: FAIL

- [ ] **Step 3: Implementar `api/src/modules/photoAnalysis/dailyLimit.ts`**

```typescript
export const FREE_DAILY_PHOTO_LIMIT = 2; // punto medio del rango "1-2" sugerido en la sección 11.4

export function isUnderDailyLimit(input: { subscriptionStatus: string; countToday: number }): boolean {
  if (input.subscriptionStatus !== 'free') return true;
  return input.countToday < FREE_DAILY_PHOTO_LIMIT;
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test -- dailyLimit`
Expected: PASS (3 tests)

- [ ] **Step 5: Aplicar el límite en la ruta de subida de foto**

```typescript
// modificar api/src/modules/photoAnalysis/photoAnalysis.routes.ts
import { and, eq, gte } from 'drizzle-orm';
import { db } from '../../db/client';
import { photoAnalyses, users } from '../../db/schema';
import { isUnderDailyLimit } from './dailyLimit';

photoAnalysisRouter.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: 'photo file is required' }); return; }

  const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const todayAnalyses = await db.select().from(photoAnalyses).where(and(eq(photoAnalyses.userId, req.userId!), gte(photoAnalyses.createdAt, startOfDay)));

  if (!isUnderDailyLimit({ subscriptionStatus: user.subscriptionStatus ?? 'free', countToday: todayAnalyses.length })) {
    res.status(402).json({ error: 'daily free photo analysis limit reached' });
    return;
  }

  const result = await processPhotoAnalysis(req.userId!, req.file.buffer, req.file.mimetype);
  res.status(201).json(result);
});
```

- [ ] **Step 6: Commit**

```bash
git add api/src/modules/photoAnalysis
git commit -m "feat: enforce daily photo analysis limit on free plan"
```

---

## Task 6: Anuncios de AdMob en el plan gratuito

**Files:**
- Create: `mobile/src/ads/adsClient.ts`
- Create: `mobile/src/ads/interstitialFrequency.ts`
- Test: `mobile/src/ads/interstitialFrequency.test.ts`
- Modify: `mobile/app/(tabs)/dashboard.tsx`
- Modify: `mobile/app/(tabs)/log/camera.tsx`

- [ ] **Step 1: Instalar el SDK**

```bash
cd mobile && npx expo install react-native-google-mobile-ads
npx expo prebuild
```

Configurar los App IDs de AdMob (iOS/Android) en `mobile/app.json` según la documentación del plugin de Expo.

- [ ] **Step 2: Escribir el test de la lógica de frecuencia**

```typescript
// mobile/src/ads/interstitialFrequency.test.ts
import { describe, it, expect } from 'vitest';
import { shouldShowInterstitial, INTERSTITIAL_FREQUENCY } from './interstitialFrequency';

describe('shouldShowInterstitial', () => {
  it('muestra el intersticial cada N análisis de foto', () => {
    expect(shouldShowInterstitial(INTERSTITIAL_FREQUENCY)).toBe(true);
    expect(shouldShowInterstitial(INTERSTITIAL_FREQUENCY * 2)).toBe(true);
  });
  it('no muestra el intersticial en conteos que no son múltiplo de N', () => {
    expect(shouldShowInterstitial(1)).toBe(false);
  });
  it('nunca muestra el intersticial en count = 0', () => {
    expect(shouldShowInterstitial(0)).toBe(false);
  });
});
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run (dentro de `mobile/`, requiere `vitest` configurado igual que en `api/`): `npm test -- interstitialFrequency`
Expected: FAIL

- [ ] **Step 4: Implementar `mobile/src/ads/interstitialFrequency.ts`**

```typescript
export const INTERSTITIAL_FREQUENCY = 3; // cada 3 análisis de foto (punto intermedio de "2-3" sugerido)

export function shouldShowInterstitial(analysisCount: number): boolean {
  return analysisCount > 0 && analysisCount % INTERSTITIAL_FREQUENCY === 0;
}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `npm test -- interstitialFrequency`
Expected: PASS (3 tests)

- [ ] **Step 6: Implementar el cliente de anuncios**

```typescript
// mobile/src/ads/adsClient.ts
import { InterstitialAd, BannerAd, BannerAdSize, TestIds, AdEventType } from 'react-native-google-mobile-ads';

const INTERSTITIAL_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxx/xxxxxxxx';
export const BANNER_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxx/xxxxxxxx';

let interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
interstitial.load();

export function showInterstitialIfLoaded() {
  if (interstitial.loaded) {
    interstitial.show();
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
    interstitial.load();
  }
}

export { BannerAd, BannerAdSize };
```

- [ ] **Step 7: Banner discreto en el dashboard, oculto para usuarios premium**

```tsx
// modificar mobile/app/(tabs)/dashboard.tsx: añadir al final del JSX, dentro del componente
{user?.subscriptionStatus === 'free' && (
  <BannerAd unitId={BANNER_UNIT_ID} size={BannerAdSize.BANNER} />
)}
```

Añadir los imports correspondientes de `../../src/ads/adsClient`.

- [ ] **Step 8: Intersticial tras cada N análisis de foto, nunca durante el registro de peso**

```tsx
// modificar mobile/app/(tabs)/log/camera.tsx, dentro de pickAndAnalyze() después de subir la foto exitosamente
import { showInterstitialIfLoaded } from '../../../src/ads/adsClient';
import { shouldShowInterstitial } from '../../../src/ads/interstitialFrequency';
// ...
const { data: photoCount } = await apiClient.get('/photo-analyses/count-today'); // ver Step 9
if (user?.subscriptionStatus === 'free' && shouldShowInterstitial(photoCount.count)) {
  showInterstitialIfLoaded();
}
```

- [ ] **Step 9: Endpoint auxiliar de conteo diario (reutiliza la consulta de la Tarea 5)**

```typescript
// añadir a api/src/modules/photoAnalysis/photoAnalysis.routes.ts
photoAnalysisRouter.get('/count-today', requireAuth, async (req, res) => {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const todayAnalyses = await db.select().from(photoAnalyses).where(and(eq(photoAnalyses.userId, req.userId!), gte(photoAnalyses.createdAt, startOfDay)));
  res.json({ count: todayAnalyses.length });
});
```

- [ ] **Step 10: Commit**

```bash
git add mobile/src/ads mobile/app/\(tabs\)/dashboard.tsx mobile/app/\(tabs\)/log/camera.tsx api/src/modules/photoAnalysis
git commit -m "feat: add admob banner and interstitial ads on free plan"
```

---

## Task 7: Restricción de racha-restore ya implementada en Fase 3 — verificación end-to-end

**Files:** (ninguno nuevo — validación del trabajo de la Fase 3 ahora que RevenueCat está conectado)

- [ ] **Step 1: Probar manualmente el flujo completo con una cuenta de prueba (sandbox de Apple/Google)**

1. Registrar un usuario nuevo (queda en `subscription_status = 'free'` por defecto).
2. Confirmar que `POST /streaks/restore` devuelve `402` para este usuario.
3. Comprar `premium_monthly` en modo sandbox desde la pantalla de paywall.
4. Confirmar en los logs del backend que llegó el webhook de RevenueCat y que `users.subscription_status` cambió a `'monthly'`.
5. Confirmar que `POST /streaks/restore` ahora funciona (si la racha está en estado restaurable) en vez de devolver `402`.

Expected: los 5 pasos se cumplen sin intervención manual en la base de datos.

- [ ] **Step 2: Commit (si se hizo algún ajuste durante la verificación)**

```bash
git add -A
git commit -m "fix: adjustments found during end-to-end premium gating verification"
```

(Omitir este paso si la verificación no requirió cambios de código.)

---

## Self-review de esta fase (cobertura vs. sección 15, Fase 5 del documento y sección 11-12)

1. Integración RevenueCat (productos, entitlement, SDK, paywall) → Tareas 1-2. ✅
2. Webhook de sincronización de `subscription_status` → Tarea 3. ✅
3. Restauración de compras (obligatoria para Apple) → Tarea 2, Step 4 (botón "Restaurar compras"). ✅
4. Anuncios en el plan gratuito, sin anuncios para premium → Tarea 6. ✅
5. Restauración de racha como compra premium → ya implementado en la Fase 3 (Tarea 6 de esa fase) sobre `subscription_status`; esta fase lo deja verificado end-to-end con pagos reales de sandbox (Tarea 7).
6. Gating de funciones premium (planificador completo, análisis ilimitado, comparador de supermercados, sin anuncios) → Tareas 4-6.
7. Programas de pequeños desarrolladores (15% de comisión) → Tarea 1, Step 3.

**Pendiente explícito**: el precio final exacto de los planes y la frecuencia exacta de intersticiales son [DECISIÓN PENDIENTE] en el documento original; este plan usa los valores sugeridos como constantes (`REFERENCE_PRICES`, `INTERSTITIAL_FREQUENCY`) fáciles de ajustar tras medir conversión real, sin bloquear la implementación.
