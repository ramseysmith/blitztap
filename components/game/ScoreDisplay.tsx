import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface ScoreDisplayProps {
  score: number;
  streak: number;
  multiplier: number;
  scoreScale?: SharedValue<number>;
  scoreBump?: SharedValue<number>;
  multiplierScale?: SharedValue<number>;
  multiplierGlow?: SharedValue<number>;
}

export function ScoreDisplay({
  score,
  streak,
  multiplier,
  scoreScale,
  scoreBump,
  multiplierScale,
  multiplierGlow,
}: ScoreDisplayProps) {
  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scoreScale?.value ?? 1 },
      { translateY: scoreBump?.value ?? 0 },
    ],
  }));

  const multiplierAnimatedStyle = useAnimatedStyle(() => {
    const glowValue = multiplierGlow?.value ?? 0;
    const shadowOpacity = glowValue * 0.8;

    return {
      transform: [{ scale: multiplierScale?.value ?? 1 }],
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius: 10,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Animated.Text style={[styles.scoreValue, scoreAnimatedStyle]}>
          {score}
        </Animated.Text>
      </View>

      <View style={styles.streakSection}>
        {streak > 0 && (
          <>
            <Text style={styles.streakLabel}>Streak: {streak}</Text>
            {multiplier > 1 && (
              <Animated.View style={[styles.multiplierBadge, multiplierAnimatedStyle]}>
                <Text style={styles.multiplierText}>{multiplier}x</Text>
              </Animated.View>
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
