# FitChanger — Especificación técnica oficial v1

Fuente de verdad del proyecto. Si el código contradice este documento, el documento gana hasta que se actualice explícitamente en el mismo commit que el código.

Idioma: identificadores de código en inglés, copy de UI en español, documentación en español.

---

## 0. Stack (decisión cerrada)

| Capa | Elección | Motivo |
|---|---|---|
| Runtime | Expo SDK estable más reciente, New Architecture (Fabric + TurboModules) | Default de Expo; requisito de Reanimated 4 y MMKV. |
| Navegación | Expo Router (file-based, sobre React Navigation 7) | Rutas tipadas, deep links gratis. |
| Animación | **Reanimated 4** + `react-native-worklets` | Reanimated 3 solo recibe mantenimiento para la arquitectura legacy. La API (`useSharedValue`, `useAnimatedStyle`, `withSpring`) es la misma; todo corre en el UI thread → 120 FPS. |
| Gestos | `react-native-gesture-handler` | Gestos en UI thread. |
| Estilos | NativeWind ≥ 4.2 (Tailwind 3.4) solo para estilos **estáticos** | Velocidad de codificación. Los estilos animados van siempre por Reanimated. |
| Estado | Zustand + `persist` sobre `react-native-mmkv` | Lectura/escritura síncrona, selectores atómicos, sin Provider. |
| Listas | `@shopify/flash-list` v2 | Reciclado de celdas. |
| Haptics | `expo-haptics` | |
| Blur | `expo-blur` (solo iOS) | Blur en Android es caro; Android usa fondo sólido. |
| Notificaciones locales | `expo-notifications` | Fin de descanso con la app en background. |
| IDs | `expo-crypto` → `randomUUID()` | UUID v4 generados en cliente (offline-first). |
| Suscripción | `react-native-purchases` + `react-native-purchases-ui` (RevenueCat) | Entitlement único `pro`. |
| Backend | Supabase (Auth + Postgres) | **Fase 2.** El MVP es local-first; el esquema de sync se define cuando llegue. |
| Iconos | `lucide-react-native` + `react-native-svg` | Trazo fino, consistente. |
| Tests | `jest-expo` | Solo lógica pura (máquina de estados, progresión, formato). |
| Compilador | React Compiler activado | Memoización automática (ver CODEX_INSTRUCTIONS §4). |

Descartado: XState (un reducer puro con unión discriminada cubre 5 estados), Redux, styled-components, Lottie, librerías de bottom sheet.

Desarrollo: MMKV y RevenueCat **no corren en Expo Go** → development build desde el día 1. En Windows: Android local con `npx expo run:android`; iOS solo con `eas build --profile development --platform ios`.

---

## 1. Sistema de diseño

Todos los valores viven en `src/theme/tokens.ts`. `tailwind.config.js` importa ese archivo; ningún componente escribe un HEX, un tamaño de fuente o un spring literal.

### 1.1 Color

| Token | HEX | Uso | Contraste sobre `surface.card` |
|---|---|---|---|
| `bg.base` | `#000000` | Fondo de toda pantalla, status bar, nav bar Android | — |
| `surface.card` | `#0E0E0E` | Cards de ejercicio, filas de historial | — |
| `surface.raised` | `#161616` | Sheets, pill del timer, estado pressed de card | — |
| `surface.overlay` | `#1E1E1E` | Inputs, steppers, segmentados | — |
| `border.subtle` | `#1C1C1C` | Borde hairline de cards, divisores | — |
| `border.strong` | `#2C2C2C` | Card activa, chip pendiente, borde del pill | — |
| `text.primary` | `#F2F2F2` | Títulos, valores numéricos | ≈17:1 |
| `text.secondary` | `#B3B3B3` | Subtítulos, unidades | ≈9:1 |
| `text.tertiary` | `#8A8A8A` | Micro-labels, iconos inactivos | ≈5.6:1 (AA texto pequeño) |
| `text.disabled` | `#4D4D4D` | Solo decorativo / deshabilitado (exento de contraste) | — |
| `accent` | `#D7FF3F` | "Lo que toca ahora" (ver reglas) | ≈17:1 |
| `accent.muted` | `#1A1F08` | Fondo de badges "Cerca" / "Avanzar" (accent al 12% sobre negro) | — |
| `onAccent` | `#000000` | Texto/iconos sobre `accent` | — |
| `danger` | `#FF453A` | Serie fallida, descartar sesión | ≈5.5:1 |
| `warning` | `#FFB340` | Sugerencia de regresión | — |

Reglas de color:
1. `#000000` puro de fondo siempre. Texto nunca `#FFFFFF` (evita halo/smearing en OLED).
2. `accent` solo marca: la serie siguiente, el progreso del timer de descanso, el indicador de tab activo y el CTA primario. Nada más. Una serie completada **no** usa accent (ver 1.4).
3. Sin sombras (invisibles sobre negro) ni gradientes. La elevación se expresa con el escalón de superficie + borde hairline (`StyleSheet.hairlineWidth`).
4. `text.tertiary` es el mínimo para cualquier texto informativo. `text.disabled` nunca transmite información.

### 1.2 Tipografía

Familias: **Inter v4** (texto) e **Inter Display** (titulares y números ≥ 20 pt). Archivos estáticos `.otf` embebidos en build con el config plugin de `expo-font` (sin carga en runtime). Cada peso es una familia distinta; el nombre de archivo debe coincidir con el PostScript name:

`Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `InterDisplay-SemiBold`, `InterDisplay-Bold`.

| Token | Familia | Tamaño / línea (pt) | Tracking (pt) | Uso |
|---|---|---|---|---|
| `display` | InterDisplay-Bold | 40 / 44 | −0.8 | Título de pantalla grande ("Hoy") |
| `title` | InterDisplay-SemiBold | 28 / 32 | −0.5 | Título de sección, nombre de árbol |
| `headline` | Inter-SemiBold | 17 / 22 | −0.2 | Nombre de ejercicio en card |
| `body` | Inter-Regular | 15 / 20 | −0.1 | Texto corrido, cues de técnica |
| `callout` | Inter-Medium | 13 / 18 | 0 | Subtítulo de card, metadatos |
| `micro` | Inter-Medium | 11 / 13 | +0.6, MAYÚSCULAS | Labels de datos ("DESCANSO"), labels de tab |
| `data.xl` | InterDisplay-Bold | 56 / 56 | −1.5 | Timer expandido, cronómetro de sesión en resumen |
| `data.lg` | InterDisplay-SemiBold | 28 / 28 | −0.5 | Tiempo de sesión en header |
| `data.md` | Inter-SemiBold | 20 / 24 | −0.3 | Valores de la tarjeta (4 × 8–12, 90s) |
| `data.sm` | Inter-SemiBold | 15 / 18 | 0 | Número dentro de chip de serie, pill del timer |

Reglas:
1. Todo número usa `fontVariant: ['tabular-nums']` (tokens `data.*` lo incluyen). Los números nunca "bailan" al cambiar.
2. Unidades (`s`, `kg`, `×`) en `text.secondary`, mismo tamaño que el número salvo `kg` que va en `callout`.
3. Máximo 2 pesos por componente. MAYÚSCULAS solo en `micro`.
4. `allowFontScaling` activo. Tokens `data.*` con `maxFontSizeMultiplier={1.3}`; resto `1.6`.
5. Componente único `<Text variant="headline" tone="secondary">` en `src/components/ui/Text.tsx`. Prohibido `Text` de RN directo fuera de ese archivo.

### 1.3 Espaciado, radios, movimiento, haptics

**Espaciado (grid 4 pt):** `0, 4, 8, 12, 16, 20, 24, 32, 40, 56`. Margen lateral de pantalla: 20. Gap entre cards: 12. Padding interno de card: 16.

**Radios:** chip 12 · card 20 · sheet 28 · botón/pill 999.

**Movimiento (`tokens.motion`):**

| Token | Valor | Uso |
|---|---|---|
| `spring.snappy` | `{ damping: 20, stiffness: 320, mass: 0.8 }` | Indicador de tab, press feedback |
| `spring.gentle` | `{ damping: 24, stiffness: 180, mass: 1 }` | Expandir/colapsar card, entrada del pill |
| `duration.fast` | 120 ms | Cambio de color, opacidad |
| `duration.base` | 220 ms | Fade de tabs |
| `easing.standard` | `Easing.bezier(0.2, 0, 0, 1)` | Todo `withTiming` no lineal |
| `press.scale` | 0.97 (cards), 0.92 (iconos/chips) | Feedback de presión |

Toda animación: `useSharedValue` + `useAnimatedStyle` o layout animations de Reanimated (`entering`, `exiting`, `LinearTransition.springify()`). Respetar `useReducedMotion()`: si es `true`, springs → `withTiming(duration.fast)` y sin desplazamientos.

**Haptics (único punto: `src/lib/haptics.ts`, respeta el ajuste `hapticsEnabled`):**

| Evento | Llamada |
|---|---|
| Cambio de tab | `Haptics.selectionAsync()` |
| Serie registrada | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` |
| Faltan 3 s de descanso | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` (una vez) |
| Fin de descanso (foreground) | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Workout iniciado / completado | `Haptics.notificationAsync(NotificationFeedbackType.Success)` |
| Ajuste ±15 s, stepper, segmentado | `Haptics.selectionAsync()` |
| Acción destructiva confirmada | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` |

Nunca haptics durante scroll ni en cada frame.

### 1.4 Tarjeta de Ejercicio de Cero Fricción (`ExerciseCard`)

Objetivo: entender la serie siguiente en < 1 s y registrarla con **un tap**.

```
┌──────────────────────────────────────────────┐
│ Tuck Planche                           2/4   │  headline · data.sm tertiary
│ Planche · Nivel 2                            │  callout · text.tertiary
│                                              │  16
│ 4 × 10–15s    3·1·X·0     2:00      +5 kg    │  data.md · text.primary
│ SERIES        TEMPO       DESCANSO  CARGA    │  micro · text.tertiary (4 pt arriba)
│                                              │  16
│ [15] [14] (12) [ 12]                         │  chips 44×44, gap 8
└──────────────────────────────────────────────┘
```

Contenedor: `surface.card`, radio 20, borde hairline `border.subtle`, padding 16, ancho = pantalla − 40. Alto ≈ 180 pt.

**Data strip:** fila horizontal, `gap: 24`, columnas de ancho automático alineadas a la izquierda. Valor arriba (`data.md`), label abajo (`micro`, `text.tertiary`). Sin iconos. Una columna sin dato **desaparece** (no "—"): sin tempo → no hay columna TEMPO; peso corporal → no hay columna CARGA. Mínimo 2 columnas (SERIES, DESCANSO).

Formato (`src/features/workout/format.ts`):

| Dato | Regla | Ejemplos |
|---|---|---|
| Series × objetivo | `min === max` → `n`; si no `min–max` (en dash). Hold añade `s` | `4 × 8–12`, `3 × 20s` |
| Tempo | `excéntrica·pausa abajo·concéntrica·pausa arriba`, concéntrica explosiva = `X` | `3·1·X·0` |
| Descanso | `< 120` s → `90s`; `≥ 120` → `m:ss` | `90s`, `2:00` |
| Carga | `weighted` → `+5 kg`; `band_assisted` → `Banda L/M/F`; `bodyweight` → columna oculta | |
| Contador | `completadas/total` | `2/4` |

**Fila de chips (una por serie):** 44 × 44 pt, radio 12, `gap: 8`, `flexWrap: 'wrap'`. Contenido: `data.sm` centrado.

| Estado del chip | Estilo | Número mostrado |
|---|---|---|
| Completado | fondo `text.primary`, número `bg.base` | valor real |
| Siguiente (primera pendiente) | borde 1.5 pt `accent`, número `accent` | valor por defecto (ver abajo) |
| Pendiente | borde hairline `border.strong`, número `text.tertiary` | `target.max` |
| Fallido | borde 1.5 pt `danger`, número `danger` | valor real |
| Saltado | sin borde, número `text.disabled`, texto `–` | — |

