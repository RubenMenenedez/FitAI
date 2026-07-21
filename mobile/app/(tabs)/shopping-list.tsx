import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';

export default function ShoppingListScreen() {
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId: string }>();
  const { data } = useQuery({
    queryKey: ['shopping-list', mealPlanId],
    queryFn: async () => (await apiClient.get(`/shopping-list/${mealPlanId}`)).data,
    enabled: !!mealPlanId,
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Lista de compra</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(i: any) => i.foodItemId}
        renderItem={({ item }: any) => (
          <View style={{ marginVertical: 8 }}>
            <Text>{item.foodName} — {Math.round(item.neededGrams)}g necesarios</Text>
            {item.suggestedPackage
              ? <Text>Comprar: {item.suggestedPackage.productNameRaw} (${item.suggestedPackage.price})</Text>
              : <Text style={{ color: 'gray' }}>Precio no disponible hoy</Text>}
          </View>
        )}
      />
    </View>
  );
}
