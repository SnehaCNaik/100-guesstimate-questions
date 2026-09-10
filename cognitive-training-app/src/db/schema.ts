/**
 * Raw DDL, executed once at boot by database.ts inside a migration runner.
 * See docs/DATABASE_SCHEMA.md for the full data-dictionary + ER overview.
 */
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  total_score REAL,
  exercises_planned INTEGER NOT NULL,
  exercises_completed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date);

CREATE TABLE IF NOT EXISTS exercise_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  exercise_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  score REAL NOT NULL,
  accuracy REAL NOT NULL,
  time_ms INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  metadata_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_results_exercise ON exercise_results(exercise_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_results_domain ON exercise_results(domain, completed_at);
CREATE INDEX IF NOT EXISTS idx_results_session ON exercise_results(session_id);

CREATE TABLE IF NOT EXISTS streaks (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_session_date TEXT
);

CREATE TABLE IF NOT EXISTS exercise_difficulty (
  user_id TEXT NOT NULL REFERENCES users(id),
  exercise_id TEXT NOT NULL,
  current_difficulty INTEGER NOT NULL DEFAULT 3,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS domain_stats (
  user_id TEXT NOT NULL REFERENCES users(id),
  domain TEXT NOT NULL,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  avg_score_30d REAL NOT NULL DEFAULT 0,
  avg_difficulty_30d REAL NOT NULL DEFAULT 0,
  best_score REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, domain)
);
`;
