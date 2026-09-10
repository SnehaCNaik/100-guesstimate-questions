# NeuroLap — daily brain training

A daily, 10–15 minute cognitive-training app: memory, logic, focus, and
reasoning exercises, adaptive difficulty, streak tracking, and a fully
local (offline, no-account) progress history. No ads. No notifications
interrupting a session — the app cannot nag you by construction, since it
doesn't even depend on `expo-notifications` in the MVP.

Built with **React Native + Expo (TypeScript)** so it runs on both iOS and
Android from one codebase, and so you can be testing it on your own phone
via **Expo Go** within minutes — no Xcode/Android Studio required to start.

## Quickstart (run it on your phone)

```bash
cd cognitive-training-app
npm install
npx expo install --fix   # aligns dependency versions to your installed Expo SDK
npx expo start
```

Then scan the QR code with the **Expo Go** app (iOS: Camera app; Android:
Expo Go's own scanner). The app boots straight to Home — tap **Start
Session** and play a full round to confirm everything's wired up.

## What's in this folder

| Path | What it is |
|---|---|
| `docs/ARCHITECTURE.md` | Full architecture, module map, data flow, and rationale for the stack |
| `docs/DATABASE_SCHEMA.md` | SQLite schema, ER overview, representative queries |
| `docs/EXERCISE_MECHANICS.md` | Pseudocode + scoring formulas for every exercise, implemented and planned |
| `docs/WIREFRAMES.md` | Layout/UX spec for Home, Exercise Play, Session Summary, and Progress Dashboard |
| `docs/ROADMAP.md` | Phased build plan: MVP (this scaffold) → variety expansion → polish → optional extras |
| `src/` | The actual app — see below |

## What's implemented right now

- **3 working exercises**, one per domain, real interactive logic (not
  stubs): `Sequence Recall` (memory), `Pattern Matrix` (logic + reasoning),
  `Color Match` (focus/Stroop-style attention drill)
- **Adaptive difficulty** per exercise, per user, 1–10 scale, updated after
  every round (`src/engine/difficultyEngine.ts`)
- **Daily streak tracking**, calendar-correct (handles "already trained
  today" vs. a broken streak) (`src/engine/streakEngine.ts`)
- **Session variety rotation** — today's 4-exercise line-up avoids repeating
  yesterday's exact exercises where a domain has more than one to choose
  from (`src/engine/sessionPlanner.ts`)
- **Local SQLite database** tracking every session and every exercise round
  ever played, plus materialized per-domain rollups for the dashboard
  (`src/db/`)
- **4 screens**: Home → Exercise Play → Session Summary → Progress
  Dashboard, matching `docs/WIREFRAMES.md`
- **Accessibility-conscious theme**: ≥4.5:1 contrast pairs, 16sp+ text,
  ≥44pt tap targets, and the focus exercise never relies on color alone
  (`src/theme/`)

See `docs/ROADMAP.md` Phase 2 for the next exercises to add (mini Sudoku,
mazes, riddles, spot-the-difference) — each is a self-contained component
you register in `src/exercises/registry.ts`, no other file changes needed.

## Project layout

```
App.tsx                      # boots the DB, then renders navigation
src/
  types/                     # shared TypeScript contracts
  theme/                     # colors, typography, spacing
  db/                        # schema, migrations, repository (all SQL lives here)
  engine/                    # difficulty / streak / session-planning logic
  exercises/                 # one folder per domain, one file per exercise
  components/                # PrimaryButton, ProgressBar, StreakBadge
  navigation/                # React Navigation stack
  screens/                   # Home, ExercisePlay, SessionSummary, ProgressDashboard
```
