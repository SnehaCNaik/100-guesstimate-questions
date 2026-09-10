import React, { useMemo, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { startSession, recordExerciseResult, closeSession } from '../db/repository';
import { getDifficultyFor, updateDifficultyAfterResult } from '../engine/difficultyEngine';
import { recordSessionCompleted } from '../engine/streakEngine';
import { getUserId } from '../state/appState';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';
import ProgressBar from '../components/ProgressBar';
import type { ExerciseRunResult } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExercisePlay'>;

// Target time an exercise should be finished under, at its current
// difficulty, to count as fast enough for a difficulty bump. Deliberately
// generous/uniform across exercise types for MVP simplicity.
const TARGET_TIME_MS = 15000;

export default function ExercisePlayScreen({ route, navigation }: Props) {
  const { exercises } = route.params;
  const userId = getUserId();
  const sessionRef = useRef(startSession(userId, exercises.length));
  const [index, setIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const current = exercises[index];
  const difficulty = useMemo(
    () => getDifficultyFor(userId, current.id),
    [current.id, userId]
  );

  function onExit() {
    Alert.alert(
      'Leave session?',
      'Your progress so far in this session has been saved, but this exercise won’t count.',
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.navigate('Home') },
      ]
    );
  }

  function handleComplete(result: ExerciseRunResult) {
    recordExerciseResult(sessionRef.current.id, current.id, current.domain, difficulty, result);
    updateDifficultyAfterResult(userId, current.id, difficulty, result, TARGET_TIME_MS);

    const isLast = index === exercises.length - 1;
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      if (isLast) {
        closeSession(sessionRef.current.id, userId);
        recordSessionCompleted(userId, sessionRef.current.date);
        navigation.replace('SessionSummary', { sessionId: sessionRef.current.id });
      } else {
        setIndex(index + 1);
      }
    }, 1200);
  }

  const ExerciseComponent = current.Component;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Exit session" onPress={onExit}>
          <Text style={styles.exitButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.positionLabel}>
          Exercise {index + 1}/{exercises.length}
        </Text>
      </View>
      <ProgressBar progress={(index + (transitioning ? 1 : 0)) / exercises.length} />

      <View style={styles.stage}>
        {transitioning ? (
          <View style={styles.transitionCard}>
            <Text style={styles.transitionText}>Nice!</Text>
            {index + 1 < exercises.length && (
              <Text style={styles.transitionSubtext}>Next up: {exercises[index + 1].name}</Text>
            )}
          </View>
        ) : (
          <ExerciseComponent
            key={`${current.id}-${index}`}
            difficulty={difficulty}
            onComplete={handleComplete}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exitButton: { ...typography.h2, color: colors.textSecondary },
  positionLabel: { ...typography.caption, color: colors.textMuted },
  stage: { flex: 1 },
  transitionCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  transitionText: { ...typography.display, color: colors.success },
  transitionSubtext: { ...typography.body, color: colors.textSecondary },
});