**Interacción:**
1. **Tap en chip pendiente** → registra la serie con el valor por defecto. Un solo tap, sin sheet. Valor por defecto, en orden: último `actual` de este ejercicio en esta sesión → `actual` de la primera serie de este ejercicio en la sesión anterior → `target.min`.
2. **Long press (350 ms) en cualquier chip** → `SetEditorSheet`: stepper de valor (±1 rep / ±1 s; mantener pulsado = repetición), carga, RPE segmentado `6 · 7 · 7.5 · 8 · 8.5 · 9 · 9.5 · 10`, toggle "Fallida", botón "Saltar". Sheet = `Modal` de RN (`transparent`, `animationType="fade"`) con contenido `entering={SlideInDown.springify()}`.
3. **Tap en chip completado** → abre el mismo sheet (editar/deshacer).
4. **Tap en el cuerpo de la card** → expande/colapsa cues de técnica (máx. 3 líneas, `body`, `text.secondary`) con `LinearTransition.springify()`.
5. Press feedback de card: escala 0.97 + fondo `surface.raised`.

**Estados de la card:**
- *Próxima:* como el diagrama, borde `border.subtle`.
- *Activa* (contiene la serie siguiente): borde `border.strong`. La lista hace scroll automático para dejarla visible.
- *Completada:* colapsa a 64 pt: nombre en `text.tertiary` + `4/4` a la derecha + icono check 16 pt. Tap la reabre.

**Accesibilidad:** la card expone `accessibilityLabel` completo ("Tuck planche, serie 2 de 4, objetivo 10 a 15 segundos, descanso 2 minutos"). Cada chip: `accessibilityRole="button"`, label "Serie 3, pendiente, registrar 12 segundos", `accessibilityHint` "Mantén pulsado para editar".

### 1.5 Tab Bar (`src/components/navigation/TabBar.tsx`)

Componente propio pasado a `<Tabs tabBar={(props) => <TabBar {...props} />}>`.

| Propiedad | Valor |
|---|---|
| Tabs | `Hoy` (`Flame`), `Skills` (`Network`), `Historial` (`History`), `Perfil` (`CircleUser`) — iconos lucide |
| Alto | `TAB_BAR_CONTENT_HEIGHT = 56` + `max(insets.bottom, 8)`. Exportar `useTabBarHeight()` con ese cálculo; no usar `useBottomTabBarHeight`. |
| Posición | `position: 'absolute', bottom: 0, left: 0, right: 0`. El contenido hace scroll por debajo; cada pantalla añade `paddingBottom: useTabBarHeight() + 24`. |
| Fondo iOS | `BlurView tint="dark" intensity={40}` + capa `rgba(0,0,0,0.6)` |
| Fondo Android | `View` sólido `rgba(0,0,0,0.94)` (sin blur) |
| Borde superior | hairline `border.subtle` |
| Ítem | `flex: 1`, icono 22 pt (`strokeWidth 1.75`) + label `micro` 4 pt debajo. Área táctil = todo el ítem (≥ 44 × 44). |
| Color | Activo `text.primary`, inactivo `text.tertiary`. Transición con `interpolateColor` sobre un shared value por ítem, `withTiming(duration.fast)`. |
| Indicador | Un único punto 4 × 4 `accent` bajo el label. `translateX = index * itemWidth + itemWidth / 2 - 2` con `withSpring(spring.snappy)`. `itemWidth` desde `onLayout` del contenedor. |
| Press | Escala 0.92 en press-in, `spring.snappy` de vuelta. |
| Haptic | `selectionAsync()` solo si cambia de tab. |
| Re-tap tab activo | Comportamiento por defecto de React Navigation (pop to top) + cada pantalla raíz usa `useScrollToTop(ref)`. |
| Transición de pantallas | `screenOptions={{ animation: 'fade', lazy: true, freezeOnBlur: true, headerShown: false }}` |
| Accesibilidad | `accessibilityRole="tab"`, `accessibilityState={{ selected }}`, label = nombre del tab. |

La pantalla de workout activo vive **fuera** de `(tabs)` (sin tab bar). Ver §3.2 sobre por qué no es un modal nativo.

---

## 2. Modelos de datos y contratos TypeScript

Archivo único: `src/types/domain.ts`. Todos los objetos son JSON-serializables (sin `Date`, sin `undefined` en campos persistidos: usar `null`). Tiempos en epoch ms.

