import '../global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { tokens } from '@/theme/tokens';

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: tokens.colors.text.primary,
    background: tokens.colors.bg.base,
    card: tokens.colors.bg.base,
    text: tokens.colors.text.primary,
    border: tokens.colors.border.subtle,
    notification: tokens.colors.danger,
  },
  fonts: {
    regular: {
      ...DarkTheme.fonts.regular,
      fontFamily: tokens.fontFamily.regular,
    },
    medium: { ...DarkTheme.fonts.medium, fontFamily: tokens.fontFamily.medium },
    bold: { ...DarkTheme.fonts.bold, fontFamily: tokens.fontFamily.semibold },
    heavy: {
      ...DarkTheme.fonts.heavy,
      fontFamily: tokens.fontFamily.displayBold,
    },
  },
};

// SPEC-GAP: La spec no define android.package; com.fitchanger.app es el identificador provisional en app.json.
// SPEC-GAP: SDK 58 ignora edgeToEdgeEnabled (Android 16 lo exige); app.json conserva el campo requerido por Tarea 1.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={appTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout"
            options={{ presentation: 'card', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
