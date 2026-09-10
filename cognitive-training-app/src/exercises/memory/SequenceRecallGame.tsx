import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing } from '../../theme/typography';
import type { ExerciseProps } from '../../types';

/**
 * Memory domain. Full mechanics/formulas in docs/EXERCISE_MECHANICS.md §1.
 * Flow: PLAYBACK (tiles light up in a generated order) -> INPUT (user taps
 * them back in the same order) -> DONE.
 */

type Phase = 'playback' | 'input' | 'done';

function paramsForDifficulty(difficulty: number) {
  const gridSize = difficulty >= 7 ? 4 : 3;
  const sequenceLen = 3 + Math.floor(difficulty / 2);
  const flashMs = Math.max(250, Math.min(700, 700 - difficulty * 40));
  return { gridSize, sequenceLen, flashMs };
}

function pickSequence(tileCount: number, length: number): number[] {
  const indices = Array.from({ length: tileCount }, (_, i) => i);
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * indices.length);
    seq.push(indices[idx]);
    indices.splice(idx, 1);
    if (indices.length === 0) break; // sequenceLen capped by tileCount
  }
  return seq;
}

export default function SequenceRecallGame({ difficulty, onComplete }: ExerciseProps) {
  const { gridSize, sequenceLen, flashMs } = useMemo(
    () => paramsForDifficulty(difficulty),
    [difficulty]
  );
  const tileCount = gridSize * gridSize;
  const sequence = useMemo(() => pickSequence(tileCount, sequenceLen), [tileCount, sequenceLen]);

  const [phase, setPhase] = useState<Phase>('playback');
  const [litTile, setLitTile] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function playback() {
      for (let i = 0; i < sequence.length; i++) {
        if (cancelled) return;
        setLitTile(sequence[i]);
        await wait(flashMs);
        if (cancelled) return;
        setLitTile(null);
        await wait(150);
      }
      if (!cancelled) {
        startTimeRef.current = Date.now();
        setPhase('input');
      }
    }
    playback();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(success: boolean, failedAtIndex: number) {
    const timeMs = Date.now() - startTimeRef.current;
    const accuracy = success ? 1 : failedAtIndex / sequence.length;
    const score = Math.round(accuracy * 70 + (success ? 30 : 0));
    setPhase('done');
    onComplete({
      score,
      accuracy,
      timeMs,
      metadata: { sequenceLen: sequence.length, gridSize },
    });
  }

  function onTilePress(tileIndex: number) {
    if (phase !== 'input') return;
    const expected = sequence[cursor];
    if (tileIndex === expected) {
      const nextCursor = cursor + 1;
      setCursor(nextCursor);
      if (nextCursor === sequence.length) {
        finish(true, nextCursor);
      }
    } else {
      setWrongTile(tileIndex);
      finish(false, cursor);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>
        {phase === 'playback' ? 'Watch the sequence…' : phase === 'input' ? 'Repeat it back' : 'Nice!'}
      </Text>
      <View style={[styles.grid, { width: gridSize * 76 }]}>
        {Array.from({ length: tileCount }, (_, i) => {
          const isLit = litTile === i;
          const isWrong = wrongTile === i;
          return (
            <TouchableOpacity
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`tile ${i + 1}`}
              activeOpacity={0.8}
              disabled={phase !== 'input'}
              onPress={() => onTilePress(i)}
              style={[
                styles.tile,
                isLit && styles.tileLit,
                isWrong && styles.tileWrong,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.progress}>
        {phase === 'input' ? `${cursor} / ${sequence.length}` : ' '}
      </Text>
    </View>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  instructions: { ...typography.h2, color: colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  tile: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileLit: { backgroundColor: colors.domain.memory },
  tileWrong: { backgroundColor: colors.danger },
  progress: { ...typography.bodyStrong, color: colors.textSecondary },
});
