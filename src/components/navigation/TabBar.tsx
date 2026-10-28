import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { LucideIconData } from 'lucide-react-native';
import {
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { TabBarItem } from '@/components/navigation/TabBarItem';
import { selection } from '@/lib/haptics';
import { tokens } from '@/theme/tokens';

export const TAB_BAR_CONTENT_HEIGHT = tokens.tabBar.contentHeight;

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return (
    TAB_BAR_CONTENT_HEIGHT +
    Math.max(insets.bottom, tokens.tabBar.minBottomInset)
  );
}

export interface TabBarProps extends BottomTabBarProps {
  icons: Readonly<Record<string, LucideIconData>>;
  hapticsEnabled: boolean;
}

export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  icons,
  hapticsEnabled,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const height = useTabBarHeight();
  const reducedMotion = useReducedMotion();
  const itemWidth = useSharedValue(0);
  const selectedIndex = state.index;

  const indicatorStyle = useAnimatedStyle(() => {
    const width = itemWidth.get();
    const target =
      selectedIndex * width + width / 2 - tokens.tabBar.indicatorSize / 2;
    return {
      opacity: width > 0 ? 1 : 0,
      transform: [
        {
          translateX: reducedMotion
            ? target
            : withSpring(target, tokens.motion.spring.snappy),
        },
      ],
    };
  });

  function measureItems(event: LayoutChangeEvent) {
    itemWidth.set(event.nativeEvent.layout.width / state.routes.length);
  }

  return (
    <View testID="tab-bar" style={[styles.container, { height }]}>
      {Platform.OS === 'ios' ? (
        <>
          <BlurView
            pointerEvents="none"
            tint="dark"
            intensity={tokens.tabBar.blurIntensity}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.iosBackground]}
          />
        </>
      ) : (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.androidBackground]}
        />
      )}
      <View
        onLayout={measureItems}
        style={[
          styles.items,
          { marginLeft: insets.left, marginRight: insets.right },
        ]}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const Icon = icons[route.name];
          if (!descriptor || !Icon) return null;
          const label =
            descriptor.options.tabBarAccessibilityLabel ??
            descriptor.options.title ??
            route.name;
          const selected = state.index === index;
          return (
            <TabBarItem
              key={route.key}
              icon={Icon}
              label={label}
              selected={selected}
              testID={`tab-${route.name}`}
              onPress={() => {
                const event = emitter.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented) {
                  void selection(hapticsEnabled);
                  navigateToTab(route.key);
                }
              }}
              onLongPress={() => {
                emitter.emit({ type: 'tabLongPress', target: route.key });
              }}
            />
          );
        })}
        <Reanimated.View
          pointerEvents="none"
          accessible={false}
          testID="tab-indicator"
          style={[styles.indicator, indicatorStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border.subtle,
  },
  items: { flexDirection: 'row', height: TAB_BAR_CONTENT_HEIGHT },
  iosBackground: { backgroundColor: tokens.tabBar.background.ios },
  androidBackground: { backgroundColor: tokens.tabBar.background.android },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: tokens.tabBar.indicatorSize,
    height: tokens.tabBar.indicatorSize,
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.accent.DEFAULT,
  },
});
