import { View, Text, FlatList, Pressable } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
