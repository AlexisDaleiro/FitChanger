# CODEX_INSTRUCTIONS.md — Reglas del proyecto FitChanger

Eres el ingeniero que implementa FitChanger: app móvil de calistenia (skill trees + registro de rutinas "glanceable"), React Native + Expo, estética OLED minimalista, 60/120 FPS.

**Antes de cualquier tarea, lee `docs/SPEC.md`.** Es la fuente de verdad de tokens, tipos, máquina de estados, timer y algoritmo de progresión. No inventes valores, nombres de tipos ni estados que no estén ahí. Si una tarea exige algo que la spec no define, implementa la opción más simple, márcala con `// SPEC-GAP: <descripción>` y menciónala en el resumen de la tarea.

---

## 1. Reglas no negociables

1. TypeScript `strict` + `noUncheckedIndexedAccess`. Prohibido `any`, `@ts-ignore` y `as unknown as`. `@ts-expect-error` solo con comentario que explique el motivo.
2. Los tipos de dominio solo existen en `src/types/domain.ts`. No redeclarar ni duplicar.
3. Ningún HEX, tamaño de fuente, radio, spring o duración literal fuera de `src/theme/tokens.ts`.
4. Lógica de negocio pura (sin React, sin `Date.now()`, sin I/O) en `features/*/*.ts`; los componentes solo leen estado y envían eventos.
5. No añadir dependencias fuera del stack de `docs/SPEC.md §0` sin pedirlo primero.
6. Instalar paquetes nativos siempre con `npx expo install <pkg>` (versiones compatibles con el SDK).
7. Copy de UI en español, centralizado en `src/copy.ts`. Identificadores en inglés.
8. Nunca bloquear un workout en curso (por red, entitlements o errores de sync).

## 2. Arquitectura de carpetas

```
app/                                  # Solo rutas (Expo Router). Archivos finos: componen, no calculan.
  _layout.tsx                         # Fuentes, providers, StatusBar, effects, <Stack/> + <RestTimerPill/>
  (tabs)/
    _layout.tsx                       # <Tabs tabBar={...}/> con screenOptions de SPEC §1.5
    index.tsx                         # Hoy
    skills/
      _layout.tsx                     # Stack interno
      index.tsx                       # Lista de árboles
      [treeId].tsx                    # Árbol
    history.tsx
    profile.tsx
  workout.tsx                         # Sesión activa: presentation 'card', animation 'slide_from_bottom'
src/
  types/domain.ts                     # Todos los tipos de dominio (SPEC §2)
  theme/tokens.ts                     # Todos los tokens (SPEC §1)
  copy.ts                             # Strings de UI
  components/
    ui/                               # Text, PressableScale, Button, Sheet, Chip
    navigation/TabBar.tsx
    workout/                          # ExerciseCard, SetChip, SetEditorSheet, RestTimerPill, SessionHeader
    skills/                           # SkillNodeCard, TreeView
  features/
    workout/                          # machine.ts, machine.test.ts, store.ts, effects.ts, selectors.ts, format.ts, format.test.ts, createSession.ts
    progression/                      # progression.ts, progression.test.ts
    skills/                           # tree.ts, store.ts
    entitlements/                     # entitlements.ts, store.ts, revenuecat.ts
    history/                          # store.ts
  lib/
    storage.ts                        # Instancia MMKV + adaptador StateStorage para zustand/persist
    haptics.ts                        # Único wrapper de expo-haptics
    notifications.ts                  # Programar/cancelar 'rest-timer', canal Android
  data/seed.ts                        # SPEC §3.4
assets/fonts/                         # Inter / Inter Display .otf
```

Reglas:
- Un componente por archivo, archivo con el nombre del componente (`ExerciseCard.tsx`). Módulos no-componente en camelCase (`machine.ts`).
- Named exports. Único default export permitido: archivos de ruta en `app/`.
- Sin barrel files (`index.ts` que re-exporta).
- Imports absolutos con alias `@/` → `src/`.
- Tests junto al archivo que prueban (`machine.test.ts` al lado de `machine.ts`).
- No crear carpetas ni capas (services/, repositories/, hooks/ genérico) sin necesidad real en la tarea actual.

## 3. Convenciones de código

