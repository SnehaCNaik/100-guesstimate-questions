/**
 * Shared types for the whole app. Every exercise, engine, and repository
 * function speaks in these types — this is the contract that makes
 * "add a new exercise" an additive change (see docs/ROADMAP.md Phase 2).
 */

export type Domain = 'memory' | 'logic' | 'focus' | 'problemSolving' | 'reasoning';

export const DOMAIN_LABELS: Record<Domain, string> = {
  memory: 'Memory',
  logic: 'Logic',
  focus: 'Focus',
  problemSolving: 'Problem Solving',
  reasoning: 'Reasoning',
};

export const DOMAIN_ICONS: Record<Domain, string> = {
  memory: '🧠',
  logic: '🧩',
  focus: '🎯',
  problemSolving: '🗺️',
  reasoning: '🔷',
};

/** What an exercise component reports back when a round ends. */
export interface ExerciseRunResult {
  score: number; // 0-100, normalized
  accuracy: number; // 0-1
  timeMs: number;
  metadata?: Record<string, unknown>;
}

/** Props every exercise component receives. */
export interface ExerciseProps {
  difficulty: number; // 1-10, assigned by the difficulty engine before mount
  onComplete: (result: ExerciseRunResult) => void;
}

/** Static definition of an exercise, as registered in exercises/registry.ts */
export interface ExerciseDefinition {
  id: string;
  name: string;
  domain: Domain;
  description: string;
  Component: React.ComponentType<ExerciseProps>;
}

/** A fully-recorded result, as stored in exercise_results. */
export interface ExerciseResultRecord extends ExerciseRunResult {
  id: string;
  sessionId: string;
  exerciseId: string;
  domain: Domain;
  difficulty: number;
  completedAt: string; // ISO 8601
}

export interface SessionRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startedAt: string;
  endedAt: string | null;
  totalScore: number | null;
  exercisesPlanned: number;
  exercisesCompleted: number;
}

export interface StreakInfo {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
}

export interface DomainStat {
  userId: string;
  domain: Domain;
  sessionsCount: number;
  avgScore30d: number;
  avgDifficulty30d: number;
  bestScore: number;
  updatedAt: string;
}
