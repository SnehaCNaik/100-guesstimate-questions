# Implementation Roadmap

## Phase 0 — Project setup (½ day)
- [ ] `npx create-expo-app cognitive-training-app -t expo-template-blank-typescript` (or use this scaffold directly)
- [ ] `npm install` the dependencies in `package.json`
- [ ] `npx expo install expo-sqlite @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context` — using `expo install` (not plain `npm install`) so versions match your Expo SDK
- [ ] `npx expo start` → scan the QR code with **Expo Go** on your phone → confirm the blank app boots

## Phase 1 — MVP (the deliverable in this scaffold; ~1–2 weeks part-time)
- [x] SQLite schema + migrations (`src/db`)
- [x] Difficulty engine, streak engine, session planner (`src/engine`)
- [x] 3 exercise types, one per domain family: Sequence Recall (memory),
      Pattern Matrix (logic/reasoning), Color Match (focus)
- [x] Home → Play → Summary → Dashboard screen flow
- [x] Streak tracking visible on Home + Dashboard
- [ ] **Your first task after cloning:** run it on your phone, play a full
      session end-to-end, and confirm a row lands in each of `sessions`,
      `exercise_results`, `streaks` (use `npx expo-sqlite-cli` or a quick
      debug screen — see note below)
- [ ] Polish pass: replace placeholder shape icons in Pattern Matrix with
      nicer assets if desired (functional with plain colored views as-is)

**Definition of done for Phase 1:** you can do a real 10–15 minute session
daily on your own phone, your streak increments correctly across real
calendar days, and the dashboard reflects true history after a week of use.

## Phase 2 — Exercise variety (expand the pool)
Each item below is additive — write one component matching `ExerciseProps`,
register it in `src/exercises/registry.ts`, done:
- [ ] Mini Sudoku (4×4/6×6) — `problemSolving`/`logic`
- [ ] Maze navigation — `problemSolving`
- [ ] Analogies — `reasoning`
- [ ] Riddles / lateral-thinking bank — `problemSolving`
- [ ] Spot-the-difference — `focus`
- [ ] Card-flip / matching-pairs — `memory` (a second memory exercise so
      `sessionPlanner` has real rotation options within the memory domain)

Once ≥2 exercises exist per domain, revisit `sessionPlanner.ts`'s
"avoid yesterday's exact exercise" rule — with more pool depth it can
prefer *domain* variety AND *exercise* variety simultaneously.

## Phase 3 — Retention & polish
- [ ] Dark mode (the theme module is already token-based — add a dark palette
      and a `useColorScheme()` switch, no component changes needed)
- [ ] Settings screen: session length (3/4/5 exercises), optional single
      daily local reminder (opt-in, off by default — stay true to "no
      interrupting notifications" as the default posture)
- [ ] Accessibility audit pass: VoiceOver/TalkBack labels on every
      interactive element, dynamic type scaling test
- [ ] App icon, splash screen, store listing assets
- [ ] `eas build` to produce a real installable binary (still free/local
      for personal use — no store submission required to have it on your
      own phone permanently, outside Expo Go)

## Phase 4 — Optional expansion (only if you want it — MVP is complete without these)
- [ ] Cloud backup of the local SQLite data (e.g. periodic export to a
      user-owned storage backend) so a phone swap doesn't lose history
- [ ] Multi-profile support (schema already supports it — every table is
      keyed by `user_id`)
- [ ] Home-screen widget showing streak + "Start Session" deep link
- [ ] Optional social layer (compare weekly average with friends) — treat
      this as strictly optional; it's not needed for the core value
      proposition and adds real privacy/backend surface area
