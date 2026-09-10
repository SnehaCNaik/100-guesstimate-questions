# Architecture & Feature Specification — NeuroLap

**NeuroLap** is a daily brain-training app: five cognitive domains, a 10–15 minute
session, adaptive difficulty, and a local-only progress history. No accounts,
no ads, no push notifications competing for attention during a session.

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| App framework | **React Native + Expo (TypeScript)**, managed workflow | One codebase → iOS + Android. Expo Go lets a non-native-toolchain developer run the app on a real phone in minutes (`npx expo start`, scan QR code). No Xcode/Android Studio required for day-to-day dev. |
| Navigation | `@react-navigation/native` + native-stack | Standard, well-documented, small API surface. |
| Local database | `expo-sqlite` (synchronous API, SDK 51+) | Real relational storage, survives app restarts, supports the aggregate queries the dashboard needs (streaks, per-domain averages, trend lines) without hand-rolled JSON parsing. `AsyncStorage` was considered but rejected — it's a flat key/value store and would force us to reimplement joins/aggregation in JS. |
| State management | React Context (`SessionContext`, `ProgressContext`) + component-local state | The app's state is small and mostly *derived from SQLite reads*, not shared mutable client state. Redux/MobX would be overhead with no payoff at this scale. |
| Styling | `StyleSheet` + a single `theme/` module (no UI kit) | Keeps bundle small, keeps full control over contrast/accessibility, avoids fighting a component library's defaults during a focus-critical UI. |

No backend. No network calls at runtime. This is a deliberate MVP decision — see `ROADMAP.md` for the optional Phase 4 sync layer.

## 2. Module map

```
cognitive-training-app/
├── App.tsx                     # navigation container + DB init on boot
├── src/
│   ├── types/index.ts          # Domain, ExerciseResult, ExerciseDefinition, etc.
│   ├── theme/                  # colors.ts, typography.ts, spacing.ts
│   ├── db/
│   │   ├── schema.ts           # CREATE TABLE statements + migrations
│   │   ├── database.ts         # opens the DB, runs migrations once at boot
│   │   └── repository.ts       # all reads/writes go through here — nothing
│   │                           #   else touches SQL directly
│   ├── engine/
│   │   ├── difficultyEngine.ts # per-exercise adaptive difficulty (1–10)
│   │   ├── streakEngine.ts     # daily streak calculation
│   │   └── sessionPlanner.ts   # picks today's exercise set (variety rotation)
│   ├── exercises/
│   │   ├── registry.ts         # maps exerciseId -> ExerciseDefinition
│   │   ├── memory/SequenceRecallGame.tsx
│   │   ├── logic/PatternMatrixGame.tsx
│   │   └── focus/ColorMatchGame.tsx
│   ├── components/             # PrimaryButton, ProgressBar, StreakBadge, ...
│   ├── navigation/RootNavigator.tsx
│   └── screens/
│       ├── HomeScreen.tsx
│       ├── ExercisePlayScreen.tsx
│       ├── SessionSummaryScreen.tsx
│       └── ProgressDashboardScreen.tsx
└── docs/                        # this spec
```

### Design rule: exercises are pure, self-contained components

Every exercise implements the same contract (`src/types/index.ts`):

```ts
type ExerciseProps = {
  difficulty: number; // 1–10, assigned by difficultyEngine before mount
  onComplete: (result: ExerciseRunResult) => void;
};
```

An exercise owns its own internal game state (timers, board state, input
handling) and calls `onComplete({ score, accuracy, timeMs, metadata })`
exactly once, when the round ends. `ExercisePlayScreen` doesn't know or care
*how* an exercise works internally — it just mounts the component for the
`exerciseId` the session planner picked, and forwards the result to the
engine layer. This is what makes "add a new exercise type" a self-contained
task (see `ROADMAP.md` Phase 2): write one component, register it, done.

## 3. Data flow

```
App boot
  └─ database.ts: openDatabaseSync + run migrations (idempotent)

HomeScreen
  └─ sessionPlanner.buildTodaySession(userId)
       reads: exercise_difficulty, exercise_results (recent domains/exercises)
       returns: ExerciseDefinition[4] (today's rotation, one tap away)
  └─ streakEngine.getCurrentStreak(userId)  →  shown as the streak badge

  [user taps "Start Session" — 1 tap]

ExercisePlayScreen (loops through the planned exercises)
  └─ mounts exercises[i].Component with difficulty = difficultyEngine.get(userId, exerciseId)
  └─ onComplete(result)
       → repository.recordExerciseResult(sessionId, result)
       → difficultyEngine.update(userId, exerciseId, result)   // adapts next time
       → advance to exercises[i+1], or → SessionSummaryScreen if done

SessionSummaryScreen
  └─ repository.closeSession(sessionId, aggregateScore)
  └─ streakEngine.recordSessionCompleted(userId, today)
  └─ shows: score, accuracy, time, streak delta, "New personal best" banners

ProgressDashboardScreen
  └─ repository.getDomainStats(userId)     → per-domain avg score/difficulty trend
  └─ repository.getStreakInfo(userId)      → current/longest streak, calendar heatmap
  └─ repository.getRecentSessions(userId)  → session history list
```

Everything is local and synchronous-ish (SQLite sync API on tiny tables —
a session produces ~4 rows). There is no loading spinner anywhere in the
core loop; this matters for the "10–15 minutes, minimal friction" requirement.

## 4. Adaptive difficulty (summary — full formulas in `EXERCISE_MECHANICS.md`)

Difficulty is tracked **per exercise, per user**, on a 1–10 scale, in the
`exercise_difficulty` table. After each round:

- accuracy ≥ 0.85 **and** finished under the exercise's target time → difficulty + 1 (cap 10)
- accuracy < 0.5 → difficulty − 1 (floor 1)
- otherwise → unchanged

This is intentionally simple (no ELO/IRT model) so it's transparent and
debuggable, and because with ~4 short exercises/day, a heavier model has no
extra signal to work with. Each exercise component receives the resulting
`difficulty: number` and is responsible for translating it into concrete
parameters (sequence length, grid size, timer, distractor count).

## 5. Session variety rotation

`sessionPlanner.ts` builds a 4-exercise session covering 4 *different*
domains, preferring exercises **not** played in the immediately preceding
session (read from `exercise_results` ordered by `completed_at desc`,
grouped by session). If the exercise pool for a domain has only one entry
(true in the MVP — see Roadmap Phase 2 for expanding the pool), it's allowed
to repeat but the *difficulty* will already have adapted, so it doesn't feel
identical two days running.

## 6. Accessibility & focus-mode constraints

- Minimum body text size 16sp / display text 20sp+ (`theme/typography.ts`).
- All color pairs in `theme/colors.ts` are chosen for **≥ 4.5:1 contrast**
  against their background (checked against WCAG AA for normal text).
- Touch targets ≥ 44×44 pt (`theme/spacing.ts` exposes a `hitSlop` helper).
- The Color-Match focus exercise deliberately does **not** rely on color
  alone to convey correctness — text labels always accompany color, so the
  app remains usable for color-vision-deficient users (this is a design
  constraint on the exercise itself, not just chrome).
- No `expo-notifications` dependency at all in the MVP — the app cannot nag
  the user by construction, not just by configuration.

## 7. Why not native Swift/Kotlin

Two native codebases would double the exercise-implementation cost (each of
the 5+ exercise types would be written twice) for a solo/small-team build
target, with no feature in this spec (haptics, simple 2D game boards, local
SQLite, no camera/AR/background processing) that requires native code.
React Native + Expo is the more feasible choice for "one developer builds
and ships this to their own phone."
