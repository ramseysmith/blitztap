import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { useFeedback } from '../../hooks/useFeedback';
import { SPRING_BOUNCY, SPRING_CONFIG } from '../../hooks/useGameAnimations';

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
  const feedback = useFeedback();
  const hasPlayedGameOver = useRef(false);
  const hasPlayedHighScore = useRef(false);

  // Staggered animation values
  const backdropOpacity = useSharedValue(0);
  const titleY = useSharedValue(-50);
  const titleOpacity = useSharedValue(0);
  const scoreProgress = useSharedValue(0);
  const highScoreBadgeScale = useSharedValue(0);
  const coinsY = useSharedValue(30);
  const coinsOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);

  // Derived value for animated score counting
  const animatedScore = useDerivedValue(() => {
    // Decelerate near the end using easeOutQuart
    const t = scoreProgress.value;
    const eased = 1 - Math.pow(1 - t, 4);
    return Math.round(eased * score);
  });

  // Button press animation
  const buttonPressScale = useSharedValue(1);

  // Score tick sound callback
  const playScoreTick = () => {
    feedback.onScoreCountTick();
  };

  // High score sound callback
  const playHighScoreSound = () => {
    if (!hasPlayedHighScore.current) {
      hasPlayedHighScore.current = true;
      feedback.onNewHighScore();
    }
  };

  useEffect(() => {
    // Play game over sound
    if (!hasPlayedGameOver.current) {
      hasPlayedGameOver.current = true;
      feedback.onGameOver();
    }

    // Staggered entry animation sequence
    // 1. Backdrop fade in (0ms)
    backdropOpacity.value = withTiming(1, { duration: 200 });

    // 2. Title slide down (200ms delay)
    titleY.value = withDelay(200, withSpring(0, SPRING_CONFIG));
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));

    // 3. Score count up (500ms delay, 800ms duration)
    scoreProgress.value = withDelay(
      500,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
    );

    // 4. High score badge (1300ms delay, if applicable)
    if (isNewHighScore) {
      highScoreBadgeScale.value = withDelay(
        1300,
        withSequence(
          withSpring(1.2, { damping: 8, stiffness: 200 }),
          withSpring(1, SPRING_CONFIG)
        )
      );
      // Trigger high score sound
      setTimeout(playHighScoreSound, 1300);
    }

    // 5. Coins fade in from below (1500ms delay)
    coinsY.value = withDelay(1500, withSpring(0, SPRING_CONFIG));
    coinsOpacity.value = withDelay(1500, withTiming(1, { duration: 200 }));

    // 6. Play Again button (1700ms delay)
    buttonScale.value = withDelay(1700, withSpring(1, SPRING_BOUNCY));
    buttonOpacity.value = withDelay(1700, withTiming(1, { duration: 200 }));
  }, []);

  const backdropStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: backdropOpacity.value,
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: titleY.value }],
      opacity: titleOpacity.value,
    };
  });

  const scoreStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: scoreProgress.value > 0 ? 1 : 0,
    };
  });

  const highScoreBadgeStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: highScoreBadgeScale.value }],
      opacity: highScoreBadgeScale.value,
    };
  });

  const coinsStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: coinsY.value }],
      opacity: coinsOpacity.value,
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: buttonScale.value * buttonPressScale.value }],
      opacity: buttonOpacity.value,
    };
  });

  const handlePressIn = () => {
    buttonPressScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonPressScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePlayAgain = () => {
    feedback.onButtonPress();
    onPlayAgain();
  };

  return (
    <Animated.View style={[styles.overlay, backdropStyle]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.gameOverText, titleStyle]}>
          GAME OVER
        </Animated.Text>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Animated.View style={scoreStyle}>
            <AnimatedScoreText score={animatedScore} />
          </Animated.View>

          {isNewHighScore && (
            <Animated.View style={[styles.newHighScoreBadge, highScoreBadgeStyle]}>
              <Text style={styles.newHighScoreText}>NEW HIGH SCORE!</Text>
            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.coinsSection, coinsStyle]}>
          <Text style={styles.coinsLabel}>Coins Earned</Text>
          <Text style={styles.coinsValue}>+{roundCoins}</Text>
        </Animated.View>

        <Animated.View style={buttonStyle}>
          <Pressable
            style={styles.playAgainButton}
            onPress={handlePlayAgain}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// Separate component for animated score text
function AnimatedScoreText({ score }: { score: Animated.SharedValue<number> }) {
  return (
    <ReanimatedText text={score} />
  );
}

// Helper component to display animated number
function ReanimatedText({ text }: { text: Animated.SharedValue<number> }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  useDerivedValue(() => {
    runOnJS(setDisplayValue)(Math.round(text.value));
  });

  return <Text style={styles.scoreValue}>{displayValue}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 35, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  gameOverText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 50,
    letterSpacing: 6,
    textShadowColor: Colors.error,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
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
    fontSize: 80,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  newHighScoreBadge: {
    marginTop: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  newHighScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 1,
  },
  coinsSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  coinsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  coinsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  playAgainButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 35,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  playAgainText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.background,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
});