```ts
// ─── Primitivos ────────────────────────────────────────────────────────────
export type ID = string; // UUID v4 (expo-crypto randomUUID)
export type EpochMs = number;

export type MetricType = 'reps' | 'hold'; // hold = segundos

export type Rpe = 6 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10;

export type MuscleGroup =
  | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts'
  | 'lats' | 'upper_back' | 'traps' | 'biceps' | 'triceps' | 'forearms'
  | 'core' | 'obliques' | 'lower_back' | 'hip_flexors'
  | 'glutes' | 'quads' | 'hamstrings' | 'calves';

export type MovementPattern =
  | 'horizontal_push' | 'vertical_push' | 'horizontal_pull' | 'vertical_pull'
  | 'squat' | 'hinge' | 'core_compression' | 'core_anti_extension'
  | 'straight_arm_push' | 'straight_arm_pull' | 'balance';

export type Equipment =
  | 'none' | 'pull_up_bar' | 'parallettes' | 'dip_bars' | 'rings'
  | 'resistance_band' | 'weight_vest' | 'dip_belt' | 'wall';

export type BandStrength = 'light' | 'medium' | 'heavy';

export type LoadSpec =
  | { kind: 'bodyweight' }
  | { kind: 'weighted'; kg: number }               // lastre añadido
  | { kind: 'band_assisted'; band: BandStrength }; // asistencia

/** Segundos por fase. concentric 'X' = explosiva. */
export interface Tempo {
  eccentric: number;
  bottomPause: number;
  concentric: number | 'X';
  topPause: number;
}

export interface TargetRange {
  min: number; // reps o segundos
  max: number; // max >= min
}

// ─── Ejercicio ─────────────────────────────────────────────────────────────
export interface Exercise {
  id: ID;
  slug: string;                    // 'tuck-planche'
  name: string;                    // 'Tuck Planche'
  metric: MetricType;
  pattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  /** Si true, `WorkoutSet.actual` registra el lado más débil. */
  unilateral: boolean;
  allowsExternalLoad: boolean;
  defaultTempo: Tempo | null;
  techniqueCues: string[];         // máx. 3, imperativo, ≤ 60 caracteres
  commonFaults: string[];
  media: { videoUrl: string | null; thumbnailUrl: string | null };
  isPro: boolean;
}

// ─── Árbol de habilidades ──────────────────────────────────────────────────
export type SkillDiscipline =
  | 'planche' | 'front_lever' | 'back_lever' | 'handstand'
  | 'muscle_up' | 'human_flag' | 'l_sit' | 'pistol_squat' | 'one_arm_pull_up';

export interface MasteryCriteria {
  metric: MetricType;
  target: number;               // reps o segundos por serie
  sets: number;                 // series que deben cumplir target
  maxRpe: Rpe;                  // por defecto 8 (≥ 2 en recámara)
  consecutiveSessions: number;  // por defecto 2
  windowDays: number;           // por defecto 21: la última sesión debe ser reciente
  allowAssistance: boolean;     // false → series con banda no cuentan
  minAddedKg: number | null;    // lastre mínimo exigido, null = peso corporal
}

export interface SkillNode {
  id: ID;
  treeId: ID;
  exerciseId: ID;
  title: string;                // 'Tuck Planche'
  tier: number;                 // fila en la UI, 0 = raíz
  lane: number;                 // columna en la UI (ramas paralelas)
  prerequisites: { mode: 'all' | 'any'; nodeIds: ID[] }; // [] = raíz, siempre desbloqueado
  mastery: MasteryCriteria;
  regressionNodeId: ID | null;  // a dónde bajar si el algoritmo sugiere regresión
}

export interface SkillTree {
  id: ID;
  slug: string;
  name: string;
  discipline: SkillDiscipline;
  description: string;
  nodes: SkillNode[];           // ordenados por tier, lane
  isPro: boolean;
  version: number;              // incrementar al cambiar nodos/criterios
}

/** Derivado, nunca persistido. */
export type SkillNodeStatus = 'locked' | 'unlocked' | 'in_progress' | 'mastered';

/** Persistido por usuario. locked/unlocked/in_progress se derivan (§3.3). */
export interface UserSkillProgress {
  userId: ID;
  mastered: Record<ID, { at: EpochMs; via: 'algorithm' | 'manual' }>; // key = nodeId
  best: Record<ID, { value: number; at: EpochMs; sessionId: ID }>;    // key = nodeId
}

/** Derivado para la UI del árbol. */
export interface SkillTreeView {
  treeId: ID;
  level: number;                  // nº de nodos dominados
  totalNodes: number;
  currentNodeId: ID | null;       // nodo desbloqueado no dominado de menor tier/lane
  statusByNode: Record<ID, SkillNodeStatus>;
}

// ─── Rutinas y sesiones ────────────────────────────────────────────────────
export interface ExercisePrescription {
  exerciseId: ID;
  skillNodeId: ID | null;
  sets: number;
  target: TargetRange;
  tempo: Tempo | null;
  load: LoadSpec;
  restSec: number;              // descanso entre series de este ejercicio
  restAfterSec: number | null;  // descanso tras la última serie (null = restSec)
  targetRpe: Rpe | null;
}

export interface Routine {
  id: ID;
  name: string;
  entries: ExercisePrescription[];
  isPro: boolean;
  updatedAt: EpochMs;
}

export type SetKind = 'warmup' | 'working';
export type SetStatus = 'pending' | 'completed' | 'failed' | 'skipped';

export interface WorkoutSet {
  id: ID;
  index: number;                 // 0-based dentro del entry
  kind: SetKind;
  status: SetStatus;
  target: TargetRange;           // copia de la prescripción (puede ajustarse por progresión)
  actual: number | null;         // reps o segundos; null hasta registrar
  load: LoadSpec;
  rpe: Rpe | null;
  formOk: boolean | null;        // false = técnica rota, no cuenta para maestría
  restPrescribedSec: number;     // descanso que sigue a esta serie (0 = ninguno)
  restTakenMs: number | null;    // descanso real transcurrido tras esta serie
  completedAt: EpochMs | null;
}

export interface WorkoutExerciseEntry {
  id: ID;
  order: number;
  exerciseId: ID;
  skillNodeId: ID | null;
  prescription: ExercisePrescription;
  sets: WorkoutSet[];
  notes: string | null;
}

export type WorkoutSessionStatus = 'active' | 'completed' | 'discarded';

export interface WorkoutSession {
  id: ID;
  userId: ID;
  routineId: ID | null;
  title: string;
  status: WorkoutSessionStatus;
  startedAt: EpochMs;
  endedAt: EpochMs | null;
  pausedMs: number;              // total acumulado en pausa
  entries: WorkoutExerciseEntry[];
  bodyweightKg: number | null;
  notes: string | null;
  updatedAt: EpochMs;
  syncedAt: EpochMs | null;      // Fase 2 (Supabase)
  schemaVersion: 1;
}

// ─── Monetización ──────────────────────────────────────────────────────────
export type Tier = 'free' | 'pro';

export type FeatureKey =
  | 'all_skill_trees'     // free: solo árboles con isPro=false
  | 'unlimited_routines'  // free: FREE_LIMITS.routines
  | 'full_history'        // free: últimos FREE_LIMITS.historyDays días
  | 'advanced_stats';     // gráficas de volumen/progresión

export interface UserEntitlements {
  userId: ID;
  tier: Tier;
  source: 'revenuecat' | 'promo' | 'none';
  productId: string | null;
  periodType: 'normal' | 'trial' | 'intro' | null;
  willRenew: boolean;
  expiresAt: EpochMs | null;     // null con tier 'pro' = lifetime
  isInGracePeriod: boolean;      // problema de cobro, acceso mantenido
  lastVerifiedAt: EpochMs;       // última respuesta OK de RevenueCat
}

export const FREE_LIMITS = { routines: 3, historyDays: 30 } as const;
export const RC_ENTITLEMENT_ID = 'pro';
export const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
```

