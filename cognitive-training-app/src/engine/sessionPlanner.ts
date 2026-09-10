import { EXERCISE_REGISTRY } from '../exercises/registry';
import { getLastSessionExerciseIds } from '../db/repository';
import type { ExerciseDefinition } from '../types';

const SESSION_SIZE = 4;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds today's exercise line-up: distinct domains, preferring exercises
 * that were NOT part of the user's most recent completed session, so back
 * to back days don't feel identical (docs/ARCHITECTURE.md §5).
 */
export function buildTodaySession(userId: string): ExerciseDefinition[] {
  const avoid = new Set(getLastSessionExerciseIds(userId));
  const byDomain = new Map<string, ExerciseDefinition[]>();
  for (const def of EXERCISE_REGISTRY) {
    const list = byDomain.get(def.domain) ?? [];
    list.push(def);
    byDomain.set(def.domain, list);
  }

  const domains = shuffle([...byDomain.keys()]).slice(0, SESSION_SIZE);
  const plan: ExerciseDefinition[] = [];
  for (const domain of domains) {
    const candidates = byDomain.get(domain)!;
    const fresh = candidates.filter((c) => !avoid.has(c.id));
    const pool = fresh.length > 0 ? fresh : candidates; // fall back to repeating if pool is small
    plan.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return plan;
}
