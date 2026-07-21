import { Tabs } from 'expo-router/js-tabs';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Hoy', tabBarLabel: 'Hoy' }}
      />
      <Tabs.Screen
        name="planner"
        options={{ title: 'Plan', tabBarLabel: 'Plan' }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progreso', tabBarLabel: 'Progreso' }}
      />
      <Tabs.Screen
        name="goals"
        options={{ title: 'Objetivos', tabBarLabel: 'Objetivos' }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: 'Grupos', tabBarLabel: 'Grupos' }}
      />
      <Tabs.Screen
        name="progress-photos"
        options={{ title: 'Fotos', tabBarLabel: 'Fotos' }}
      />
    </Tabs>
  );
}
