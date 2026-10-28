import { useScrollToTop } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { useTabBarHeight } from '@/components/navigation/TabBar';
import { Text, type TextProps } from '@/components/ui/Text';
import { copy } from '@/copy';
import * as haptics from '@/lib/haptics';
import { tokens } from '@/theme/tokens';

const typographySamples = Object.entries(copy.catalog.samples).map(
  ([variant, sample]) => ({
    variant: variant as keyof typeof tokens.typography,
    ...sample,
  }),
);

const colorSamples = [
  { label: copy.catalog.colorNames.base, color: tokens.colors.bg.base },
  { label: copy.catalog.colorNames.card, color: tokens.colors.surface.card },
  {
    label: copy.catalog.colorNames.raised,
    color: tokens.colors.surface.raised,
  },
  {
    label: copy.catalog.colorNames.overlay,
    color: tokens.colors.surface.overlay,
  },
  {
    label: copy.catalog.colorNames.borderSubtle,
    color: tokens.colors.border.subtle,
  },
  {
    label: copy.catalog.colorNames.borderStrong,
    color: tokens.colors.border.strong,
  },
  { label: copy.catalog.colorNames.primary, color: tokens.colors.text.primary },
  {
    label: copy.catalog.colorNames.secondary,
    color: tokens.colors.text.secondary,
  },
  {
    label: copy.catalog.colorNames.tertiary,
    color: tokens.colors.text.tertiary,
  },
  {
    label: copy.catalog.colorNames.disabled,
    color: tokens.colors.text.disabled,
  },
  {
    label: copy.catalog.colorNames.accent,
    color: tokens.colors.accent.DEFAULT,
  },
  {
    label: copy.catalog.colorNames.accentMuted,
    color: tokens.colors.accent.muted,
  },
  { label: copy.catalog.colorNames.onAccent, color: tokens.colors.onAccent },
  { label: copy.catalog.colorNames.danger, color: tokens.colors.danger },
  { label: copy.catalog.colorNames.warning, color: tokens.colors.warning },
];

const textTones = Object.entries(copy.catalog.toneNames).map(
  ([tone, label]) => ({
    tone: tone as NonNullable<TextProps['tone']>,
    label,
  }),
);

const hapticActions = [
  { label: copy.catalog.hapticActions.selection, action: haptics.selection },
  { label: copy.catalog.hapticActions.setLogged, action: haptics.setLogged },
  {
    label: copy.catalog.hapticActions.restWarning,
    action: haptics.restWarning,
  },
  { label: copy.catalog.hapticActions.success, action: haptics.success },
  { label: copy.catalog.hapticActions.warning, action: haptics.warning },
];