- Componentes: funciones, props tipadas con `interface XProps`. Sin `React.FC`.
- Hooks propios con prefijo `use`, solo cuando encapsulan estado o suscripciones reales.
- Uniones discriminadas + `switch` exhaustivo con `assertNever(x: never)` para estados y eventos.
- Inmutabilidad con structural sharing manual (spread solo en la ruta modificada). Sin Immer.
- Sin comentarios que repitan el código. Comentar solo el *porqué* no obvio.
- Errores: las funciones puras no lanzan para casos de dominio esperados (devuelven el mismo estado). `try/catch` solo en I/O (MMKV, RevenueCat, notificaciones) y con log.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`). Una tarea del checklist = un commit como mínimo.

## 4. Reglas de rendimiento (objetivo: 0 frames perdidos a 120 Hz)

**Render**
1. React Compiler activado (`experiments.reactCompiler: true`). Por eso **no** escribir `useMemo`, `useCallback` ni `React.memo` a mano, salvo con comentario `// perf: <medición>` que lo justifique. El código debe ser compatible con el compilador: sin mutar props/estado durante el render, sin leer refs en render, reglas de hooks estrictas (`eslint-plugin-react-hooks` en modo recomendado sin warnings).
2. Zustand: selectores atómicos siempre. `useWorkoutStore((s) => s.state.status)`, nunca `useWorkoutStore()` ni desestructurar el store completo. Varios campos → `useShallow`.
3. Las cards reciben `entryId` y seleccionan su propio entry: `useWorkoutStore((s) => selectEntry(s.state, entryId))`. Gracias al structural sharing del reducer, solo re-renderiza la card cuyo entry cambió.
4. Nada que cambie cada segundo vive en un componente padre. Los relojes (`SessionHeader`, `RestTimerPill`) tienen su propio tick local.
5. `setInterval`/`setTimeout` en JS con periodo < 1000 ms: prohibidos. Lo continuo va por Reanimated.

**Animación**
6. Toda animación por Reanimated (`useSharedValue`, `useAnimatedStyle`, `useAnimatedProps`, layout animations). Prohibido `Animated` de RN, `LayoutAnimation` y animar con `setState`.
7. Nunca leer `sharedValue.value` durante el render de React. Para pasar datos UI → JS: `runOnJS`/`scheduleOnRN` solo en eventos puntuales, nunca por frame.
8. NativeWind solo para estilos estáticos. Prohibidas las clases `transition-*`/`animate-*` de NativeWind. Estilo animado = prop `style` con `useAnimatedStyle`.
9. Respetar `useReducedMotion()` (SPEC §1.3).

**Listas e imágenes**
10. Listas de longitud variable (historial, ejercicios de biblioteca): `FlashList`. Listas cortas y acotadas (≤ 12 cards del workout): `ScrollView`.
11. Imágenes: `expo-image` con `cachePolicy="memory-disk"`.

**Plataforma**
12. iOS ProMotion: `ios.infoPlist.CADisableMinimumFrameDurationOnPhone = true` en `app.json`. Sin esto, iOS limita a 60 Hz.
13. Tabs con `lazy: true` y `freezeOnBlur: true`.
14. Verificar rendimiento en **build de release** (`npx expo run:android --variant release`), nunca juzgar FPS en debug. Usar el Perf Monitor (UI y JS ≥ 115 FPS en dispositivo 120 Hz durante scroll y animación del timer).

## 5. Estado y persistencia

- Un store Zustand por feature (`features/<x>/store.ts`). Sin store global único, sin Context para estado que cambia.
- Persistencia con `zustand/middleware` `persist` + `createJSONStorage(() => mmkvStateStorage)` de `src/lib/storage.ts`. Cada store con `name` versionado (`workout-v1`) y `version` + `migrate` cuando cambie la forma.
- Efectos secundarios del workout solo en `features/workout/effects.ts` (SPEC §3.1). Componentes y reducer no llaman haptics ni notificaciones del workout directamente. Excepción: haptics de UI pura (tab, stepper) en el componente vía `src/lib/haptics.ts`.
- IDs con `randomUUID()` de `expo-crypto`, generados fuera del reducer.

## 6. Reglas de UI

- Fondo `#000000` en todas las pantallas, `app.json` `backgroundColor` y `userInterfaceStyle: "dark"` (sin flash blanco al arrancar).
- Usar siempre `<Text variant tone>` de `src/components/ui/Text.tsx`.
- Área táctil mínima 44 × 44 pt (`hitSlop` si el visual es más pequeño).
- Todo elemento interactivo con `accessibilityRole` y `accessibilityLabel` en español.
- Safe areas con `react-native-safe-area-context` (`useSafeAreaInsets`), nunca alturas fijas de notch.
- Pantallas dentro de tabs: `paddingBottom: useTabBarHeight() + 24`.

## 7. Verificación obligatoria antes de dar una tarea por terminada

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

```bash
npx jest
```

