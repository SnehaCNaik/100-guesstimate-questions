import SequenceRecallGame from './memory/SequenceRecallGame';
import PatternMatrixGame from './logic/PatternMatrixGame';
import ColorMatchGame from './focus/ColorMatchGame';
import type { ExerciseDefinition } from '../types';

/**
 * All exercises in the app. Adding a new one is additive: write a component
 * matching ExerciseProps, add one entry here — no other file needs to
 * change (docs/ROADMAP.md Phase 2 lists the next ones to build:
 * mini-sudoku / maze / riddles / spot-the-difference for `problemSolving`,
 * a second `memory` exercise, etc).
 *
 * Pattern Matrix is registered twice, once per domain it legitimately
 * exercises (docs/EXERCISE_MECHANICS.md §2 — it's a logic AND reasoning
 * task) so the MVP's 4-exercise session covers memory / logic / focus /
 * reasoning without needing a bespoke reasoning-only puzzle yet.
 */
export const EXERCISE_REGISTRY: ExerciseDefinition[] = [
  {
    id: 'sequence-recall',
    name: 'Sequence Recall',
    domain: 'memory',
    description: 'Watch the tiles light up, then tap them back in order.',
    Component: SequenceRecallGame,
  },
  {
    id: 'pattern-matrix-logic',
    name: 'Pattern Matrix',
    domain: 'logic',
    description: 'Work out the rule and complete the grid.',
    Component: PatternMatrixGame,
  },
  {
    id: 'pattern-matrix-reasoning',
    name: 'Pattern Matrix',
    domain: 'reasoning',
    description: 'Spot the underlying relationship and pick what fits.',
    Component: PatternMatrixGame,
  },
  {
    id: 'color-match',
    name: 'Color Match',
    domain: 'focus',
    description: 'Decide fast: does the word match its ink color?',
    Component: ColorMatchGame,
  },
];

export function getExerciseById(id: string): ExerciseDefinition | undefined {
  return EXERCISE_REGISTRY.find((e) => e.id === id);
}
