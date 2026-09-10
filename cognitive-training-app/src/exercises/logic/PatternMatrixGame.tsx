import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing } from '../../theme/typography';
import type { ExerciseProps } from '../../types';

/**
 * Logic/Reasoning domain. Full mechanics/formulas in
 * docs/EXERCISE_MECHANICS.md §2. A deterministic rule over (row, col)
 * generates the grid, so there is always exactly one correct answer and no
 * puzzle bank is needed.
 */

const SHAPES = ['circle', 'square', 'triangle', 'star', 'hexagon', 'diamond'] as const;
type Shape = (typeof SHAPES)[number];
type Rule = 'row-cycle' | 'col-cycle' | 'diagonal-cycle';

function paramsForDifficulty(difficulty: number) {
  const numShapes = Math.max(3, Math.min(6, 3 + Math.floor(difficulty / 3)));
  const eligibleRules: Rule[] =
    difficulty >= 5 ? ['row-cycle', 'col-cycle', 'diagonal-cycle'] : ['row-cycle', 'col-cycle'];
  const rule = eligibleRules[Math.floor(Math.random() * eligibleRules.length)];
  return { numShapes, rule };
}

function shapeAt(row: number, col: number, rule: Rule, numShapes: number): Shape {
  let idx: number;
  switch (rule) {
    case 'row-cycle':
      idx = (row + col) % numShapes;
      break;
    case 'col-cycle':
      idx = (col * 2 + row) % numShapes;
      break;
    case 'diagonal-cycle':
      idx = (row + col * 2) % numShapes;
      break;
  }
  return SHAPES[idx];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PatternMatrixGame({ difficulty, onComplete }: ExerciseProps) {
  const { numShapes, rule } = useMemo(() => paramsForDifficulty(difficulty), [difficulty]);
  const startTimeRef = useRef(Date.now());

  const blank = useMemo(
    () => ({ row: Math.floor(Math.random() * 3), col: Math.floor(Math.random() * 3) }),
    []
  );
  const correctAnswer = useMemo(
    () => shapeAt(blank.row, blank.col, rule, numShapes),
    [blank, rule, numShapes]
  );
  const options = useMemo(() => {
    const distractorPool = SHAPES.filter((s) => s !== correctAnswer).slice(0, numShapes - 1);
    const distractors = shuffle(distractorPool).slice(0, 3);
    return shuffle([correctAnswer, ...distractors]);
  }, [correctAnswer, numShapes]);

  const [selected, setSelected] = useState<Shape | null>(null);

  function onSelect(choice: Shape) {
    if (selected) return;
    setSelected(choice);
    const timeMs = Date.now() - startTimeRef.current;
    const correct = choice === correctAnswer;
    const accuracy = correct ? 1 : 0;
    const score = correct ? Math.max(40, Math.min(100, 100 - Math.floor(timeMs / 200))) : 0;
    setTimeout(() => {
      onComplete({ score, accuracy, timeMs, metadata: { rule, numShapes } });
    }, 450); // brief beat so the user sees their selection highlighted
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>Complete the pattern</Text>
      <View style={styles.grid}>
        {Array.from({ length: 3 }, (_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: 3 }, (_, col) => {
              const isBlank = row === blank.row && col === blank.col;
              return (
                <View key={col} style={styles.cell}>
                  {!isBlank ? (
                    <ShapeGlyph shape={shapeAt(row, col, rule, numShapes)} />
                  ) : (
                    <Text style={styles.blankMark}>?</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.options}>
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrectReveal = selected && opt === correctAnswer;
          return (
            <TouchableOpacity
              key={opt}
              accessibilityRole="button"
              accessibilityLabel={`option ${opt}`}
              disabled={!!selected}
              onPress={() => onSelect(opt)}
              style={[
                styles.optionCell,
                isSelected && !isCorrectReveal && styles.optionWrong,
                isCorrectReveal && styles.optionCorrect,
              ]}
            >
              <ShapeGlyph shape={opt} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const SHAPE_LABEL: Record<Shape, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  star: '★',
  hexagon: '⬡',
  diamond: '◆',
};

function ShapeGlyph({ shape }: { shape: Shape }) {
  return <Text style={styles.shapeGlyph}>{SHAPE_LABEL[shape]}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  instructions: { ...typography.h2, color: colors.textPrimary },
  grid: { gap: spacing.sm },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  cell: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankMark: { ...typography.h1, color: colors.textMuted },
  shapeGlyph: { fontSize: 30, color: colors.domain.logic },
  options: { flexDirection: 'row', gap: spacing.md },
  optionCell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCorrect: { borderColor: colors.success, borderWidth: 2 },
  optionWrong: { borderColor: colors.danger, borderWidth: 2 },
});
