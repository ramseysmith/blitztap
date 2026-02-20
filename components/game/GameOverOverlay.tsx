import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../utils/colors';

interface GameOverOverlayProps {
  score: number;
  isNewHighScore: boolean;
  roundCoins: number;
  onPlayAgain: () => void;
}

export function GameOverOverlay({
  score,
  isNewHighScore,
  roundCoins,
  onPlayAgain,
}: GameOverOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Text style={styles.gameOverText}>GAME OVER</Text>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>

          {isNewHighScore && (
            <View style={styles.newHighScoreBadge}>
              <Text style={styles.newHighScoreText}>NEW HIGH SCORE!</Text>
            </View>
          )}
        </View>

        <View style={styles.coinsSection}>
          <Text style={styles.coinsLabel}>Coins Earned</Text>
          <Text style={styles.coinsValue}>+{roundCoins}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.playAgainButton,
            pressed && styles.playAgainButtonPressed,
          ]}
          onPress={onPlayAgain}
        >
          <Text style={styles.playAgainText}>Play Again</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 40,
    letterSpacing: 4,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  newHighScoreBadge: {
    marginTop: 16,
    backgroundColor: Colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  newHighScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 1,
  },
  coinsSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  coinsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  coinsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  playAgainButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
  },
  playAgainButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  playAgainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
