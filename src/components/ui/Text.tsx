import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from 'react-native';

import { tokens } from '@/theme/tokens';

export interface TextProps extends Omit<
  NativeTextProps,
  'allowFontScaling' | 'maxFontSizeMultiplier'
> {
  variant?: keyof typeof tokens.typography;
  tone?: keyof typeof tokens.colors.text | 'accent' | 'danger' | 'onAccent';
}

const tones = {
  ...tokens.colors.text,
  accent: tokens.colors.accent.DEFAULT,
  danger: tokens.colors.danger,
  onAccent: tokens.colors.onAccent,
};

export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  ...props
}: TextProps) {
  const typography = tokens.typography[variant];
  const isData = 'fontVariant' in typography;
  const fontVariant = isData ? [...typography.fontVariant] : undefined;

  return (
    <NativeText
      {...props}
      allowFontScaling
      maxFontSizeMultiplier={
        isData ? tokens.fontScale.data : tokens.fontScale.text
      }
      style={[{ ...typography, fontVariant, color: tones[tone] }, style]}
    />
  );
}
