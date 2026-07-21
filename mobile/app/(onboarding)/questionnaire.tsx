/**
 * Onboarding wizard — 19 steps, one question per screen.
 * Cal AI–inspired: big bold title, slim progress bar at top, Back + Continue bottom.
 * Conditional steps (9, 10, 14) are filtered out when not applicable.
 */

import { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { useOnboardingStore, type OnboardingData } from '../../src/state/onboardingStore';
import { apiClient } from '../../src/api/client';
import { ME_QUERY_KEY } from '../../src/hooks/useOnboardingStatus';
import { useT } from '../../src/i18n';
import {
  Screen,
  Heading,
  AppText,
  Button,
  Chip,
  Field,
  Card,
  Segmented,
  OptionCard,
  WheelPicker,
  RulerSlider,
  PaceSlider,
  type PaceStop,
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
} from '../../src/ui';
import { kgToLb, lbToKg, cmToFtIn, ftInToCm, formatFtIn } from '../../src/lib/units';
import { estimateDailyCalories, estimateWeeksToGoal } from '../../src/lib/nutritionEstimate';

// ─── helpers ─────────────────────────────────────────────────────────────────

function isValidPastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  if (parsed.toISOString().slice(0, 10) !== value) return false;
  return parsed <= new Date();
}

function isPositiveNumber(v: string): boolean {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
}

// ─── Step IDs ────────────────────────────────────────────────────────────────

type StepId =
  | 'sex'
  | 'birthDate'
  | 'height'
  | 'weight'
  | 'bodyFat'
  | 'activityLevel'
  | 'trainingDays'
  | 'goal'
  | 'targetWeight'
  | 'pace'
  | 'dietStyle'
  | 'allergies'
  | 'meals'
  | 'pregnancy'
  | 'medical'
  | 'sleep'
  | 'stress'
  | 'water'
  | 'review';

interface StepDescriptor {
  id: StepId;
  optional: boolean;
  /** Return false to skip this step entirely (conditional). */
  visible?: (data: OnboardingData) => boolean;
}

const ALL_STEPS: StepDescriptor[] = [
  { id: 'sex',          optional: false },
  { id: 'birthDate',    optional: false },
  { id: 'height',       optional: false },
  { id: 'weight',       optional: false },
  { id: 'bodyFat',      optional: true  },
  { id: 'activityLevel',optional: false },
  { id: 'trainingDays', optional: true  },
  { id: 'goal',         optional: false },
  { id: 'targetWeight', optional: true,  visible: (d) => d.goal !== 'maintain' },
  { id: 'pace',         optional: false, visible: (d) => d.goal !== 'maintain' },
  { id: 'dietStyle',    optional: false },
  { id: 'allergies',    optional: true  },
  { id: 'meals',        optional: false },
  { id: 'pregnancy',    optional: false, visible: (d) => d.sex === 'female' },
  { id: 'medical',      optional: true  },
  { id: 'sleep',        optional: true  },
  { id: 'stress',       optional: true  },
  { id: 'water',        optional: true  },
  { id: 'review',       optional: false },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <View
      style={{
        width: '100%',
        height: 6,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceAlt,
        marginBottom: spacing.xl,
      }}
    >
      <View
        style={{
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.ink,
          width: `${Math.min(100, Math.max(0, pct * 100))}%`,
        }}
      />
    </View>
  );
}

// ─── Individual step content components ──────────────────────────────────────

// Chip row wrapper
function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md }}>
      {children}
    </View>
  );
}

// ─── Step: sex ───────────────────────────────────────────────────────────────
function SexStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {(['male', 'female'] as const).map((v) => (
        <OptionCard
          key={v}
          label={t(v === 'male' ? 'auth.q.sex.male' : 'auth.q.sex.female')}
          icon={<AppText style={{ fontSize: 22, color: colors.primary }}>{v === 'male' ? '♂' : '♀'}</AppText>}
          selected={data.sex === v}
          onPress={() => setData({ sex: v })}
        />
      ))}
    </View>
  );
}

// ─── Step: birthDate ─────────────────────────────────────────────────────────
function BirthDateStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const t = useT();
  return (
    <Field
      placeholder={t('auth.q.birthDate.placeholder')}
      value={value}
      onChangeText={onChange}
      keyboardType="numbers-and-punctuation"
      autoCapitalize="none"
      autoCorrect={false}
      error={error}
      style={{ marginTop: spacing.md }}
    />
  );
}

// ─── Step: height ─────────────────────────────────────────────────────────────
const HEIGHT_OPTIONS = Array.from({ length: 101 }, (_, i) => 120 + i); // 120..220 cm

function HeightStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  const cm = value ? Math.round(Number(value)) : 168;
  // Seed the default so Continue enables without forcing a scroll.
  useEffect(() => {
    if (!value) onChange('168');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ marginTop: spacing.md, gap: spacing.xl, alignItems: 'center' }}>
      <View style={{ width: 180 }}>
        <Segmented
          value={unit}
          onChange={(v) => setUnit(v as 'cm' | 'ft')}
          options={[{ value: 'cm', label: 'cm' }, { value: 'ft', label: 'ft, in' }]}
        />
      </View>
      <View style={{ width: '100%' }}>
        <WheelPicker
          options={HEIGHT_OPTIONS}
          value={cm}
          onChange={(v) => onChange(String(v))}
          formatLabel={(v) => {
            if (unit === 'cm') return `${v} cm`;
            const { ft, inch } = cmToFtIn(v);
            return formatFtIn(ft, inch);
          }}
        />
      </View>
    </View>
  );
}

// ─── Step: weight ─────────────────────────────────────────────────────────────
function WeightStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const kg = value ? Number(value) : 70;
  // Seed the default so Continue enables without forcing a scroll.
  useEffect(() => {
    if (!value) onChange('70');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const display = unit === 'kg'
    ? (Number.isInteger(kg) ? `${kg}` : kg.toFixed(1))
    : `${Math.round(kgToLb(kg))}`;

  return (
    <View style={{ marginTop: spacing.md, gap: spacing.xl, alignItems: 'center' }}>
      <View style={{ width: 180 }}>
        <Segmented
          value={unit}
          onChange={(v) => setUnit(v as 'kg' | 'lb')}
          options={[{ value: 'lb', label: 'lbs' }, { value: 'kg', label: 'kg' }]}
        />
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
          <AppText style={{ fontSize: fontSize.display, fontWeight: fontWeight.heavy }}>{display}</AppText>
          <AppText variant="h3" tone="muted" weight="semibold">{unit}</AppText>
        </View>
      </View>
      <View style={{ width: '100%' }}>
        <RulerSlider min={30} max={200} step={0.5} value={kg} onChange={(v) => onChange(String(v))} />
      </View>
    </View>
  );
}

// ─── Step: bodyFat ────────────────────────────────────────────────────────────
function BodyFatStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const t = useT();
  return (
    <Field
      placeholder={t('auth.q.bodyFat.placeholder')}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      error={error}
      style={{ marginTop: spacing.md }}
    />
  );
}

// ─── Step: activityLevel ─────────────────────────────────────────────────────
const ACTIVITY_OPTIONS: Array<{
  value: NonNullable<OnboardingData['activityLevel']>;
  titleKey: string;
  descKey: string;
}> = [
  { value: 'sedentary',  titleKey: 'auth.q.activityLevel.sedentary',  descKey: 'auth.q.activityLevel.sedentaryDesc'  },
  { value: 'light',      titleKey: 'auth.q.activityLevel.light',      descKey: 'auth.q.activityLevel.lightDesc'      },
  { value: 'moderate',   titleKey: 'auth.q.activityLevel.moderate',   descKey: 'auth.q.activityLevel.moderateDesc'   },
  { value: 'active',     titleKey: 'auth.q.activityLevel.active',     descKey: 'auth.q.activityLevel.activeDesc'     },
  { value: 'very_active',titleKey: 'auth.q.activityLevel.veryActive', descKey: 'auth.q.activityLevel.veryActiveDesc' },
];

function ActivityLevelStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
      {ACTIVITY_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={`${t(opt.titleKey)} — ${t(opt.descKey)}`}
          active={data.activityLevel === opt.value}
          onPress={() => setData({ activityLevel: opt.value })}
        />
      ))}
    </View>
  );
}

// ─── Step: trainingDays ───────────────────────────────────────────────────────
function TrainingDaysStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  return (
    <ChipRow>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
        <Chip
          key={n}
          label={String(n)}
          active={data.trainingDaysPerWeek === n}
          onPress={() => setData({ trainingDaysPerWeek: n })}
        />
      ))}
    </ChipRow>
  );
}

// ─── Step: goal ───────────────────────────────────────────────────────────────
const GOAL_OPTIONS: Array<{
  value: NonNullable<OnboardingData['goal']>;
  key: string;
  emoji: string;
}> = [
  { value: 'lose_fat',     key: 'auth.q.goal.loseFat',    emoji: '🔥' },
  { value: 'gain_muscle',  key: 'auth.q.goal.gainMuscle', emoji: '💪' },
  { value: 'maintain',     key: 'auth.q.goal.maintain',   emoji: '⚖️' },
];

function GoalStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {GOAL_OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={t(opt.key)}
          icon={<AppText style={{ fontSize: 22 }}>{opt.emoji}</AppText>}
          selected={data.goal === opt.value}
          onPress={() => setData({ goal: opt.value })}
        />
      ))}
    </View>
  );
}

// ─── Step: targetWeight ───────────────────────────────────────────────────────
function TargetWeightStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const t = useT();
  return (
    <Field
      placeholder={t('auth.q.targetWeight.placeholder')}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      error={error}
      style={{ marginTop: spacing.md }}
    />
  );
}

