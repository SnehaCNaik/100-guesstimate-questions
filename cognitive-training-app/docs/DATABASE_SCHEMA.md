# Database Schema — local SQLite (`expo-sqlite`)

Single file, on-device, no sync. Schema lives in `src/db/schema.ts` as raw
`CREATE TABLE` statements executed once at boot inside a migrations runner
(`src/db/database.ts`), guarded by a `schema_version` row so re-installing
or upgrading the app never wipes history.

## ER overview

```
users (1) ───< sessions (1) ───< exercise_results
  │
  ├──< streaks              (1:1 per user)
  ├──< exercise_difficulty  (1:many, one row per exercise the user has played)
  └──< domain_stats         (1:many, one row per domain — materialized rollup)
```

## Tables

### `users`
Single local profile in the MVP (multi-profile is a Roadmap Phase-4 item —
the schema already supports it since every other table is keyed by `user_id`).

| column | type | notes |
|---|---|---|
| `id` | TEXT PK | UUID, generated on first launch |
| `created_at` | TEXT | ISO 8601 |

### `sessions`
One row per daily session (a session = one sitting of ~4 exercises).

| column | type | notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `user_id` | TEXT FK → users.id | |
| `date` | TEXT | `YYYY-MM-DD`, local date — the key streak logic uses |
| `started_at` | TEXT | ISO 8601 |
| `ended_at` | TEXT NULL | set on `closeSession`; NULL while a session is in progress |
| `total_score` | REAL NULL | mean of the session's exercise scores, 0–100 |
| `exercises_planned` | INTEGER | how many exercises were queued (usually 4) |
| `exercises_completed` | INTEGER | how many the user actually finished |

Index: `(user_id, date)` — one query answers "did the user already train today?"

### `exercise_results`
One row per completed exercise round (append-only — this is the full history
the dashboard's trend lines are computed from).

| column | type | notes |
|---|---|---|
| `id` | TEXT PK | UUID |
| `session_id` | TEXT FK → sessions.id | |
| `exercise_id` | TEXT | e.g. `"sequence-recall"` — see `registry.ts` |
| `domain` | TEXT | `memory` \| `logic` \| `focus` \| `problemSolving` \| `reasoning` |
| `difficulty` | INTEGER | 1–10, the difficulty this round was *played at* |
| `score` | REAL | 0–100, normalized (see `EXERCISE_MECHANICS.md` per-exercise formula) |
| `accuracy` | REAL | 0–1 |
| `time_ms` | INTEGER | wall-clock time for the round |
| `completed_at` | TEXT | ISO 8601 |
| `metadata_json` | TEXT NULL | exercise-specific extra data (e.g. sequence length reached), JSON-encoded |

Index: `(exercise_id, completed_at)`, `(domain, completed_at)`.

### `streaks`
One row per user (1:1). Updated by `streakEngine.recordSessionCompleted`.

| column | type | notes |
|---|---|---|
| `user_id` | TEXT PK/FK | |
| `current_streak` | INTEGER | consecutive days with ≥1 completed session |
| `longest_streak` | INTEGER | high-water mark |
| `last_session_date` | TEXT NULL | `YYYY-MM-DD`, used to detect "already trained today" vs "streak broken" |

### `exercise_difficulty`
Adaptive difficulty state, one row per `(user, exercise)` the user has ever played.

| column | type | notes |
|---|---|---|
| `user_id` | TEXT | |
| `exercise_id` | TEXT | |
| `current_difficulty` | INTEGER | 1–10, defaults to 3 (gentle onboarding) on first play |
| `updated_at` | TEXT | ISO 8601 |

PK: `(user_id, exercise_id)`.

### `domain_stats`
Materialized rollup, recomputed after every `closeSession` call so the
dashboard never has to scan all of `exercise_results` on screen open.

| column | type | notes |
|---|---|---|
| `user_id` | TEXT | |
| `domain` | TEXT | |
| `sessions_count` | INTEGER | rounds played in this domain, all-time |
| `avg_score_30d` | REAL | rolling 30-day average score |
| `avg_difficulty_30d` | REAL | rolling 30-day average difficulty |
| `best_score` | REAL | all-time |
| `updated_at` | TEXT | |

PK: `(user_id, domain)`.

## Representative queries (all in `repository.ts`)

**Has the user trained today?**
```sql
SELECT 1 FROM sessions WHERE user_id = ? AND date = ? AND ended_at IS NOT NULL LIMIT 1;
```

**Per-domain 7-day trend for the dashboard sparkline:**
```sql
SELECT date(completed_at) AS day, domain, AVG(score) AS avg_score
FROM exercise_results
WHERE completed_at >= date('now', '-7 day')
GROUP BY day, domain
ORDER BY day ASC;
```

**Recent session history list:**
```sql
SELECT id, date, total_score, exercises_completed
FROM sessions
WHERE user_id = ? AND ended_at IS NOT NULL
ORDER BY date DESC
LIMIT 20;
```

**Exercises to avoid repeating today (variety rotation):**
```sql
SELECT DISTINCT exercise_id FROM exercise_results
WHERE session_id = (
  SELECT id FROM sessions WHERE user_id = ? AND ended_at IS NOT NULL
  ORDER BY date DESC LIMIT 1
);
```
