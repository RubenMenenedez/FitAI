import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthProvider';

export default function DashboardScreen() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get('/users/me')).data,
  });

  const { signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);

  function handleSignOut() {
    setError(null);
    signOut().catch(() => {
      setError('No se pudo cerrar sesión. Inténtalo de nuevo.');
    });
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Hoy</Text>
      <Text>Calorías objetivo: {user?.dailyCalorieTarget ?? '—'} kcal</Text>
      <Text>Proteína: {user?.dailyProteinTargetG ?? '—'} g</Text>
      <Text>Carbohidratos: {user?.dailyCarbsTargetG ?? '—'} g</Text>
      <Text>Grasa: {user?.dailyFatTargetG ?? '—'} g</Text>
      {error ? <Text style={{ color: '#c0392b', marginTop: 8 }}>{error}</Text> : null}
      <Pressable
        onPress={handleSignOut}
        style={{ marginTop: 24, alignSelf: 'flex-start' }}
      >
        <Text style={{ color: '#555' }}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}
