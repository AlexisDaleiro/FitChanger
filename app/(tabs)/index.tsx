import { useScrollToTop } from 'expo-router';
import { type ComponentRef, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarHeight } from '@/components/navigation/TabBar';
import { Text } from '@/components/ui/Text';
import { copy } from '@/copy';
import { tokens } from '@/theme/tokens';

export default function TodayScreen() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  useScrollToTop(scrollRef);

  return (
    <View className="flex-1 bg-base" style={{ paddingTop: insets.top }}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingTop: tokens.spacing[24],
          paddingHorizontal: tokens.spacing[20],
          paddingBottom: tabBarHeight + tokens.spacing[24],
        }}
      >
        <Text variant="display" accessibilityRole="header">
          {copy.tabs.today}
        </Text>
      </ScrollView>
    </View>
  );
}