Los tres sin errores ni warnings nuevos. Si una tarea toca UI, describe en el resumen qué probaste en el dispositivo/emulador. No declares "hecho" si algo de esto falla: informa el fallo con el mensaje exacto.

---

## 8. Checklist de arranque (en orden; no empezar una tarea sin cerrar la anterior)

### Tarea 1 — Scaffolding

1. Crear proyecto Expo con template `blank-typescript` en una carpeta temporal y mover su contenido a la raíz del repo (la raíz ya contiene `docs/`, `AGENTS.md` y este archivo; no borrarlos).
2. Instalar con `npx expo install`: `expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar expo-system-ui react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics expo-blur expo-font expo-notifications expo-dev-client expo-crypto expo-image react-native-svg @shopify/flash-list react-native-mmkv`.
3. Instalar con npm: `zustand lucide-react-native nativewind`; dev: `tailwindcss@^3.4 prettier prettier-plugin-tailwindcss jest jest-expo @types/jest`.
4. Configurar: `package.json` `"main": "expo-router/entry"`; `babel.config.js` con `babel-preset-expo` (`jsxImportSource: 'nativewind'`) + `nativewind/babel` (el plugin de worklets lo añade `babel-preset-expo`; no duplicarlo); `metro.config.js` con `withNativeWind(config, { input: './global.css' })`; `global.css`; `nativewind-env.d.ts`; `tsconfig.json` con `strict`, `noUncheckedIndexedAccess`, `paths: { "@/*": ["./src/*"] }`; jest con preset `jest-expo`.
5. `app.json`: `name: "FitChanger"`, `scheme: "fitchanger"`, `userInterfaceStyle: "dark"`, `backgroundColor: "#000000"`, `ios.infoPlist.CADisableMinimumFrameDurationOnPhone: true`, `android.edgeToEdgeEnabled: true`, `experiments: { typedRoutes: true, reactCompiler: true }`, plugins `expo-router`, `expo-notifications`.
6. `eas.json` con perfil `development` (`developmentClient: true`, `distribution: "internal"`).
7. Crear la estructura de carpetas de §2 solo con los archivos que esta tarea necesita: rutas de `(tabs)` con un placeholder `<Text>` y `app/workout.tsx` vacío.
8. Copiar `src/types/domain.ts` literalmente de SPEC §2.

**Criterios de aceptación:** `tsc`, `lint` y `jest --passWithNoTests` pasan. `npx expo run:android` abre la app con fondo negro y 4 tabs por defecto navegables. Commit `chore: scaffold expo app`.

### Tarea 2 — Design tokens, fuentes y primitivas

1. `src/theme/tokens.ts` con colores, tipografía, espaciado, radios, motion y press de SPEC §1.1–1.3, exportados `as const`.
2. `tailwind.config.js` importa `tokens.ts` (colores, spacing, radios, fontFamily). Nombres de clase: `bg-base`, `bg-card`, `bg-raised`, `bg-overlay`, `border-subtle`, `border-strong`, `text-primary`, `text-secondary`, `text-tertiary`, `text-disabled`, `bg-accent`, `text-accent`, `text-danger`.
3. Descargar Inter v4 (release oficial de rsms/inter), copiar los 5 `.otf` de SPEC §1.2 a `assets/fonts/`, verificar que el nombre de archivo = PostScript name, y registrarlos con el config plugin de `expo-font` en `app.json`.
4. `src/components/ui/Text.tsx`: props `variant` (tokens tipográficos) y `tone` (`primary | secondary | tertiary | disabled | accent | danger | onAccent`). Variants `data.*` con `tabular-nums` y `maxFontSizeMultiplier` 1.3.
5. `src/components/ui/PressableScale.tsx`: `Pressable` + Reanimated, escala configurable (0.97 / 0.92), `spring.snappy`, respeta reduced motion.
6. `src/lib/haptics.ts` con las funciones de SPEC §1.3 (`selection`, `setLogged`, `restWarning`, `success`, `warning`), no-op si `hapticsEnabled` es false.
7. Pantalla temporal `app/(tabs)/profile.tsx` que muestre todas las variantes de `Text` y la paleta (sirve de catálogo visual).

**Criterios de aceptación:** cero literales de color fuera de `tokens.ts` (`grep -rE "#[0-9A-Fa-f]{6}" app src --include=*.tsx` vacío). Fuentes visibles en Android sin carga en runtime. Commit `feat: design tokens and ui primitives`.

### Tarea 3 — Tab Bar