### 2.1 Reglas de entitlements (`src/features/entitlements/entitlements.ts`)

```ts
export function isPro(e: UserEntitlements, now: EpochMs): boolean {
  if (e.tier !== 'pro') return false;
  if (now - e.lastVerifiedAt > OFFLINE_GRACE_MS) return false; // caché demasiado vieja
  return e.expiresAt === null || e.expiresAt > now || e.isInGracePeriod;
}

export function canUse(feature: FeatureKey, e: UserEntitlements, now: EpochMs): boolean {
  return isPro(e, now); // todas las FeatureKey son Pro; los límites free se aplican en cada pantalla
}
```

- Fuente: `Purchases.getCustomerInfo()` al arrancar + `Purchases.addCustomerInfoUpdateListener`. Mapear `customerInfo.entitlements.active[RC_ENTITLEMENT_ID]` → `UserEntitlements`. Cachear en MMKV.
- Paywall: `RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: RC_ENTITLEMENT_ID })` al tocar contenido Pro. Contenido Pro se muestra (no se oculta) con un candado 14 pt `text.tertiary`.
- **Nunca** bloquear un workout en curso por entitlements. Si caduca a mitad de sesión, la sesión termina normal.

---

## 3. Lógica y máquinas de estado

### 3.1 Workout Active State Machine

Reducer **puro** en `src/features/workout/machine.ts`. Sin `Date.now()`, sin IDs aleatorios, sin efectos dentro. El tiempo entra por `event.now`.

```ts
export interface RestTimer {
  afterSetId: ID;        // serie que originó el descanso
  startedAt: EpochMs;
  endsAt: EpochMs;       // se desplaza con pausas y ajustes ±15 s
  durationMs: number;    // duración objetivo actual (cambia con ADJUST_REST)
  pausedMs: number;      // pausa acumulada durante este descanso
}

export type WorkoutState =
  | { status: 'IDLE' }
  | { status: 'EXERCISE_ACTIVE'; session: WorkoutSession }
  | { status: 'REST_TIMER_RUNNING'; session: WorkoutSession; rest: RestTimer }
  | {
      status: 'WORKOUT_PAUSED';
      session: WorkoutSession;
      pausedAt: EpochMs;
      resumeTo: 'EXERCISE_ACTIVE' | 'REST_TIMER_RUNNING';
      rest: RestTimer | null;
    }
  | { status: 'WORKOUT_COMPLETED'; session: WorkoutSession };

type SetPatch = Partial<Pick<WorkoutSet, 'actual' | 'load' | 'rpe' | 'formOk' | 'status'>>;

export type WorkoutEvent =
  | { type: 'START'; session: WorkoutSession; now: EpochMs }
  | { type: 'LOG_SET'; entryId: ID; setId: ID; patch: SetPatch; now: EpochMs } // patch.status por defecto 'completed'
  | { type: 'EDIT_SET'; entryId: ID; setId: ID; patch: SetPatch; now: EpochMs } // corrige sin tocar descanso
  | { type: 'SKIP_SET'; entryId: ID; setId: ID; now: EpochMs }
  | { type: 'REST_DONE'; now: EpochMs }
  | { type: 'SKIP_REST'; now: EpochMs }
  | { type: 'ADJUST_REST'; deltaMs: number; now: EpochMs } // ±15000
  | { type: 'PAUSE'; now: EpochMs }
  | { type: 'RESUME'; now: EpochMs }
  | { type: 'FINISH'; now: EpochMs }
  | { type: 'DISCARD'; now: EpochMs }
  | { type: 'RESET'; now: EpochMs };

export function workoutReducer(state: WorkoutState, event: WorkoutEvent): WorkoutState;
```

**Derivados (no se guardan en el estado):**
- `nextPendingSet(session)` → primer `{ entry, set }` con `status === 'pending'`, recorriendo entries por `order` y sets por `index`. `null` si no queda ninguno.
- `restDurationSecAfter(entry, set)` → si quedan pendientes en el entry: `prescription.restSec`; si es la última del entry y queda algo pendiente en la sesión: `prescription.restAfterSec ?? prescription.restSec`; si no queda nada pendiente: `0`.
- `elapsedMs(state, now)` → `now - startedAt - pausedMs - (status === 'WORKOUT_PAUSED' ? now - pausedAt : 0)`.

**Tabla de transiciones** (cualquier par estado/evento que no figure → devolver **la misma referencia** `state`, para que Zustand no notifique):

