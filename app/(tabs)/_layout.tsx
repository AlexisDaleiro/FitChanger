import { Tabs } from 'expo-router';
import { __iconData as CircleUser } from 'lucide-react-native/icons/circle-user';
import { __iconData as Flame } from 'lucide-react-native/icons/flame';
import { __iconData as Network } from 'lucide-react-native/icons/network';
import { __iconData as History } from 'lucide-react-native/icons/rotate-ccw-clock';
import { useReducedMotion } from 'react-native-reanimated';

import { TabBar } from '@/components/navigation/TabBar';
import { copy } from '@/copy';
import { tokens } from '@/theme/tokens';

const icons = {
  index: Flame,
  skills: Network,
  history: History,
  profile: CircleUser,
};

export default function TabsLayout() {
  const reducedMotion = useReducedMotion();

  return (
    <Tabs
      // SPEC-GAP: No existe un ajuste global de haptics; la barra recibe true hasta definirlo.
      tabBar={(props) => <TabBar {...props} icons={icons} hapticsEnabled />}
      screenOptions={{
        animation: 'fade',
        lazy: true,
        freezeOnBlur: true,
        headerShown: false,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: reducedMotion
              ? tokens.motion.duration.fast
              : tokens.motion.duration.base,
          },
        },
      }}
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
