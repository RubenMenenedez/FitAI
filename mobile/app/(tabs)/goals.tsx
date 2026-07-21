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
