import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../utils/colors';

interface ScoreDisplayProps {
  score: number;
  streak: number;
  multiplier: number;
}

export function ScoreDisplay({ score, streak, multiplier }: ScoreDisplayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>

      <View style={styles.streakSection}>
        {streak > 0 && (
          <>
            <Text style={styles.streakLabel}>Streak: {streak}</Text>
            {multiplier > 1 && (
              <View style={styles.multiplierBadge}>
                <Text style={styles.multiplierText}>{multiplier}x</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scoreSection: {
    alignItems: 'flex-start',
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
  },
  scoreValue: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakLabel: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  multiplierBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  multiplierText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
