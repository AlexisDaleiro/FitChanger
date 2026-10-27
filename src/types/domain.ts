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
