import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing } from '../../theme/typography';
import type { ExerciseProps } from '../../types';

/**
 * Focus/attention domain (Stroop-style). Full mechanics/formulas in
 * docs/EXERCISE_MECHANICS.md §3. Word text always accompanies the ink
 * color so the drill (and its scoring) never depends on hue discrimination
 * alone — see the accessibility note there.
 */

const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'] as const;
type ColorName = (typeof COLOR_NAMES)[number];

const INK: Record<ColorName, string> = {
  RED: '#FF6B6B',
  BLUE: '#5B8CFF',
  GREEN: '#33D69F',
  YELLOW: '#F5D142',
  PURPLE: '#C084FC',
};

function paramsForDifficulty(difficulty: number) {
  const rounds = 8 + difficulty;
  const timeLimitMs = Math.max(550, Math.min(1600, 1600 - difficulty * 90));
  return { rounds, timeLimitMs };
}

interface Round {
  word: ColorName;
  inkColor: string;
  isMatch: boolean;
}

function generateRound(): Round {
  const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  const isMatch = Math.random() < 0.5;
  const inkColor = isMatch
    ? INK[word]
    : INK[
        COLOR_NAMES.filter((c) => c !== word)[
          Math.floor(Math.random() * (COLOR_NAMES.length - 1))
        ]
      ];
  return { word, inkColor, isMatch };
}

export default function ColorMatchGame({ difficulty, onComplete }: ExerciseProps) {
  const { rounds, timeLimitMs } = useMemo(() => paramsForDifficulty(difficulty), [difficulty]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<Round>(() => generateRound());
  const [locked, setLocked] = useState(false);

  const shownAtRef = useRef(Date.now());
  const totalStartRef = useRef(Date.now());
  const correctCountRef = useRef(0);
  const reactionTimesRef = useRef<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    shownAtRef.current = Date.now();
    setLocked(false);
    timeoutRef.current = setTimeout(() => {
      handleAnswer(null); // timed out = counted as wrong, no reaction time recorded
    }, timeLimitMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  function handleAnswer(userSaidMatch: boolean | null) {
    if (locked) return;
    setLocked(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const reactionMs = Date.now() - shownAtRef.current;
    const timedOut = userSaidMatch === null;
    const correct = !timedOut && userSaidMatch === round.isMatch;
    if (correct) {
      correctCountRef.current += 1;
      reactionTimesRef.current.push(reactionMs);
    }

    const nextIndex = roundIndex + 1;
    if (nextIndex >= rounds) {
      finish();
    } else {
      setTimeout(() => {
        setRound(generateRound());
        setRoundIndex(nextIndex);
      }, 120);
    }
  }

  function finish() {
    const accuracy = correctCountRef.current / rounds;
    const reactions = reactionTimesRef.current;
    const avgReactionMs =
      reactions.length > 0 ? reactions.reduce((a, b) => a + b, 0) / reactions.length : timeLimitMs;
    const score = Math.round(
      accuracy * 70 + Math.max(0, Math.min(30, 30 - avgReactionMs / 40))
    );
    onComplete({
      score,
      accuracy,
      timeMs: Date.now() - totalStartRef.current,
      metadata: { rounds, avgReactionMs },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        Round {roundIndex + 1} / {rounds}
      </Text>
      <Text style={[styles.word, { color: round.inkColor }]}>{round.word}</Text>
      <Text style={styles.prompt}>Does the word match its color?</Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={locked}
          onPress={() => handleAnswer(true)}
          style={[styles.answerButton, { backgroundColor: colors.success }]}
        >
          <Text style={styles.answerButtonText}>MATCH</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={locked}
          onPress={() => handleAnswer(false)}
          style={[styles.answerButton, { backgroundColor: colors.danger }]}
        >
          <Text style={styles.answerButtonText}>NO MATCH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  progress: { ...typography.caption, color: colors.textMuted },
  word: { fontSize: 48, fontWeight: '800' },
  prompt: { ...typography.body, color: colors.textSecondary },
  buttonsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  answerButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    minWidth: 130,
    alignItems: 'center',
  },
  answerButtonText: { ...typography.bodyStrong, color: '#06101F' },
});
