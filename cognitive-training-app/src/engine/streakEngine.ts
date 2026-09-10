import { getStreakInfo, saveStreakInfo } from '../db/repository';
import type { StreakInfo } from '../types';

function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function getCurrentStreak(userId: string): StreakInfo {
  return getStreakInfo(userId);
}

/**
 * Call once, when a session is closed (docs/ARCHITECTURE.md data flow §3).
 * - Same calendar day as last session -> no change (already trained today).
 * - Exactly one day later -> streak continues (+1).
 * - Any bigger gap -> streak resets to 1 (today counts as day one of a new streak).
 */
export function recordSessionCompleted(userId: string, todayDate: string): StreakInfo {
  const info = getStreakInfo(userId);

  let currentStreak = info.currentStreak;
  if (!info.lastSessionDate) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(info.lastSessionDate, todayDate);
    if (gap === 0) {
      currentStreak = info.currentStreak; // already counted today
    } else if (gap === 1) {
      currentStreak = info.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  }

  const updated: StreakInfo = {
    userId,
    currentStreak,
    longestStreak: Math.max(info.longestStreak, currentStreak),
    lastSessionDate: todayDate,
  };
  saveStreakInfo(updated);
  return updated;
}
