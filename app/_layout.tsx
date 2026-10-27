import '../global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { expo } from '../app.json';

// SPEC-GAP: La paleta de navegación predeterminada es provisional hasta las Tareas 2 y 3.
const scaffoldTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: expo.backgroundColor,
    card: expo.backgroundColor,
  },
};

// SPEC-GAP: La spec no define android.package; com.fitchanger.app es el identificador provisional en app.json.
// SPEC-GAP: SDK 58 ignora edgeToEdgeEnabled (Android 16 lo exige); app.json conserva el campo requerido por Tarea 1.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={scaffoldTheme}>
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
