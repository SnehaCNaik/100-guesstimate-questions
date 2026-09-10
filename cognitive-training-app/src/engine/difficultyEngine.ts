import { getExerciseDifficulty, setExerciseDifficulty } from '../db/repository';
import type { ExerciseRunResult } from '../types';

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

/** The difficulty the user should play this exercise at, right now. */
export function getDifficultyFor(userId: string, exerciseId: string): number {
  return getExerciseDifficulty(userId, exerciseId);
}

/**
 * Adaptive step, applied once per completed round. Deliberately simple
 * (a fixed +1/-1 step, not ELO/IRT) — see docs/ARCHITECTURE.md §4 for why.
 */
export function updateDifficultyAfterResult(
  userId: string,
  exerciseId: string,
  playedAtDifficulty: number,
  result: ExerciseRunResult,
  targetTimeMs: number
): number {
  let next = playedAtDifficulty;
  if (result.accuracy >= 0.85 && result.timeMs <= targetTimeMs) {
    next = playedAtDifficulty + 1;
  } else if (result.accuracy < 0.5) {
    next = playedAtDifficulty - 1;
  }
  next = Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, next));
  if (next !== playedAtDifficulty) {
    setExerciseDifficulty(userId, exerciseId, next);
  }
  return next;
}