| Desde | Evento | Guarda | Hacia | Cambios en datos |
|---|---|---|---|---|
| `IDLE` | `START` | `session.entries` tiene ≥ 1 set | `EXERCISE_ACTIVE` | — |
| `EXERCISE_ACTIVE` | `LOG_SET` | `restDurationSecAfter > 0` | `REST_TIMER_RUNNING` | set ← patch + `status` + `completedAt=now`; crear `RestTimer{ startedAt: now, endsAt: now + dur, durationMs: dur, pausedMs: 0 }` |
| `EXERCISE_ACTIVE` | `LOG_SET` | `restDurationSecAfter === 0` | `EXERCISE_ACTIVE` | set actualizado; la UI muestra CTA "Terminar" |
| `REST_TIMER_RUNNING` | `LOG_SET` | — | `REST_TIMER_RUNNING` o `EXERCISE_ACTIVE` (misma guarda) | cerrar descanso actual (ver *cierre*), luego igual que desde `EXERCISE_ACTIVE` |
| `EXERCISE_ACTIVE`, `REST_TIMER_RUNNING`, `WORKOUT_PAUSED` | `EDIT_SET` | set existe | mismo estado | solo el set; `rest` intacto |
| `EXERCISE_ACTIVE`, `REST_TIMER_RUNNING` | `SKIP_SET` | set `pending` | mismo estado | `status='skipped'` |
| `REST_TIMER_RUNNING` | `REST_DONE` | `now >= rest.endsAt` | `EXERCISE_ACTIVE` | cierre del descanso |
| `REST_TIMER_RUNNING` | `SKIP_REST` | — | `EXERCISE_ACTIVE` | cierre del descanso |
| `REST_TIMER_RUNNING` | `ADJUST_REST` | — | `REST_TIMER_RUNNING` | `endsAt = max(now + 1000, endsAt + deltaMs)`; `durationMs += deltaMs` (mín. 1000) |
| `EXERCISE_ACTIVE` | `PAUSE` | — | `WORKOUT_PAUSED` | `{ pausedAt: now, resumeTo: 'EXERCISE_ACTIVE', rest: null }` |
| `REST_TIMER_RUNNING` | `PAUSE` | — | `WORKOUT_PAUSED` | `{ pausedAt: now, resumeTo: 'REST_TIMER_RUNNING', rest }` |
| `WORKOUT_PAUSED` | `RESUME` | — | `resumeTo` | `d = now - pausedAt`; `session.pausedMs += d`; si hay `rest`: `rest.endsAt += d`, `rest.pausedMs += d` |
| `EXERCISE_ACTIVE`, `REST_TIMER_RUNNING`, `WORKOUT_PAUSED` | `FINISH` | — | `WORKOUT_COMPLETED` | si estaba en pausa, sumar pausa; cerrar descanso si existe; sets `pending` → `skipped`; `session.status='completed'`, `endedAt=now` |
| `EXERCISE_ACTIVE`, `REST_TIMER_RUNNING`, `WORKOUT_PAUSED` | `DISCARD` | — | `IDLE` | sesión eliminada (no se guarda en historial) |
| `WORKOUT_COMPLETED` | `RESET` | — | `IDLE` | — |

*Cierre de descanso:* en el set `rest.afterSetId`, `restTakenMs = now - rest.startedAt - rest.pausedMs`.

**Invariantes (cubiertas por `machine.test.ts`):**
1. Inmutabilidad con structural sharing: entries y sets no tocados conservan su referencia (las cards no afectadas no re-renderizan).
2. Solo `REST_TIMER_RUNNING` y `WORKOUT_PAUSED` con `resumeTo === 'REST_TIMER_RUNNING'` tienen `rest !== null`.
3. Toda transición actualiza `session.updatedAt = now`.
4. `elapsedMs` nunca cuenta tiempo en pausa.
5. Evento no aplicable → `Object.is(next, prev) === true`.

**Efectos secundarios** (`src/features/workout/effects.ts`): un único `useWorkoutStore.subscribe((next, prev) => …)` registrado en el root layout. Compara `prev.state` y `next.state` y ejecuta:

| Cambio detectado | Efecto |
|---|---|
| `IDLE → EXERCISE_ACTIVE` | haptic success; pedir permiso de notificaciones si nunca se pidió |
| set pasa a `completed`/`failed` | haptic medium |
| entra en `REST_TIMER_RUNNING` o cambia `rest.endsAt` | (re)programar notificación (§3.2) |
| sale de `REST_TIMER_RUNNING` (a cualquier estado) | cancelar notificación |
| `REST_TIMER_RUNNING → EXERCISE_ACTIVE` por `REST_DONE` con app en foreground | haptic success |
| `→ WORKOUT_COMPLETED` | haptic success; mover sesión al historial; ejecutar §3.3 para cada entry con `skillNodeId` |

Store (`src/features/workout/store.ts`): Zustand + `persist` (MMKV, clave `workout-v1`) con forma `{ state: WorkoutState; send(event: Omit<WorkoutEvent, 'now'>): void }`. `send` inyecta `now: Date.now()` y llama al reducer. (Usar un `DistributiveOmit` para que la unión se mantenga discriminada.)

### 3.2 Timer de descanso persistente

Principio: **el estado del timer es un timestamp (`endsAt`), nunca un contador.** El tiempo restante siempre se deriva: `remainingMs = rest.endsAt - Date.now()`. Por eso sobrevive a cambios de tab, a pantalla bloqueada, a background y al cierre del proceso (estado persistido en MMKV).

**Componente:** `RestTimerPill` en `src/components/workout/RestTimerPill.tsx`, montado **una sola vez** en `app/_layout.tsx` como hermano posterior al `<Stack />`, con `position: 'absolute'`. Así flota sobre cualquier tab y sobre la pantalla de workout.

> La pantalla `app/workout.tsx` se presenta con `presentation: 'card'` + `animation: 'slide_from_bottom'`. **Prohibido** `modal`, `fullScreenModal`, `formSheet` o `transparentModal` para cualquier pantalla donde el pill deba verse: los modales nativos se renderizan por encima de todo el árbol de React y taparían el pill.

**Visibilidad y posición:**
- Visible si `status === 'REST_TIMER_RUNNING'` o (`'WORKOUT_PAUSED'` y `rest !== null`, mostrando icono de pausa en lugar de anillo animado).
- `bottom` = `useTabBarHeight() + 12` si el segmento actual es `(tabs)` (via `useSegments()`); si no, `insets.bottom + 12`.
- Entrada `FadeInDown.springify()` / salida `FadeOutDown` (Reanimated layout animations).

**Anatomía (colapsado):** alto 48, radio 999, `surface.raised`, borde hairline `border.strong`, padding horizontal 16, centrado horizontalmente, ancho mínimo 168. Contenido: anillo de progreso 20 pt (trazo 2 pt, pista `border.strong`, progreso `accent`) · tiempo restante `data.sm` (`m:ss`) · botón `+15` (`micro`). Tap en el pill → expandido.