// ─── Step: pace ───────────────────────────────────────────────────────────────
function PaceStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  // Default to the recommended pace so Continue is enabled on arrival.
  useEffect(() => {
    if (data.weeklyRateKg == null) setData({ weeklyRateKg: 0.5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const stops: PaceStop[] = [
    { value: 0.25, label: t('auth.q.pace.conservative'), emoji: '🦥' },
    { value: 0.5,  label: t('auth.q.pace.moderate'),     emoji: '🐇' },
    { value: 0.75, label: t('auth.q.pace.aggressive'),   emoji: '🐆' },
  ];
  const rate = data.weeklyRateKg ?? 0.5;
  const calories = estimateDailyCalories({ ...data, weeklyRateKg: rate });
  const weeks = estimateWeeksToGoal({ ...data, weeklyRateKg: rate });

  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.xl }}>
      <View style={{ alignItems: 'center' }}>
        <AppText variant="small" tone="muted" weight="semibold">{t('app.pace.perWeek')}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs }}>
          <AppText style={{ fontSize: fontSize.display, fontWeight: fontWeight.heavy }}>{rate.toString().replace('.', ',')}</AppText>
          <AppText variant="h3" tone="muted" weight="semibold">kg</AppText>
        </View>
      </View>

      <PaceSlider stops={stops} value={rate} onChange={(v) => setData({ weeklyRateKg: v })} />

      {calories != null ? (
        <Card style={{ backgroundColor: colors.surfaceAlt, borderWidth: 0 }}>
          {weeks != null ? (
            <AppText variant="body" weight="bold" style={{ marginBottom: spacing.xs }}>
              {`${t('app.pace.reachIn')} ~${weeks} ${t('app.pace.weeks')}`}
            </AppText>
          ) : null}
          <AppText variant="small" tone="muted">
            {`${t('app.pace.dailyTarget')}: ${calories} ${t('app.pace.cal')}`}
          </AppText>
        </Card>
      ) : null}
    </View>
  );
}

// ─── Step: dietStyle ──────────────────────────────────────────────────────────
const DIET_OPTIONS: Array<{
  value: NonNullable<OnboardingData['dietMode']>;
  key: string;
}> = [
  { value: 'standard',         key: 'auth.q.dietStyle.standard'        },
  { value: 'high_protein',     key: 'auth.q.dietStyle.highProtein'     },
  { value: 'keto',             key: 'auth.q.dietStyle.keto'            },
  { value: 'vegetarian_vegan', key: 'auth.q.dietStyle.vegetarianVegan' },
];

function DietStyleStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <ChipRow>
      {DIET_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={t(opt.key)}
          active={data.dietMode === opt.value}
          onPress={() => setData({ dietMode: opt.value })}
        />
      ))}
    </ChipRow>
  );
}

// ─── Step: allergies ──────────────────────────────────────────────────────────
const ALLERGY_OPTIONS: Array<{ value: string; key: string }> = [
  { value: 'none',      key: 'auth.q.allergies.none'     },
  { value: 'gluten',    key: 'auth.q.allergies.gluten'   },
  { value: 'lactose',   key: 'auth.q.allergies.lactose'  },
  { value: 'nuts',      key: 'auth.q.allergies.nuts'     },
  { value: 'shellfish', key: 'auth.q.allergies.shellfish'},
  { value: 'eggs',      key: 'auth.q.allergies.eggs'     },
  { value: 'soy',       key: 'auth.q.allergies.soy'      },
  { value: 'fish',      key: 'auth.q.allergies.fish'     },
];

function AllergiesStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  const selected = data.allergies ?? [];

  function toggle(value: string) {
    if (value === 'none') {
      setData({ allergies: [] }); // "none" clears everything (store empty = none)
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected.filter((v) => v !== 'none'), value];
    setData({ allergies: next });
  }

  const noneActive = selected.length === 0;

  return (
    <ChipRow>
      {ALLERGY_OPTIONS.map((opt) => {
        const isActive = opt.value === 'none' ? noneActive : selected.includes(opt.value);
        return (
          <Chip
            key={opt.value}
            label={t(opt.key)}
            active={isActive}
            onPress={() => toggle(opt.value)}
          />
        );
      })}
    </ChipRow>
  );
}

// ─── Step: meals ──────────────────────────────────────────────────────────────
const MEAL_OPTIONS: Array<{ value: NonNullable<OnboardingData['mealsPerDay']>; key: string }> = [
  { value: '3',   key: 'auth.q.meals.3'  },
  { value: '5_6', key: 'auth.q.meals.56' },
];

function MealsStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <ChipRow>
      {MEAL_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={t(opt.key)}
          active={data.mealsPerDay === opt.value}
          onPress={() => setData({ mealsPerDay: opt.value })}
        />
      ))}
    </ChipRow>
  );
}

