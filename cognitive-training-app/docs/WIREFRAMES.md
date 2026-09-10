# UI/UX — Key Screens

Design principles: **one primary action per screen**, generous whitespace,
no chrome competing with the exercise itself, 16–20sp minimum text,
≥4.5:1 contrast, ≥44pt tap targets. Palette and type scale live in
`src/theme/`.

## 1. Home Screen

```
┌─────────────────────────────────────┐
│  NeuroLap                      🔥 12 │  ← streak badge, top-right
│                                       │
│        Good morning, Sneha           │
│   Today's session: 4 exercises       │
│        ~12 minutes                   │
│                                       │
│   ┌───────────────────────────────┐ │
│   │  🧠 Memory · 🧩 Logic          │ │  ← chips previewing today's domains
│   │  🎯 Focus · 🔷 Reasoning       │ │     (not the exact puzzles — keeps
│   └───────────────────────────────┘ │     it fresh even if they peek)
│                                       │
│      ┌─────────────────────────┐    │
│      │      Start Session      │    │  ← the ONE primary button. Big,
│      └─────────────────────────┘    │     high contrast, first thing
│                                       │     the thumb reaches.
│                                       │
│   Last session: 82 · yesterday       │  ← quiet secondary line
│                                       │
│  ┌─────────┐              ┌────────┐ │
│  │ Progress │              │ History│ │  ← two low-emphasis nav links,
│  └─────────┘              └────────┘ │     bottom of screen
└─────────────────────────────────────┘
```

- Zero taps to *see* today's plan; **one tap** ("Start Session") to begin —
  satisfies the "1–2 taps to start" requirement.
- If the user already completed today's session, the button becomes
  "Session complete ✓ — Play a bonus round?" (secondary style, not
  pressuring another full session).
- No ads, no banner, nothing that isn't streak / plan / start.

## 2. Exercise Play Screen

```
┌─────────────────────────────────────┐
│  ✕                    Exercise 2/4   │  ← exit (confirms before discarding
│  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░              │     progress) + position in session
│                                       │
│                                       │
│         [ exercise canvas ]          │  ← the exercise component owns
│                                       │     this entire area; full-bleed,
│                                       │     no distracting labels inside
│                                       │
│                                       │
│                                       │
│              ⏱ 0:08                  │  ← only shown if the exercise is
└─────────────────────────────────────┘     timed (not all are)
```

- The top progress bar is the *only* persistent chrome — it's what makes a
  15-minute, multi-exercise session feel like one continuous flow instead of
  four separate app screens.
- Between exercises: a 1.5s non-blocking transition card ("Nice! Next up:
  Pattern Matrix") — no tap required to continue, keeps friction near zero
  mid-session while still giving a beat of feedback.
- Exiting mid-exercise discards that exercise's result only (prior
  exercises in the session are already persisted), so nothing is lost by
  bailing on one hard puzzle.

## 3. Session Summary Screen

```
┌─────────────────────────────────────┐
│           Session Complete           │
│                                       │
│              Score: 87               │  ← large, immediate
│                                       │
│   Accuracy   Time      Streak        │
│    91%       11:40      🔥 13 (+1)   │
│                                       │
│   🧠 Memory        92  ████████░░   │
│   🧩 Logic         81  ██████░░░░   │
│   🎯 Focus         88  ███████░░░   │
│   🔷 Reasoning     87  ███████░░░   │
│                                       │
│   ✨ New best: Sequence Recall (8)   │  ← only shown when true
│                                       │
│      ┌─────────────────────────┐    │
│      │      Back to Home       │    │
│      └─────────────────────────┘    │
└─────────────────────────────────────┘
```

- Score/accuracy/time/streak are the four numbers the spec calls out
  explicitly — all above the fold, no scrolling needed.
- Per-domain bars use the same domain colors as the dashboard for visual
  continuity.

## 4. Progress Dashboard

```
┌─────────────────────────────────────┐
│  Progress                            │
│                                       │
│   Current streak: 🔥 13 days         │
│   Longest streak: 21 days            │
│   [ ▢▢▢▢▢▨▨▨▨▨▨▨▨▨▨▨▨▨▨ ]  ← 30-day calendar heatmap
│                                       │
│  ── By domain (30-day avg) ──        │
│   🧠 Memory      78  ▁▂▃▅▆▇█ ↑       │  ← sparkline trend + direction
│   🧩 Logic       71  ▂▂▃▃▄▅▆ ↑       │
│   🎯 Focus       65  ▃▄▃▄▅▅▆ ↑       │
│   🔷 Reasoning   74  ▄▄▅▅▆▆▇ ↑       │
│                                       │
│  ── Recent sessions ──               │
│   Today        87   4/4 exercises    │
│   Yesterday    82   4/4 exercises    │
│   Tue          —    Missed           │
│   Mon          79   4/4 exercises    │
└─────────────────────────────────────┘
```

- This is the only screen that's allowed to be a bit denser/data-heavy — a
  user visits it deliberately to review, not mid-session.
- Sparklines use `domain_stats`/`exercise_results` rollups (see
  `DATABASE_SCHEMA.md`), so the screen never scans the full history table.
