import uuid from 'react-native-uuid';
import { getDb } from './database';
import type {
  Domain,
  DomainStat,
  ExerciseResultRecord,
  ExerciseRunResult,
  SessionRecord,
  StreakInfo,
} from '../types';

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function startSession(userId: string, exercisesPlanned: number): SessionRecord {
  const db = getDb();
  const id = uuid.v4() as string;
  const startedAt = new Date().toISOString();
  const date = todayDateString();
  db.runSync(
    `INSERT INTO sessions (id, user_id, date, started_at, ended_at, total_score, exercises_planned, exercises_completed)
     VALUES (?, ?, ?, ?, NULL, NULL, ?, 0)`,
    [id, userId, date, startedAt, exercisesPlanned]
  );
  return {
    id,
    userId,
    date,
    startedAt,
    endedAt: null,
    totalScore: null,
    exercisesPlanned,
    exercisesCompleted: 0,
  };
}

export function recordExerciseResult(
  sessionId: string,
  exerciseId: string,
  domain: Domain,
  difficulty: number,
  result: ExerciseRunResult
): ExerciseResultRecord {
  const db = getDb();
  const id = uuid.v4() as string;
  const completedAt = new Date().toISOString();
  db.runSync(
    `INSERT INTO exercise_results
       (id, session_id, exercise_id, domain, difficulty, score, accuracy, time_ms, completed_at, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      sessionId,
      exerciseId,
      domain,
      difficulty,
      result.score,
      result.accuracy,
      result.timeMs,
      completedAt,
      result.metadata ? JSON.stringify(result.metadata) : null,
    ]
  );
  db.runSync(
    `UPDATE sessions SET exercises_completed = exercises_completed + 1 WHERE id = ?`,
    [sessionId]
  );
  return {
    id,
    sessionId,
    exerciseId,
    domain,
    difficulty,
    completedAt,
    ...result,
  };
}

export function closeSession(sessionId: string, userId: string): SessionRecord {
  const db = getDb();
  const results = db.getAllSync<{ score: number }>(
    `SELECT score FROM exercise_results WHERE session_id = ?`,
    [sessionId]
  );
  const totalScore =
    results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
  const endedAt = new Date().toISOString();
  db.runSync(`UPDATE sessions SET ended_at = ?, total_score = ? WHERE id = ?`, [
    endedAt,
    totalScore,
    sessionId,
  ]);
  recomputeDomainStats(userId);
  const row = db.getFirstSync<any>(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
  return rowToSession(row);
}

export function hasCompletedSessionToday(userId: string): boolean {
  const db = getDb();
  const row = db.getFirstSync(
    `SELECT 1 FROM sessions WHERE user_id = ? AND date = ? AND ended_at IS NOT NULL LIMIT 1`,
    [userId, todayDateString()]
  );
  return !!row;
}

export function getRecentSessions(userId: string, limit = 20): SessionRecord[] {
  const db = getDb();
  const rows = db.getAllSync<any>(
    `SELECT * FROM sessions WHERE user_id = ? AND ended_at IS NOT NULL
     ORDER BY date DESC LIMIT ?`,
    [userId, limit]
  );
  return rows.map(rowToSession);
}

export function getLastSessionExerciseIds(userId: string): string[] {
  const db = getDb();
  const last = db.getFirstSync<{ id: string }>(
    `SELECT id FROM sessions WHERE user_id = ? AND ended_at IS NOT NULL ORDER BY date DESC LIMIT 1`,
    [userId]
  );
  if (!last) return [];
  const rows = db.getAllSync<{ exercise_id: string }>(
    `SELECT DISTINCT exercise_id FROM exercise_results WHERE session_id = ?`,
    [last.id]
  );
  return rows.map((r) => r.exercise_id);
}

function rowToSession(row: any): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    totalScore: row.total_score,
    exercisesPlanned: row.exercises_planned,
    exercisesCompleted: row.exercises_completed,
  };
}

// ---------------------------------------------------------------------------
// Difficulty
// ---------------------------------------------------------------------------

export function getExerciseDifficulty(userId: string, exerciseId: string): number {
  const db = getDb();
  const row = db.getFirstSync<{ current_difficulty: number }>(
    `SELECT current_difficulty FROM exercise_difficulty WHERE user_id = ? AND exercise_id = ?`,
    [userId, exerciseId]
  );
  return row?.current_difficulty ?? 3; // gentle onboarding default
}

export function setExerciseDifficulty(userId: string, exerciseId: string, value: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO exercise_difficulty (user_id, exercise_id, current_difficulty, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, exercise_id) DO UPDATE SET current_difficulty = excluded.current_difficulty, updated_at = excluded.updated_at`,
    [userId, exerciseId, value, now]
  );
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export function getStreakInfo(userId: string): StreakInfo {
  const db = getDb();
  const row = db.getFirstSync<any>(`SELECT * FROM streaks WHERE user_id = ?`, [userId]);
  if (!row) return { userId, currentStreak: 0, longestStreak: 0, lastSessionDate: null };
  return {
    userId: row.user_id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastSessionDate: row.last_session_date,
  };
}

export function saveStreakInfo(info: StreakInfo): void {
  const db = getDb();
  db.runSync(
    `INSERT INTO streaks (user_id, current_streak, longest_streak, last_session_date)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       current_streak = excluded.current_streak,
       longest_streak = excluded.longest_streak,
       last_session_date = excluded.last_session_date`,
    [info.userId, info.currentStreak, info.longestStreak, info.lastSessionDate]
  );
}

// ---------------------------------------------------------------------------
// Domain stats (materialized rollup)
// ---------------------------------------------------------------------------

const ALL_DOMAINS: Domain[] = ['memory', 'logic', 'focus', 'problemSolving', 'reasoning'];

export function recomputeDomainStats(userId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  for (const domain of ALL_DOMAINS) {
    const agg = db.getFirstSync<{
      cnt: number;
      avgScore: number | null;
      avgDiff: number | null;
      best: number | null;
    }>(
      `SELECT
         COUNT(*) as cnt,
         AVG(score) as avgScore,
         AVG(difficulty) as avgDiff,
         MAX(score) as best
       FROM exercise_results er
       JOIN sessions s ON s.id = er.session_id
       WHERE s.user_id = ? AND er.domain = ? AND er.completed_at >= datetime('now', '-30 day')`,
      [userId, domain]
    );
    if (!agg || agg.cnt === 0) continue;
    db.runSync(
      `INSERT INTO domain_stats (user_id, domain, sessions_count, avg_score_30d, avg_difficulty_30d, best_score, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, domain) DO UPDATE SET
         sessions_count = excluded.sessions_count,
         avg_score_30d = excluded.avg_score_30d,
         avg_difficulty_30d = excluded.avg_difficulty_30d,
         best_score = MAX(domain_stats.best_score, excluded.best_score),
         updated_at = excluded.updated_at`,
      [userId, domain, agg.cnt, agg.avgScore ?? 0, agg.avgDiff ?? 0, agg.best ?? 0, now]
    );
  }
}

export function getDomainStats(userId: string): DomainStat[] {
  const db = getDb();
  const rows = db.getAllSync<any>(`SELECT * FROM domain_stats WHERE user_id = ?`, [userId]);
  return rows.map((r) => ({
    userId: r.user_id,
    domain: r.domain,
    sessionsCount: r.sessions_count,
    avgScore30d: r.avg_score_30d,
    avgDifficulty30d: r.avg_difficulty_30d,
    bestScore: r.best_score,
    updatedAt: r.updated_at,
  }));
}
