import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';

export default function StreakBadge({ streak }: { streak: number }) {
  return (
    <View style={styles.badge} accessibilityLabel={`${streak} day streak`}>
      <Text style={styles.emoji}>🔥</Text>
      <Text style={styles.count}>{streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 16 },
  count: { ...typography.bodyStrong, color: colors.textPrimary },
});
