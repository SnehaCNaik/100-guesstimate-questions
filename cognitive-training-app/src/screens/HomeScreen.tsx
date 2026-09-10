import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { buildTodaySession } from '../engine/sessionPlanner';
import { getCurrentStreak } from '../engine/streakEngine';
import { getRecentSessions, hasCompletedSessionToday } from '../db/repository';
import { getUserId } from '../state/appState';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';
import { DOMAIN_ICONS, DOMAIN_LABELS, type ExerciseDefinition } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import StreakBadge from '../components/StreakBadge';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [todaysPlan, setTodaysPlan] = useState<ExerciseDefinition[]>([]);
  const [streak, setStreak] = useState(0);
  const [alreadyDoneToday, setAlreadyDoneToday] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const userId = getUserId();
      setTodaysPlan(buildTodaySession(userId));
      setStreak(getCurrentStreak(userId).currentStreak);
      setAlreadyDoneToday(hasCompletedSessionToday(userId));
      const recent = getRecentSessions(userId, 1);
      setLastScore(recent.length > 0 ? Math.round(recent[0].totalScore ?? 0) : null);
    }, [])
  );

  const domains = [...new Set(todaysPlan.map((e) => e.domain))];
  const estimatedMinutes = Math.max(8, todaysPlan.length * 3);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>NeuroLap</Text>
          <StreakBadge streak={streak} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>
            {alreadyDoneToday ? "You've trained today" : "Ready for today's session?"}
          </Text>
          <Text style={styles.subtitle}>
            {todaysPlan.length} exercises · ~{estimatedMinutes} minutes
          </Text>

          <View style={styles.chipsRow}>
            {domains.map((d) => (
              <View key={d} style={styles.chip}>
                <Text style={styles.chipText}>
                  {DOMAIN_ICONS[d]} {DOMAIN_LABELS[d]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <PrimaryButton
          label={alreadyDoneToday ? 'Play a bonus round' : 'Start Session'}
          onPress={() => navigation.navigate('ExercisePlay', { exercises: todaysPlan })}
          style={styles.startButton}
        />

        {lastScore !== null && (
          <Text style={styles.lastSession}>Last session: {lastScore}</Text>
        )}

        <View style={styles.footerLinks}>
          <PrimaryButton
            label="Progress"
            variant="secondary"
            onPress={() => navigation.navigate('ProgressDashboard')}
            style={styles.footerButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h1, color: colors.textPrimary },
  hero: { alignItems: 'center', gap: spacing.md },
  greeting: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  chip: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.caption, color: colors.textPrimary },
  startButton: { width: '100%' },
  lastSession: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footerLinks: { flexDirection: 'row', justifyContent: 'center' },
  footerButton: { minWidth: 160 },
});
