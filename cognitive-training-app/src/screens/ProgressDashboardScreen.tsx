import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getDomainStats, getRecentSessions } from '../db/repository';
import { getCurrentStreak } from '../engine/streakEngine';
import { getUserId } from '../state/appState';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';
import { DOMAIN_ICONS, DOMAIN_LABELS, type DomainStat, type SessionRecord } from '../types';
import ProgressBar from '../components/ProgressBar';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgressDashboard'>;

export default function ProgressDashboardScreen({ navigation }: Props) {
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      const userId = getUserId();
      setStreak(getCurrentStreak(userId));
      setDomainStats(getDomainStats(userId));
      setSessions(getRecentSessions(userId, 10));
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Progress</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakBig}>🔥 {streak.currentStreak} days</Text>
          <Text style={styles.streakSub}>Longest streak: {streak.longestStreak} days</Text>
        </View>

        <Text style={styles.sectionTitle}>By domain (30-day average)</Text>
        <View style={styles.domainList}>
          {domainStats.length === 0 && (
            <Text style={styles.emptyText}>Complete a few sessions to see trends here.</Text>
          )}
          {domainStats.map((stat) => (
            <View key={stat.domain} style={styles.domainRow}>
              <Text style={styles.domainLabel}>
                {DOMAIN_ICONS[stat.domain]} {DOMAIN_LABELS[stat.domain]}
              </Text>
              <View style={styles.domainBarWrap}>
                <ProgressBar progress={stat.avgScore30d / 100} color={colors.domain[stat.domain]} />
              </View>
              <Text style={styles.domainScore}>{Math.round(stat.avgScore30d)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent sessions</Text>
        <View style={styles.sessionList}>
          {sessions.length === 0 && (
            <Text style={styles.emptyText}>No completed sessions yet — start one from Home.</Text>
          )}
          {sessions.map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <Text style={styles.sessionDate}>{s.date}</Text>
              <Text style={styles.sessionScore}>{Math.round(s.totalScore ?? 0)}</Text>
              <Text style={styles.sessionMeta}>
                {s.exercisesCompleted}/{s.exercisesPlanned} exercises
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { ...typography.body, color: colors.primary, width: 48 },
  title: { ...typography.h1, color: colors.textPrimary },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakBig: { ...typography.h1, color: colors.textPrimary },
  streakSub: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.h2, color: colors.textPrimary },
  domainList: { gap: spacing.md },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  domainLabel: { ...typography.body, color: colors.textPrimary, width: 130 },
  domainBarWrap: { flex: 1 },
  domainScore: { ...typography.bodyStrong, color: colors.textPrimary, width: 32, textAlign: 'right' },
  sessionList: { gap: spacing.sm },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionDate: { ...typography.body, color: colors.textPrimary },
  sessionScore: { ...typography.bodyStrong, color: colors.textPrimary },
  sessionMeta: { ...typography.caption, color: colors.textMuted },
  emptyText: { ...typography.body, color: colors.textMuted },
});
