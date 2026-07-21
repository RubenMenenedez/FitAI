import { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

type WeighIn = {
  id: string;
  recordedAt: string;
  weightKg: number;
  bmi: number;
  bmiCategory: string;
};

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
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Progreso</Text>
      <TextInput placeholder="Peso (kg)" keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
      <Pressable onPress={() => recordWeighIn.mutate()}><Text>Registrar pesaje</Text></Pressable>
      <FlatList
        data={weighIns ?? []}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <Text>{item.recordedAt}: {item.weightKg} kg (IMC {item.bmi}, {item.bmiCategory})</Text>
        )}
      />
    </View>
  );
}