// ─── Step: pregnancy ──────────────────────────────────────────────────────────
const PREGNANCY_OPTIONS: Array<{
  value: NonNullable<OnboardingData['pregnancyStatus']>;
  key: string;
}> = [
  { value: 'none',          key: 'auth.q.pregnancy.none'          },
  { value: 'pregnant',      key: 'auth.q.pregnancy.pregnant'      },
  { value: 'breastfeeding', key: 'auth.q.pregnancy.breastfeeding' },
];

function PregnancyStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <ChipRow>
      {PREGNANCY_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={t(opt.key)}
          active={data.pregnancyStatus === opt.value}
          onPress={() => setData({ pregnancyStatus: opt.value })}
        />
      ))}
    </ChipRow>
  );
}

// ─── Step: medical ────────────────────────────────────────────────────────────
const MEDICAL_OPTIONS: Array<{ value: string; key: string }> = [
  { value: 'none',             key: 'auth.q.medical.none'          },
  { value: 'diabetes_t1',      key: 'auth.q.medical.diabetesT1'    },
  { value: 'diabetes_t2',      key: 'auth.q.medical.diabetesT2'    },
  { value: 'hypertension',     key: 'auth.q.medical.hypertension'  },
  { value: 'hypothyroidism',   key: 'auth.q.medical.hypothyroidism'},
  { value: 'kidney_disease',   key: 'auth.q.medical.kidneyDisease' },
];

function MedicalStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  const selected = data.medicalConditions ?? [];

  function toggle(value: string) {
    if (value === 'none') {
      setData({ medicalConditions: [] });
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected.filter((v) => v !== 'none'), value];
    setData({ medicalConditions: next });
  }

  const noneActive = selected.length === 0;

  return (
    <ChipRow>
      {MEDICAL_OPTIONS.map((opt) => {
        const isActive = opt.value === 'none' ? noneActive : selected.includes(opt.value);
        return (
          <Chip
            key={opt.value}
            label={t(opt.key)}
            active={isActive}
            onPress={() => toggle(opt.value)}
          />
        );
      })}
    </ChipRow>
  );
}

// ─── Step: sleep ──────────────────────────────────────────────────────────────
function SleepStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const t = useT();
  return (
    <Field
      placeholder={t('auth.q.sleep.placeholder')}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      error={error}
      style={{ marginTop: spacing.md }}
    />
  );
}

// ─── Step: stress ─────────────────────────────────────────────────────────────
const STRESS_OPTIONS: Array<{
  value: NonNullable<OnboardingData['stressLevel']>;
  key: string;
}> = [
  { value: 'low',    key: 'auth.q.stress.low'    },
  { value: 'medium', key: 'auth.q.stress.medium' },
  { value: 'high',   key: 'auth.q.stress.high'   },
];

function StressStep({
  data,
  setData,
}: {
  data: OnboardingData;
  setData: (d: Partial<OnboardingData>) => void;
}) {
  const t = useT();
  return (
    <ChipRow>
      {STRESS_OPTIONS.map((opt) => (
        <Chip
          key={opt.value}
          label={t(opt.key)}
          active={data.stressLevel === opt.value}
          onPress={() => setData({ stressLevel: opt.value })}
        />
      ))}
    </ChipRow>
  );
}

