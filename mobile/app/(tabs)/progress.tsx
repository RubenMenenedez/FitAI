import { useState } from 'react';
import { View, FlatList } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { requestHealthPermissionsAndSync } from '../../src/health/healthSync';
import {
  Screen,
  AppText,
  Button,
  Card,
  Field,
  EmptyState,
  colors,
  spacing,
  radius,
} from '../../src/ui';

type WeighIn = {
  id: string;
  recordedAt: string;
  weightKg: number;
  bmi: number;
  bmiCategory: string;
};

function BmiChip({ category }: { category: string }) {
  const lower = category.toLowerCase();
  const bg =
    lower === 'normal'
      ? '#E9F9EF'
      : lower.includes('sobrepeso') || lower.includes('overweight')
      ? '#FFF7E6'
      : lower.includes('obesidad') || lower.includes('obese')
      ? '#FEECEC'
      : colors.surfaceAlt;
  const textColor =
    lower === 'normal'
      ? colors.successDark
      : lower.includes('sobrepeso') || lower.includes('overweight')
      ? colors.warning
      : lower.includes('obesidad') || lower.includes('obese')
      ? colors.danger
      : colors.textMuted;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        alignSelf: 'flex-start',
      }}
    >
      <AppText variant="tiny" weight="semibold" style={{ color: textColor }}>
        {category}
      </AppText>
    </View>
  );
}

export default function ProgressScreen() {
  const [weightKg, setWeightKg] = useState('');
  const queryClient = useQueryClient();

  const { data: weighIns } = useQuery({
    queryKey: ['weigh-ins'],
    queryFn: async () => (await apiClient.get('/weigh-ins')).data as WeighIn[],
  });

  const recordWeighIn = useMutation({
    mutationFn: () => apiClient.post('/weigh-ins', { weightKg: Number(weightKg) }),
    onSuccess: () => { setWeightKg(''); queryClient.invalidateQueries({ queryKey: ['weigh-ins'] }); },
  });

  return (
    <Screen title="Progreso" scroll keyboard>
      {/* Weigh-in input card */}
      <Card style={{ marginBottom: spacing.lg }}>
        <AppText variant="h3" weight="semibold" style={{ marginBottom: spacing.lg }}>
          Registrar pesaje
        </AppText>
        <Field
          label="Peso"
          placeholder="0.0"
          keyboardType="numeric"
          value={weightKg}
          onChangeText={setWeightKg}
        />
        <Button
          title="Registrar pesaje"
          variant="success"
          loading={recordWeighIn.isPending}
          onPress={() => recordWeighIn.mutate()}
        />
      </Card>

      {/* Health sync */}
      <Button
        title="Sincronizar con Salud"
        variant="secondary"
        style={{ marginBottom: spacing.xl }}
        onPress={async () => {
          try {
            await requestHealthPermissionsAndSync();
            queryClient.invalidateQueries({ queryKey: ['weigh-ins'] });
          } catch { /* native module absent in Expo Go — expected */ }
        }}
      />

      {/* Weigh-ins list */}
      <AppText variant="h3" weight="semibold" style={{ marginBottom: spacing.md }}>
        Historial
      </AppText>
      <FlatList
        data={weighIns ?? []}
        keyExtractor={(w) => w.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            title="Sin pesajes aún"
            message="Registra tu primer pesaje para comenzar a ver tu progreso."
          />
        }
        renderItem={({ item }: { item: any }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: spacing.xs }}>
                <AppText variant="h3" weight="bold">
                  {item.weightKg} kg
                </AppText>
                <AppText variant="small" tone="muted">
                  {new Date(item.recordedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </AppText>
                <AppText variant="small" tone="muted">
                  IMC {item.bmi}
                </AppText>
              </View>
              <BmiChip category={item.bmiCategory} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
