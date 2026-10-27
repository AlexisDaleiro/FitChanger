import { Tabs } from 'expo-router';

import { copy } from '@/copy';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.tabs.today,
          tabBarAccessibilityLabel: copy.tabs.today,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: copy.tabs.skills,
          tabBarAccessibilityLabel: copy.tabs.skills,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: copy.tabs.history,
          tabBarAccessibilityLabel: copy.tabs.history,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: copy.tabs.profile,
          tabBarAccessibilityLabel: copy.tabs.profile,
        }}
      />
    </Tabs>
  );
}
