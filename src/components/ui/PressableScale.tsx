import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { tokens } from '@/theme/tokens';

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  accessibilityLabel: string;
  scale?: typeof tokens.press.scale.card | typeof tokens.press.scale.compact;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export function PressableScale({
  scale = tokens.press.scale.card,
  disabled,
  style,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  accessibilityState,
  ...props
}: PressableScaleProps) {
  const animatedScale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.get() }],
  }));

  useEffect(() => {
    if (disabled) {
      animatedScale.set(
        withTiming(1, { duration: tokens.motion.duration.fast }),
      );
    }
  }, [animatedScale, disabled]);

  function animatePress(pressed: boolean) {
    const target = pressed && !disabled && !reducedMotion ? scale : 1;
    animatedScale.set(
      reducedMotion
        ? withTiming(target, { duration: tokens.motion.duration.fast })
        : withSpring(target, tokens.motion.spring.snappy),
    );
  }

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled: Boolean(disabled),
      }}
      style={[styles.touchTarget, style, animatedStyle]}
      onPressIn={(event) => {
        animatePress(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animatePress(false);
        onPressOut?.(event);
      }}
    />
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    minHeight: tokens.accessibility.minTouchTarget,
    minWidth: tokens.accessibility.minTouchTarget,
  },
});
