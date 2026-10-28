import { useEffect } from 'react';
import type { LucideIconData } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import Reanimated, {
  Easing,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { TabIcon } from '@/components/navigation/TabIcon';
import { Text } from '@/components/ui/Text';
import { tokens } from '@/theme/tokens';

export interface TabBarItemProps {
  icon: LucideIconData;
  label: string;
  selected: boolean;
  testID: string;
  onPress: () => void;
  onLongPress: () => void;
}

const AnimatedText = Reanimated.createAnimatedComponent(Text);

export function TabBarItem({
  icon,
  label,
  selected,
  testID,
  onPress,
  onLongPress,
}: TabBarItemProps) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.set(
      withTiming(selected ? 1 : 0, {
        duration: tokens.motion.duration.fast,
        easing: Easing.bezier(...tokens.motion.easing.standard),
        // El color puede transicionar sin desplazamientos con reducir movimiento activo.
        reduceMotion: ReduceMotion.Never,
      }),
    );
  }, [progress, selected]);

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.get(),
      [0, 1],
      [tokens.colors.text.tertiary, tokens.colors.text.primary],
    ),
  }));

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      testID={testID}
      scale={tokens.press.scale.compact}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
    >
      <TabIcon icon={icon} progress={progress} />
      <AnimatedText
        accessible={false}
        variant="micro"
        style={[styles.label, labelStyle]}
      >
        {label}
      </AnimatedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    height: tokens.tabBar.contentHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[4],
  },
  label: { textAlign: 'center' },
});