**Expandido:** sheet (mismo patrón Modal de §1.4) con tiempo `data.xl`, botones `−15 s`, `+15 s`, `Saltar`, y nombre del siguiente ejercicio/serie (`callout`).

**Motor de animación (sin re-render por frame):**
- `progress` = shared value 0→1. Cada vez que cambia `rest.endsAt` o se reanuda: `progress.value = (now - startedAt - pausedMs) / durationMs` y luego `progress.value = withTiming(1, { duration: remainingMs, easing: Easing.linear })`. En pausa: `cancelAnimation(progress)`.
- Anillo: `react-native-svg` `Circle` animado con `useAnimatedProps` (`strokeDashoffset`).
- Texto `m:ss`: estado React local en el pill, actualizado con `setTimeout` alineado al segundo (`delay = remainingMs % 1000 || 1000`). Prohibido `setInterval` < 1000 ms en JS. Solo el pill re-renderiza.

**Fin del descanso (foreground):** el mismo `setTimeout` que alcanza `remainingMs <= 0` llama `send({ type: 'REST_DONE' })`. A `remainingMs ≤ 3000` dispara una vez el haptic light. El haptic success lo dispara `effects.ts`.

**Background / app cerrada:**
- Al entrar en descanso (o cambiar `endsAt`): `Notifications.scheduleNotificationAsync({ identifier: 'rest-timer', content: { title: 'Descanso terminado', body: '<siguiente ejercicio> · serie n/N', sound: true }, trigger: { type: SchedulableTriggerInputTypes.DATE, date: endsAt } })`. Mismo `identifier` → reemplaza la anterior.
- Al salir de descanso o pausar: `cancelScheduledNotificationAsync('rest-timer')`.
- `setNotificationHandler` no muestra banner si la app está en foreground (el haptic ya avisa).
- Android: canal `rest-timer`, importancia `HIGH`, `vibrationPattern: [0, 250, 120, 250]`.
- `AppState` → `'active'` y al rehidratar el store: si `status === 'REST_TIMER_RUNNING'` y `Date.now() >= rest.endsAt` → `send({ type: 'REST_DONE' })` **sin** haptic (la notificación ya avisó).

### 3.3 Algoritmo de progresión

Archivo: `src/features/progression/progression.ts`. Funciones puras; `now` entra como parámetro.

**Entrada:** `NodeAttempt[]` del nodo, más reciente primero. Un intento = las series `working` del `exerciseId` del nodo en una sesión completada, con `status` `completed` o `failed`.

```ts
export interface NodeAttempt { sessionId: ID; at: EpochMs; sets: WorkoutSet[] }

export type ProgressionSuggestion =
  | { kind: 'advance'; nodeId: ID; toNodeId: ID | null; readiness: number } // toNodeId null = falta otra rama
  | { kind: 'near'; nodeId: ID; readiness: number }
  | { kind: 'hold'; nodeId: ID; readiness: number }
  | { kind: 'regress'; nodeId: ID; toNodeId: ID; readiness: number };

const DAY_MS = 86_400_000;
const SCORE_CAP = 1.25;
```

**Paso 1 — Evaluar un intento contra `MasteryCriteria c`:**

```ts
function setCounts(s: WorkoutSet, c: MasteryCriteria): boolean {
  if (s.actual === null) return false;
  if (!c.allowAssistance && s.load.kind === 'band_assisted') return false;
  if (c.minAddedKg !== null && !(s.load.kind === 'weighted' && s.load.kg >= c.minAddedKg)) return false;
  return true;
}

export function evaluateAttempt(sets: WorkoutSet[], c: MasteryCriteria) {
  const eligible = sets.filter((s) => setCounts(s, c));
  const qualifyingSets = eligible.filter(
    (s) => s.actual! >= c.target && (s.rpe === null || s.rpe <= c.maxRpe) && s.formOk !== false,
  ).length;
  const scores = eligible
    .map((s) => Math.min(s.actual! / c.target, SCORE_CAP))
    .sort((a, b) => b - a)
    .slice(0, c.sets);
  const readiness = scores.reduce((sum, x) => sum + x, 0) / c.sets; // series que faltan cuentan 0
  return { qualifies: qualifyingSets >= c.sets, readiness };
}
```

Fórmula: `readiness = (1 / c.sets) · Σ_{i=1..c.sets} min(actual_i / target, 1.25)` sobre las `c.sets` mejores series elegibles. Rango 0–1.25.

**Paso 2 — Sugerencia por nodo** (se evalúa en este orden, gana la primera regla que se cumpla):

| Regla | Condición | Resultado |
|---|---|---|
| A. Avanzar | Las últimas `c.consecutiveSessions` evaluaciones tienen `qualifies` **y** `now - attempts[0].at ≤ c.windowDays · DAY_MS` | `advance` + marcar nodo `mastered` (`via: 'algorithm'`) |
| B. Regresar | ≥ 2 intentos, `readiness < 0.6` en los 2 últimos **y** `node.regressionNodeId !== null` | `regress` a `regressionNodeId` |
| C. Cerca | `readiness` del último intento `≥ 0.9` | `near` (badge "Cerca" en `accent.muted`) |
| D. Mantener | resto (incluye 0 intentos → `readiness 0`) | `hold` |

La maestría se marca automáticamente (es objetiva). **Cambiar la rutina** al siguiente ejercicio requiere confirmación del usuario (botón "Avanzar a Straddle Planche" en el resumen del workout y en la card del nodo).

**Paso 3 — Estado y siguiente nodo** (`src/features/skills/tree.ts`):

```ts
function prerequisitesMet(node: SkillNode, mastered: Set<ID>): boolean {
  const { mode, nodeIds } = node.prerequisites;
  if (nodeIds.length === 0) return true;
  return mode === 'all' ? nodeIds.every((id) => mastered.has(id)) : nodeIds.some((id) => mastered.has(id));
}

export function nodeStatus(node: SkillNode, mastered: Set<ID>, hasAttempts: boolean): SkillNodeStatus {
  if (mastered.has(node.id)) return 'mastered';
  if (!prerequisitesMet(node, mastered)) return 'locked';
  return hasAttempts ? 'in_progress' : 'unlocked';
}
```

