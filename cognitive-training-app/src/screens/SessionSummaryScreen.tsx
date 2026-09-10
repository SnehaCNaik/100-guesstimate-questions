import React, { useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getDb } from '../db/database';
import { getCurrentStreak } from '../engine/streakEngine';
import { getUserId } from '../state/appState';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';
import { DOMAIN_ICONS, DOMAIN_LABELS, type Domain } from '../types';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

interface DomainRow {
  domain: Domain;
  score: number;
}

export default function SessionSummaryScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const userId = getUserId();

  const { totalScore, avgAccuracy, totalTimeMs, domainRows } = useMemo(() => {
    const db = getDb();
    const session = db.getFirstSync<{ total_score: number }>(
      `SELECT total_score FROM sessions WHERE id = ?`,
      [sessionId]
    );
    const results = db.getAllSync<{ domain: Domain; score: number; accuracy: number; time_ms: number }>(
      `SELECT domain, score, accuracy, time_ms FROM exercise_results WHERE session_id = ?`,
      [sessionId]
    );
    const avgAccuracy =
      results.length > 0 ? results.reduce((s, r) => s + r.accuracy, 0) / results.length : 0;
    const totalTimeMs = results.reduce((s, r) => s + r.time_ms, 0);
    const domainRows: DomainRow[] = results.map((r) => ({ domain: r.domain, score: Math.round(r.score) }));
    return { totalScore: Math.round(session?.total_score ?? 0), avgAccuracy, totalTimeMs, domainRows };
  }, [sessionId]);

  const streak = getCurrentStreak(userId);
  const minutes = Math.floor(totalTimeMs / 60000);
  const seconds = Math.round((totalTimeMs % 60000) / 1000);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Session Complete</Text>
        <Text style={styles.score}>{totalScore}</Text>

        <View style={styles.statsRow}>
          <Stat label="Accuracy" value={`${Math.round(avgAccuracy * 100)}%`} />
          <Stat label="Time" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
          <Stat label="Streak" value={`🔥 ${streak.currentStreak}`} />
        </View>

        <View style={styles.domainList}>
          {domainRows.map((row, i) => (
            <View key={`${row.domain}-${i}`} style={styles.domainRow}>
              <Text style={styles.domainLabel}>
                {DOMAIN_ICONS[row.domain]} {DOMAIN_LABELS[row.domain]}
              </Text>
              <View style={styles.domainBarWrap}>
                <ProgressBar progress={row.score / 100} color={colors.domain[row.domain]} />
              </View>
              <Text style={styles.domainScore}>{row.score}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          label="Back to Home"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
          style={styles.homeButton}
        />
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg, alignItems: 'center', gap: spacing.lg },
  title: { ...typography.h2, color: colors.textSecondary, marginTop: spacing.lg },
  score: { fontSize: 64, fontWeight: '800', color: colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: spacing.xl },
  stat: { alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  domainList: { width: '100%', gap: spacing.md },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  domainLabel: { ...typography.body, color: colors.textPrimary, width: 130 },
  domainBarWrap: { flex: 1 },
  domainScore: { ...typography.bodyStrong, color: colors.textPrimary, width: 32, textAlign: 'right' },
  homeButton: { width: '100%', marginTop: 'auto' },
});
