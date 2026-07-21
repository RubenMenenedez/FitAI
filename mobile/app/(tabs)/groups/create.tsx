import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../src/api/client';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const create = useMutation({
    mutationFn: () => apiClient.post('/groups', { name, visibility }),
    onSuccess: ({ data }) => router.replace({ pathname: '/(tabs)/groups/[groupId]', params: { groupId: data.id } }),
  });

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <TextInput placeholder="Nombre del grupo" value={name} onChangeText={setName} />
      <Pressable onPress={() => setVisibility('private')}><Text style={{ fontWeight: visibility === 'private' ? '700' : '400' }}>Privado</Text></Pressable>
      <Pressable onPress={() => setVisibility('public')}><Text style={{ fontWeight: visibility === 'public' ? '700' : '400' }}>Público</Text></Pressable>
      <Pressable onPress={() => create.mutate()}><Text>Crear</Text></Pressable>
    </View>
  );
}