`toNodeId` de un `advance` = entre los nodos cuyo `prerequisites.nodeIds` incluye el nodo dominado y que quedan desbloqueados con el nuevo `mastered`, el de menor `(tier, lane)`. Si ninguno se desbloquea (p. ej. modo `all` con otra rama pendiente) → `null`, y la UI dice "Completa <nodo pendiente> para desbloquear <hijo>".

`SkillTreeView.level` = nº de nodos dominados. `currentNodeId` = nodo `unlocked`/`in_progress` de menor `(tier, lane)`.

**Paso 4 — Progresión dentro del nodo (doble progresión de la prescripción).** Al completar un workout, para cada entry calcular el `target` de la próxima sesión y guardarlo en la `Routine`:

```
step = metric === 'reps' ? 1 : (mastery.target <= 15 ? 2 : 5)   // reps o segundos
allTop  = todas las series working cumplen actual >= target.max y (rpe null o rpe <= 8)
anyMiss = alguna serie working con actual < target.min

si allTop:
    si es un ejercicio de nodo:   target = { min: min + step, max: min(max + step, mastery.target) }  (min nunca > max)
    si es lastrado sin nodo:      load.kg += 2.5; target = target original de la rutina (vuelve al rango bajo)
    si no:                        target = { min: min + step, max: max + step }
si anyMiss en los 2 últimos intentos:
    target = { min: max(1, min - step), max: max(1, max - step) }
si no: sin cambios
```

Ejercicios sin nodo y con `metric: 'hold'` usan `step = 5`.

**Casos de test obligatorios (`progression.test.ts`):**
1. 2 sesiones seguidas con 3 series ≥ target y RPE 8 → `advance`.
2. Mismo caso pero la última sesión hace 30 días con `windowDays 21` → no `advance`.
3. Una serie con `formOk: false` deja `qualifyingSets` por debajo → no `advance`.
4. Series con banda y `allowAssistance: false` → no cuentan.
5. Dos sesiones con `readiness 0.5` y `regressionNodeId` → `regress`.
6. `readiness 0.92` sin calificar → `near`.
7. Nodo con prerequisitos `all` [A, B] y solo A dominado → `locked`; con A y B → `unlocked`.
8. Doble progresión: `allTop` con `max` ya igual a `mastery.target` → `max` no supera el target.

### 3.4 Datos semilla (`src/data/seed.ts`)

IDs semilla estables (strings fijos tipo `'ex-tuck-planche'`, `'node-planche-2'`) para que tests y rutas sean deterministas. Valores por defecto de `MasteryCriteria`: `maxRpe 8`, `consecutiveSessions 2`, `windowDays 21`, `allowAssistance false`, `minAddedKg null`, salvo indicación.

**Árbol Handstand** (`isPro: true` — el árbol Pro del MVP; prueba el flujo de paywall)

| tier | lane | Nodo | Métrica | Maestría | Prerrequisitos | Regresión |
|---|---|---|---|---|---|---|
| 0 | 0 | Chest-to-Wall Handstand | hold | 3 × 45 s | — | — |
| 1 | 0 | Wall Heel Pulls | hold | 3 × 10 s | all [Chest-to-Wall] | Chest-to-Wall |
| 2 | 0 | Freestanding Handstand | hold | 3 × 15 s | all [Heel Pulls] | Heel Pulls |
| 3 | 0 | Pike Press to Handstand | reps | 3 × 3 | all [Freestanding] | Freestanding |

**Árbol Muscle-up** (`isPro: false`)

| tier | lane | Nodo | Métrica | Maestría | Prerrequisitos | Regresión |
|---|---|---|---|---|---|---|
| 0 | 0 | Pull-up | reps | 3 × 10 | — | — |
| 0 | 1 | Straight Bar Dip | reps | 3 × 10 | — | — |
| 1 | 0 | Chest-to-Bar Pull-up | reps | 3 × 8 | all [Pull-up] | Pull-up |
| 2 | 0 | Negative Muscle-up | reps | 3 × 5 (excéntrica 5 s) | all [Chest-to-Bar, Straight Bar Dip] | Chest-to-Bar |
| 3 | 0 | Band-Assisted Muscle-up | reps | 3 × 5, `allowAssistance: true` | all [Negative] | Negative |
| 4 | 0 | Strict Muscle-up | reps | 3 × 3 | all [Band-Assisted] | Band-Assisted |

**Árbol Planche** (`isPro: false`)

| tier | lane | Nodo | Métrica | Maestría | Prerrequisitos | Regresión |
|---|---|---|---|---|---|---|
| 0 | 0 | Planche Lean | hold | 3 × 30 s | — | — |
| 1 | 0 | Tuck Planche | hold | 3 × 15 s | all [Lean] | Lean |
| 2 | 0 | Advanced Tuck Planche | hold | 3 × 12 s | all [Tuck] | Tuck |
| 3 | 0 | Straddle Planche | hold | 3 × 8 s | all [Adv. Tuck] | Adv. Tuck |
| 4 | 0 | Full Planche | hold | 3 × 5 s | all [Straddle] | Straddle |

**Rutina "Push & Skill A"** (`isPro: false`) — demuestra todas las columnas de la card:

| # | Ejercicio | Series × objetivo | Tempo | Carga | Descanso |
|---|---|---|---|---|---|
| 1 | Tuck Planche (nodo) | 4 × 10–15 s | — | BW | 120 s |
| 2 | Pseudo Planche Push-up | 3 × 8–12 | 3·1·X·0 | BW | 90 s |
| 3 | Straight Bar Dip (nodo) | 3 × 8–12 | 2·0·1·0 | +5 kg | 120 s |
| 4 | Hollow Body Hold | 3 × 30–45 s | — | BW | 60 s |

Usuario local por defecto: `userId = 'local-user'` hasta que exista Auth (Fase 2).