export default function ProfileScreen() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  useScrollToTop(scrollRef);

  return (
    <View className="flex-1 bg-base" style={{ paddingTop: insets.top }}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: tokens.spacing[24],
            paddingBottom: tabBarHeight + tokens.spacing[24],
          },
        ]}
      >
        <View style={styles.heading}>
          <Text variant="display" accessibilityRole="header">
            {copy.catalog.title}
          </Text>
          <Text variant="callout" tone="secondary">
            {copy.catalog.subtitle}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="title" accessibilityRole="header">
            {copy.catalog.typography}
          </Text>
          {typographySamples.map((sample) => (
            <View key={sample.variant} style={styles.sample}>
              <Text variant="micro" tone="tertiary">
                {sample.label}
              </Text>
              <Text variant={sample.variant}>{sample.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="title" accessibilityRole="header">
            {copy.catalog.palette}
          </Text>
          {colorSamples.map((sample) => (
            <View key={sample.label} style={styles.colorRow}>
              <View
                accessible={false}
                style={[styles.swatch, { backgroundColor: sample.color }]}
              />
              <View style={styles.colorDescription}>
                <Text variant="callout">{sample.label}</Text>
                <Text variant="micro" tone="tertiary">
                  {sample.color}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="title" accessibilityRole="header">
            {copy.catalog.tones}
          </Text>
          {textTones.map(({ tone, label }) => (
            <View key={tone} style={styles.heading}>
              <Text variant="micro" tone="tertiary">
                {label}
              </Text>
              <View
                style={[
                  styles.toneSample,
                  tone === 'onAccent' && styles.accent,
                ]}
              >
                <Text
                  tone={tone}
                  importantForAccessibility={
                    tone === 'disabled' ? 'no' : 'auto'
                  }
                >
                  {copy.catalog.toneSample}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="title" accessibilityRole="header">
            {copy.catalog.interaction}
          </Text>
          <Text variant="callout" tone="secondary">
            {copy.catalog.reducedMotion}
          </Text>
          <PressableScale
            accessibilityLabel={copy.catalog.cardPress}
            onPress={() => {
              void haptics.selection(hapticsEnabled);
            }}
            style={styles.pressCard}
          >
            <Text variant="headline">{copy.catalog.cardPress}</Text>
            <Text variant="callout" tone="secondary">
              {copy.catalog.cardPressHint}
            </Text>
          </PressableScale>
          <PressableScale
            scale={tokens.press.scale.compact}
            accessibilityLabel={copy.catalog.compactPress}
            onPress={() => {
              void haptics.selection(hapticsEnabled);
            }}
            style={styles.pressButton}
          >
            <Text variant="callout">{copy.catalog.compactPress}</Text>
            <Text variant="micro" tone="tertiary">
              {copy.catalog.compactPressHint}
            </Text>
          </PressableScale>
          <PressableScale
            disabled
            accessibilityLabel={copy.catalog.disabledPress}
            style={styles.pressButton}
          >
            <Text tone="disabled">{copy.catalog.disabledPress}</Text>
          </PressableScale>
        </View>

        <View style={styles.section}>
          <Text variant="title" accessibilityRole="header">
            {copy.catalog.haptics}
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {hapticsEnabled
                ? copy.catalog.hapticsEnabled
                : copy.catalog.hapticsDisabled}
            </Text>
            <Switch
              accessibilityRole="switch"
              accessibilityLabel={copy.catalog.haptics}
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{
                false: tokens.colors.border.strong,
                true: tokens.colors.text.secondary,
              }}
              thumbColor={tokens.colors.text.primary}
              style={styles.switch}
            />
          </View>
          <Text variant="callout" tone="secondary">
            {copy.catalog.hapticsHint}
          </Text>
          {hapticActions.map(({ label, action }) => (
            <PressableScale
              key={label}
              scale={tokens.press.scale.compact}
              accessibilityLabel={label}
              onPress={() => {
                void action(hapticsEnabled);
              }}
              style={styles.pressButton}
            >
              <Text variant="callout">{label}</Text>
            </PressableScale>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: tokens.spacing[20], gap: tokens.spacing[32] },
  heading: { gap: tokens.spacing[8] },
  section: { gap: tokens.spacing[12] },
  sample: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radii.card,
    padding: tokens.spacing[16],
    gap: tokens.spacing[8],
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[16],
  },
  swatch: {
    width: tokens.spacing[40],
    height: tokens.spacing[40],
    borderRadius: tokens.radii.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border.strong,
  },
  colorDescription: { flex: 1, gap: tokens.spacing[4] },
  toneSample: { padding: tokens.spacing[12], borderRadius: tokens.radii.chip },
  accent: { backgroundColor: tokens.colors.accent.DEFAULT },
  pressCard: {
    backgroundColor: tokens.colors.surface.card,
    borderColor: tokens.colors.border.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radii.card,
    padding: tokens.spacing[16],
    gap: tokens.spacing[8],
  },
  pressButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface.raised,
    borderRadius: tokens.radii.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.colors.border.strong,
    paddingHorizontal: tokens.spacing[20],
    paddingVertical: tokens.spacing[12],
    gap: tokens.spacing[4],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[12],
  },
  switchLabel: { flex: 1 },
  switch: {
    minHeight: tokens.accessibility.minTouchTarget,
    minWidth: tokens.accessibility.minTouchTarget,
  },
});