// ─── Step: water ──────────────────────────────────────────────────────────────
function WaterStep({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const t = useT();
  return (
    <Field
      placeholder={t('auth.q.water.placeholder')}
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      error={error}
      style={{ marginTop: spacing.md }}
    />
  );
}

// ─── Step: review ─────────────────────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText variant="small" tone="muted" style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText variant="small" weight="semibold" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}

function ReviewStep({ data }: { data: OnboardingData }) {
  const t = useT();
  const ns = (key: string) => t(`auth.q.review.${key}`);
  const none = ns('notSet');

  const activityLabels: Record<string, string> = {
    sedentary:   t('auth.q.activityLevel.sedentary'),
    light:       t('auth.q.activityLevel.light'),
    moderate:    t('auth.q.activityLevel.moderate'),
    active:      t('auth.q.activityLevel.active'),
    very_active: t('auth.q.activityLevel.veryActive'),
  };
  const goalLabels: Record<string, string> = {
    lose_fat:     t('auth.q.goal.loseFat'),
    maintain:     t('auth.q.goal.maintain'),
    gain_muscle:  t('auth.q.goal.gainMuscle'),
  };
  const dietLabels: Record<string, string> = {
    standard:          t('auth.q.dietStyle.standard'),
    high_protein:      t('auth.q.dietStyle.highProtein'),
    keto:              t('auth.q.dietStyle.keto'),
    vegetarian_vegan:  t('auth.q.dietStyle.vegetarianVegan'),
  };
  const pregnancyLabels: Record<string, string> = {
    none:          t('auth.q.pregnancy.none'),
    pregnant:      t('auth.q.pregnancy.pregnant'),
    breastfeeding: t('auth.q.pregnancy.breastfeeding'),
  };
  const stressLabels: Record<string, string> = {
    low:    t('auth.q.stress.low'),
    medium: t('auth.q.stress.medium'),
    high:   t('auth.q.stress.high'),
  };

  const allergyLabelMap: Record<string, string> = {
    gluten:    t('auth.q.allergies.gluten'),
    lactose:   t('auth.q.allergies.lactose'),
    nuts:      t('auth.q.allergies.nuts'),
    shellfish: t('auth.q.allergies.shellfish'),
    eggs:      t('auth.q.allergies.eggs'),
    soy:       t('auth.q.allergies.soy'),
    fish:      t('auth.q.allergies.fish'),
  };
  const medicalLabelMap: Record<string, string> = {
    diabetes_t1:    t('auth.q.medical.diabetesT1'),
    diabetes_t2:    t('auth.q.medical.diabetesT2'),
    hypertension:   t('auth.q.medical.hypertension'),
    hypothyroidism: t('auth.q.medical.hypothyroidism'),
    kidney_disease: t('auth.q.medical.kidneyDisease'),
  };

  const paceLabel = data.weeklyRateKg === 0.25
    ? t('auth.q.pace.conservative')
    : data.weeklyRateKg === 0.5
      ? t('auth.q.pace.moderate')
      : data.weeklyRateKg === 0.75
        ? t('auth.q.pace.aggressive')
        : none;

  const allergiesDisplay =
    !data.allergies || data.allergies.length === 0
      ? t('auth.q.allergies.none')
      : data.allergies.map((a) => allergyLabelMap[a] ?? a).join(', ');

  const medicalDisplay =
    !data.medicalConditions || data.medicalConditions.length === 0
      ? t('auth.q.medical.none')
      : data.medicalConditions.map((m) => medicalLabelMap[m] ?? m).join(', ');

  return (
    <View style={{ marginTop: spacing.md }}>
      <ReviewRow label={ns('sex')} value={data.sex === 'male' ? t('auth.q.sex.male') : data.sex === 'female' ? t('auth.q.sex.female') : none} />
      <ReviewRow label={ns('birthDate')} value={data.birthDate ?? none} />
      <ReviewRow label={ns('height')} value={data.heightCm ? `${data.heightCm} ${ns('cmUnit')}` : none} />
      <ReviewRow label={ns('weight')} value={data.weightKg ? `${data.weightKg} ${ns('kgUnit')}` : none} />
      {data.bodyFatPercent !== undefined && (
        <ReviewRow label={ns('bodyFat')} value={`${data.bodyFatPercent} ${ns('pctUnit')}`} />
      )}
      <ReviewRow label={ns('activityLevel')} value={data.activityLevel ? activityLabels[data.activityLevel] ?? none : none} />
      {data.trainingDaysPerWeek !== undefined && (
        <ReviewRow label={ns('trainingDays')} value={`${data.trainingDaysPerWeek} ${ns('daysUnit')}`} />
      )}
      <ReviewRow label={ns('goal')} value={data.goal ? goalLabels[data.goal] ?? none : none} />
      {data.targetWeightKg !== undefined && (
        <ReviewRow label={ns('targetWeight')} value={`${data.targetWeightKg} ${ns('kgUnit')}`} />
      )}
      {data.goal !== 'maintain' && data.weeklyRateKg !== undefined && (
        <ReviewRow label={ns('pace')} value={paceLabel} />
      )}
      <ReviewRow label={ns('dietStyle')} value={data.dietMode ? dietLabels[data.dietMode] ?? none : none} />
      <ReviewRow label={ns('allergies')} value={allergiesDisplay} />
      <ReviewRow label={ns('meals')} value={data.mealsPerDay === '3' ? t('auth.q.meals.3') : data.mealsPerDay === '5_6' ? t('auth.q.meals.56') : none} />
      {data.sex === 'female' && (
        <ReviewRow label={ns('pregnancy')} value={data.pregnancyStatus ? pregnancyLabels[data.pregnancyStatus] ?? none : none} />
      )}
      <ReviewRow label={ns('medical')} value={medicalDisplay} />
      {data.sleepHours !== undefined && (
        <ReviewRow label={ns('sleep')} value={`${data.sleepHours} ${ns('hrsUnit')}`} />
      )}
      {data.stressLevel !== undefined && (
        <ReviewRow label={ns('stress')} value={stressLabels[data.stressLevel] ?? none} />
      )}
      {data.waterIntakeMl !== undefined && (
        <ReviewRow label={ns('water')} value={`${data.waterIntakeMl} ${ns('mlUnit')}`} />
      )}
    </View>
  );
}

// ─── Step title / subtitle lookup ─────────────────────────────────────────────
function useStepMeta(id: StepId): { title: string; subtitle?: string } {
  const t = useT();
  const META: Record<StepId, { title: string; subtitle?: string }> = {
    sex:          { title: t('auth.q.sex.title'),          subtitle: t('auth.q.sex.subtitle')          },
    birthDate:    { title: t('auth.q.birthDate.title'),    subtitle: t('auth.q.birthDate.subtitle')    },
    height:       { title: t('auth.q.height.title'),       subtitle: t('auth.q.height.subtitle')       },
    weight:       { title: t('auth.q.weight.title'),       subtitle: t('auth.q.weight.subtitle')       },
    bodyFat:      { title: t('auth.q.bodyFat.title'),      subtitle: t('auth.q.bodyFat.subtitle')      },
    activityLevel:{ title: t('auth.q.activityLevel.title'),subtitle: t('auth.q.activityLevel.subtitle')},
    trainingDays: { title: t('auth.q.trainingDays.title'), subtitle: t('auth.q.trainingDays.subtitle') },
    goal:         { title: t('auth.q.goal.title'),         subtitle: t('auth.q.goal.subtitle')         },
    targetWeight: { title: t('auth.q.targetWeight.title'), subtitle: t('auth.q.targetWeight.subtitle') },
    pace:         { title: t('auth.q.pace.title'),         subtitle: t('auth.q.pace.subtitle')         },
    dietStyle:    { title: t('auth.q.dietStyle.title'),    subtitle: t('auth.q.dietStyle.subtitle')    },
    allergies:    { title: t('auth.q.allergies.title'),    subtitle: t('auth.q.allergies.subtitle')    },
    meals:        { title: t('auth.q.meals.title'),        subtitle: t('auth.q.meals.subtitle')        },
    pregnancy:    { title: t('auth.q.pregnancy.title'),    subtitle: t('auth.q.pregnancy.subtitle')    },
    medical:      { title: t('auth.q.medical.title'),      subtitle: t('auth.q.medical.subtitle')      },
    sleep:        { title: t('auth.q.sleep.title'),        subtitle: t('auth.q.sleep.subtitle')        },
    stress:       { title: t('auth.q.stress.title'),       subtitle: t('auth.q.stress.subtitle')       },
    water:        { title: t('auth.q.water.title'),        subtitle: t('auth.q.water.subtitle')        },
    review:       { title: t('auth.q.review.title'),       subtitle: t('auth.q.review.subtitle')       },
  };
  return META[id];
}

// ─── Local field state ─────────────────────────────────────────────────────────
// Numeric fields stored as strings while editing; converted on advance/skip.
interface LocalFields {
  birthDate: string;
  height: string;
  weight: string;
  bodyFat: string;
  targetWeight: string;
  sleep: string;
  water: string;
}

// ─── Wizard root ───────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { data, setData } = useOnboardingStore();
  const queryClient = useQueryClient();
  const t = useT();

  // Local text fields
  const [fields, setFields] = useState<LocalFields>({
    birthDate:    data.birthDate    ?? '',
    height:       data.heightCm     != null ? String(data.heightCm)     : '',
    weight:       data.weightKg     != null ? String(data.weightKg)     : '',
    bodyFat:      data.bodyFatPercent != null ? String(data.bodyFatPercent) : '',
    targetWeight: data.targetWeightKg != null ? String(data.targetWeightKg) : '',
    sleep:        data.sleepHours   != null ? String(data.sleepHours)   : '',
    water:        data.waterIntakeMl != null ? String(data.waterIntakeMl / 250) : '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LocalFields, string>>>({});

  function setField(key: keyof LocalFields, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Step navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute visible steps dynamically (re-computed each render when data changes)
  const visibleSteps = ALL_STEPS.filter((s) => s.visible == null || s.visible(data));
  const totalSteps = visibleSteps.length;
  const clampedIndex = Math.min(currentIndex, totalSteps - 1);
  const currentStep = visibleSteps[clampedIndex];
  const isFirst = clampedIndex === 0;
  const isLast = clampedIndex === totalSteps - 1;
  const pct = (clampedIndex + 1) / totalSteps;

  const meta = useStepMeta(currentStep.id);

  // ── Validation per step ───────────────────────────────────────────────────
  function validateAndSave(stepId: StepId): boolean {
    setFieldErrors({});
    switch (stepId) {
      case 'sex':
        return !!data.sex;

      case 'birthDate': {
        if (!isValidPastDate(fields.birthDate)) {
          setFieldErrors({ birthDate: t('auth.q.birthDate.error') });
          return false;
        }
        setData({ birthDate: fields.birthDate });
        return true;
      }

      case 'height': {
        if (!isPositiveNumber(fields.height)) {
          setFieldErrors({ height: t('auth.q.height.error') });
          return false;
        }
        setData({ heightCm: Number(fields.height) });
        return true;
      }

      case 'weight': {
        if (!isPositiveNumber(fields.weight)) {
          setFieldErrors({ weight: t('auth.q.weight.error') });
          return false;
        }
        setData({ weightKg: Number(fields.weight) });
        return true;
      }

      case 'bodyFat': {
        // optional — only validate if non-empty
        if (fields.bodyFat.trim() !== '') {
          const n = Number(fields.bodyFat);
          if (!Number.isFinite(n) || n < 1 || n > 70) {
            setFieldErrors({ bodyFat: t('auth.q.bodyFat.error') });
            return false;
          }
          setData({ bodyFatPercent: n });
        }
        return true;
      }

      case 'activityLevel':
        return !!data.activityLevel;

      case 'trainingDays':
        return true; // always optional — default 0 if unset

      case 'goal':
        return !!data.goal;

      case 'targetWeight': {
        // optional — validate if non-empty
        if (fields.targetWeight.trim() !== '') {
          if (!isPositiveNumber(fields.targetWeight)) {
            setFieldErrors({ targetWeight: t('auth.q.targetWeight.error') });
            return false;
          }
          setData({ targetWeightKg: Number(fields.targetWeight) });
        }
        return true;
      }

      case 'pace':
        return !!data.weeklyRateKg;

      case 'dietStyle':
        return !!data.dietMode;

      case 'allergies':
        return true; // always optional

      case 'meals':
        return !!data.mealsPerDay;

      case 'pregnancy':
        return !!data.pregnancyStatus;

      case 'medical':
        return true; // always optional

      case 'sleep': {
        if (fields.sleep.trim() !== '') {
          const n = Number(fields.sleep);
          if (!Number.isFinite(n) || n < 1 || n > 24) {
            setFieldErrors({ sleep: t('auth.q.sleep.error') });
            return false;
          }
          setData({ sleepHours: n });
        }
        return true;
      }

      case 'stress':
        return true; // always optional

      case 'water': {
        if (fields.water.trim() !== '') {
          const glasses = Number(fields.water);
          if (!Number.isFinite(glasses) || glasses < 0 || glasses > 50) {
            setFieldErrors({ water: t('auth.q.water.error') });
            return false;
          }
          setData({ waterIntakeMl: Math.round(glasses * 250) });
        }
        return true;
      }

      case 'review':
        return true;
    }
  }

  // Is the current step's primary selection done (for enabling Continue)?
  function isStepComplete(stepId: StepId): boolean {
    switch (stepId) {
      case 'sex':          return !!data.sex;
      case 'birthDate':    return isValidPastDate(fields.birthDate);
      case 'height':       return isPositiveNumber(fields.height);
      case 'weight':       return isPositiveNumber(fields.weight);
      case 'bodyFat':      return true; // optional
      case 'activityLevel':return !!data.activityLevel;
      case 'trainingDays': return true; // optional
      case 'goal':         return !!data.goal;
      case 'targetWeight': return true; // optional
      case 'pace':         return !!data.weeklyRateKg;
      case 'dietStyle':    return !!data.dietMode;
      case 'allergies':    return true; // optional
      case 'meals':        return !!data.mealsPerDay;
      case 'pregnancy':    return !!data.pregnancyStatus;
      case 'medical':      return true; // optional
      case 'sleep':        return true; // optional
      case 'stress':       return true; // optional
      case 'water':        return true; // optional
      case 'review':       return true;
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    if (!validateAndSave(currentStep.id)) return;
    if (isLast) {
      handleSubmit();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSubmitError(null);
  }, [currentStep.id, isLast, fields, data]);

  const handleBack = useCallback(() => {
    if (isFirst) return;
    setCurrentIndex((i) => i - 1);
    setSubmitError(null);
    setFieldErrors({});
  }, [isFirst]);

  const handleSkip = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setSubmitError(null);
    setFieldErrors({});
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (isSubmitting) return;
    setSubmitError(null);

    const d = data;
    // Defensive guard on required fields
    if (!d.sex || !d.birthDate || !d.heightCm || !d.weightKg || !d.activityLevel || !d.goal || !d.mealsPerDay) {
      setSubmitError(t('auth.q.errorMissingRequired'));
      return;
    }

    // Build payload, omitting undefined optionals
    const payload: Record<string, unknown> = {
      sex:          d.sex,
      birthDate:    d.birthDate,
      heightCm:     d.heightCm,
      weightKg:     d.weightKg,
      activityLevel:d.activityLevel,
      goal:         d.goal,
      mealsPerDay:  d.mealsPerDay,
    };

    if (d.bodyFatPercent   !== undefined) payload.bodyFatPercent   = d.bodyFatPercent;
    if (d.trainingDaysPerWeek !== undefined) payload.trainingDaysPerWeek = d.trainingDaysPerWeek;
    if (d.targetWeightKg   !== undefined) payload.targetWeightKg   = d.targetWeightKg;
    if (d.weeklyRateKg     !== undefined) payload.weeklyRateKg     = d.weeklyRateKg;
    if (d.dietMode         !== undefined) payload.dietMode         = d.dietMode;
    if (d.allergies        !== undefined && d.allergies.length > 0) payload.allergies = d.allergies;
    if (d.pregnancyStatus  !== undefined) payload.pregnancyStatus  = d.pregnancyStatus;
    if (d.medicalConditions !== undefined && d.medicalConditions.length > 0) payload.medicalConditions = d.medicalConditions;
    if (d.sleepHours       !== undefined) payload.sleepHours       = d.sleepHours;
    if (d.stressLevel      !== undefined) payload.stressLevel      = d.stressLevel;
    if (d.waterIntakeMl    !== undefined) payload.waterIntakeMl    = d.waterIntakeMl;

    setIsSubmitting(true);
    apiClient
      .post('/users/onboarding', payload)
      .then((res) => {
        queryClient.setQueryData(ME_QUERY_KEY, res.data);
        void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      })
      .catch(() => {
        setSubmitError(t('common.connectionError'));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  // ── Render step content ───────────────────────────────────────────────────
  function renderStepContent(stepId: StepId) {
    switch (stepId) {
      case 'sex':
        return <SexStep data={data} setData={setData} />;
      case 'birthDate':
        return (
          <BirthDateStep
            value={fields.birthDate}
            onChange={(v) => setField('birthDate', v)}
            error={fieldErrors.birthDate}
          />
        );
      case 'height':
        return (
          <HeightStep
            value={fields.height}
            onChange={(v) => setField('height', v)}
            error={fieldErrors.height}
          />
        );
      case 'weight':
        return (
          <WeightStep
            value={fields.weight}
            onChange={(v) => setField('weight', v)}
            error={fieldErrors.weight}
          />
        );
      case 'bodyFat':
        return (
          <BodyFatStep
            value={fields.bodyFat}
            onChange={(v) => setField('bodyFat', v)}
            error={fieldErrors.bodyFat}
          />
        );
      case 'activityLevel':
        return <ActivityLevelStep data={data} setData={setData} />;
      case 'trainingDays':
        return <TrainingDaysStep data={data} setData={setData} />;
      case 'goal':
        return <GoalStep data={data} setData={setData} />;
      case 'targetWeight':
        return (
          <TargetWeightStep
            value={fields.targetWeight}
            onChange={(v) => setField('targetWeight', v)}
            error={fieldErrors.targetWeight}
          />
        );
      case 'pace':
        return <PaceStep data={data} setData={setData} />;
      case 'dietStyle':
        return <DietStyleStep data={data} setData={setData} />;
      case 'allergies':
        return <AllergiesStep data={data} setData={setData} />;
      case 'meals':
        return <MealsStep data={data} setData={setData} />;
      case 'pregnancy':
        return <PregnancyStep data={data} setData={setData} />;
      case 'medical':
        return <MedicalStep data={data} setData={setData} />;
      case 'sleep':
        return (
          <SleepStep
            value={fields.sleep}
            onChange={(v) => setField('sleep', v)}
            error={fieldErrors.sleep}
          />
        );
      case 'stress':
        return <StressStep data={data} setData={setData} />;
      case 'water':
        return (
          <WaterStep
            value={fields.water}
            onChange={(v) => setField('water', v)}
            error={fieldErrors.water}
          />
        );
      case 'review':
        return <ReviewStep data={data} />;
    }
  }

  const continueDisabled = !isStepComplete(currentStep.id);
  const continueLabel = isLast ? t('auth.q.finish') : t('auth.q.continue');

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: spacing.xxxl,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress bar — always at very top */}
          <ProgressBar pct={pct} />

          {/* Title + subtitle */}
          <Heading variant="h1" style={{ marginBottom: spacing.xs }}>
            {meta.title}
          </Heading>
          {meta.subtitle ? (
            <AppText variant="body" tone="muted" style={{ marginBottom: spacing.md }}>
              {meta.subtitle}
            </AppText>
          ) : null}

          {/* Step content */}
          {renderStepContent(currentStep.id)}

          {/* Error message */}
          {submitError ? (
            <AppText tone="danger" style={{ marginTop: spacing.md }}>
              {submitError}
            </AppText>
          ) : null}

          {/* Spacer to push buttons toward bottom */}
          <View style={{ flex: 1, minHeight: spacing.xxxl }} />

          {/* Bottom actions */}
          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            {/* Continue / Finish */}
            <Button
              title={continueLabel}
              variant="primary"
              onPress={handleContinue}
              disabled={continueDisabled}
              loading={isSubmitting}
              fullWidth
            />

            {/* Skip — for optional steps (not review) */}
            {currentStep.optional && !isLast ? (
              <Button
                title={t('auth.q.skip')}
                variant="ghost"
                onPress={handleSkip}
                fullWidth
              />
            ) : null}

            {/* Back — hidden on first step */}
            {!isFirst ? (
              <Button
                title={t('auth.q.back')}
                variant="ghost"
                onPress={handleBack}
                fullWidth
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
