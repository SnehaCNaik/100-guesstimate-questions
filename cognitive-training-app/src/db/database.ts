import * as SQLite from 'expo-sqlite';
import uuid from 'react-native-uuid';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('neurolap.db');
  }
  return dbInstance;
}

/**
 * Idempotent migration runner. Safe to call on every app boot — CREATE
 * TABLE IF NOT EXISTS means re-running never wipes existing rows.
 */
export function runMigrations(): void {
  const db = getDb();
  db.execSync(CREATE_TABLES_SQL);
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'schema_version'`
  );
  if (!row) {
    db.runSync(`INSERT INTO meta (key, value) VALUES ('schema_version', ?)`, [
      String(SCHEMA_VERSION),
    ]);
  }
  // Future migrations: compare row.value to SCHEMA_VERSION and ALTER TABLE as needed.
}

/**
 * The MVP is single-profile. This creates (or fetches) the one local user
 * row on first boot. Multi-profile support (Roadmap Phase 4) would swap
 * this for a real profile picker — every other table is already keyed by
 * user_id so no schema change would be needed.
 */
export function getOrCreateLocalUserId(): string {
  const db = getDb();
  const existing = db.getFirstSync<{ id: string }>(`SELECT id FROM users LIMIT 1`);
  if (existing) return existing.id;

  const id = uuid.v4() as string;
  const now = new Date().toISOString();
  db.runSync(`INSERT INTO users (id, created_at) VALUES (?, ?)`, [id, now]);
  db.runSync(
    `INSERT INTO streaks (user_id, current_streak, longest_streak, last_session_date) VALUES (?, 0, 0, NULL)`,
    [id]
  );
  return id;
}

export function initDatabase(): string {
  runMigrations();
  return getOrCreateLocalUserId();
}