1. `src/components/navigation/TabBar.tsx` exactamente como SPEC §1.5 (blur iOS / sólido Android, punto indicador con spring, colores con `interpolateColor`, escala al presionar, haptic solo al cambiar).
2. `useTabBarHeight()` exportado desde el mismo archivo.
3. `app/(tabs)/_layout.tsx` con los 4 tabs, iconos lucide y `screenOptions` de SPEC §1.5.
4. Cada pantalla de tab: `ScrollView` con `useScrollToTop(ref)`, `paddingBottom: useTabBarHeight() + 24`, título `display`.

**Criterios de aceptación:** el indicador se desplaza sin saltos a 120 Hz en release; el cambio de tab no re-renderiza las otras pantallas (verificar con React DevTools "Highlight updates"); TalkBack/VoiceOver anuncia "tab, seleccionado". Commit `feat: custom tab bar`.

### Tarea 4 — Estado del workout (lógica pura primero)

1. `src/data/seed.ts` con los 3 árboles y la rutina de SPEC §3.4.
2. `features/workout/createSession.ts`: `createSessionFromRoutine(routine, exercises, now, newId)` → `WorkoutSession` (sets `pending`, `restPrescribedSec` según `restDurationSecAfter`).
3. `features/workout/machine.ts`: `workoutReducer` + derivados (`nextPendingSet`, `restDurationSecAfter`, `elapsedMs`) según SPEC §3.1.
4. `features/workout/machine.test.ts`: una prueba por fila de la tabla de transiciones + las 5 invariantes.
5. `features/workout/format.ts` + `format.test.ts` (tabla de formato de SPEC §1.4).
6. `src/lib/storage.ts` (MMKV + adaptador) y `features/workout/store.ts` (Zustand + persist `workout-v1`, `send` inyecta `now`).
7. `src/lib/notifications.ts` + `features/workout/effects.ts` (SPEC §3.1 tabla de efectos y §3.2 background), registrado en `app/_layout.tsx`.
8. `features/progression/progression.ts` + `progression.test.ts` (los 8 casos de SPEC §3.3) y `features/skills/tree.ts`.

**Criterios de aceptación:** `npx jest` en verde con todos los casos listados; ningún archivo de `features/*/*.ts` (excepto `store.ts` y `effects.ts`) importa React, Zustand o módulos Expo. Commit `feat: workout state machine and progression engine`.

### Tarea 5 — Pantallas

1. **Hoy** (`app/(tabs)/index.tsx`): título "Hoy", card de la rutina semilla (nombre, nº de ejercicios, duración estimada = Σ sets × (40 s por serie + descanso)) y CTA primario `accent` "Empezar". Si hay sesión activa, el CTA es "Continuar" y lleva a `/workout` sin crear otra.
2. **Workout** (`app/workout.tsx`): `SessionHeader` (tiempo transcurrido `data.lg` con tick local 1 Hz, botón pausa/reanudar, botón "Terminar" con confirmación si quedan series), lista de `ExerciseCard` (SPEC §1.4) con scroll automático a la card activa, `SetEditorSheet`. Al completar: resumen (duración, series completadas, sugerencias de progresión con botón "Avanzar a …").
3. **RestTimerPill** global (SPEC §3.2) montado en `app/_layout.tsx`.
4. **Skills** (`app/(tabs)/skills/index.tsx` y `[treeId].tsx`): lista de árboles con `nivel x/y`; vista de árbol por filas de `tier` y columnas de `lane`, nodos con su `SkillNodeStatus` (mastered = fondo `text.primary`, current = borde `accent`, unlocked = borde `border.strong`, locked = `text.disabled` + candado). Árbol Pro con candado; al tocarlo, `presentPaywallIfNeeded` (stub con `console.warn` hasta integrar RevenueCat).

**Criterios de aceptación (manual en dispositivo, release build):**
- Registrar una serie = 1 tap; el pill aparece con el descanso correcto.
- Cambiar de tab durante el descanso: el pill sigue visible y el tiempo no se reinicia.
- Bloquear el teléfono 2 min durante un descanso de 90 s: llega la notificación; al volver, el estado ya es `EXERCISE_ACTIVE`.
- Matar la app a mitad del workout y reabrir: misma sesión, mismas series, mismo descanso restante.
- Pausar 30 s: el tiempo de sesión y el descanso no avanzan.
- Scroll de la lista de cards y animación del anillo a ≥ 115 FPS (Perf Monitor).

Commit `feat: today, workout and skills screens`.

---

Después de la Tarea 5 (no antes): integración real de RevenueCat (SPEC §2.1), historial y Supabase (Fase 2).
