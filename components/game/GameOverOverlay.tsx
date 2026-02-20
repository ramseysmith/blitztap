import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
  SharedValue,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { useFeedback } from '../../hooks/useFeedback';
import { SPRING_BOUNCY, SPRING_CONFIG } from '../../hooks/useGameAnimations';

interface GameOverOverlayProps {
  score: number;
  isNewHighScore: boolean;
  roundCoins: number;
  onPlayAgain: () => void;
  // New props for ads/purchases
  rewardedReady?: boolean;
  hasUsedContinue?: boolean;
  onContinue?: () => void;
  onRemoveAds?: () => void;
  isProUser?: boolean;
  removeAdsPrice?: string;
  isPurchasing?: boolean;
}

export function GameOverOverlay({
  score,
  isNewHighScore,
  roundCoins,
  onPlayAgain,
  rewardedReady = false,
  hasUsedContinue = false,
  onContinue,
  onRemoveAds,
  isProUser = false,
  removeAdsPrice = '$3.99',
  isPurchasing = false,
}: GameOverOverlayProps) {
  const feedback = useFeedback();
  const hasPlayedGameOver = useRef(false);
  const hasPlayedHighScore = useRef(false);

  // Can show continue button?
  const showContinueButton = rewardedReady && !hasUsedContinue && onContinue;

  // Staggered animation values
  const backdropOpacity = useSharedValue(0);
  const titleY = useSharedValue(-50);
  const titleOpacity = useSharedValue(0);
  const scoreProgress = useSharedValue(0);
  const highScoreBadgeScale = useSharedValue(0);
  const coinsY = useSharedValue(30);
  const coinsOpacity = useSharedValue(0);
  const continueButtonScale = useSharedValue(0.8);
  const continueButtonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);
  const removeAdsOpacity = useSharedValue(0);

  // Derived value for animated score counting
  const animatedScore = useDerivedValue(() => {
    const t = scoreProgress.value;
    const eased = 1 - Math.pow(1 - t, 4);
    return Math.round(eased * score);
  });

  // Button press animations
  const buttonPressScale = useSharedValue(1);
  const continueButtonPressScale = useSharedValue(1);

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
      setTimeout(playHighScoreSound, 1300);
    }

    // 5. Coins fade in from below (1500ms delay)
    coinsY.value = withDelay(1500, withSpring(0, SPRING_CONFIG));
    coinsOpacity.value = withDelay(1500, withTiming(1, { duration: 200 }));

    // 6. Continue button (1700ms delay) - if available
    if (showContinueButton) {
      continueButtonScale.value = withDelay(1700, withSpring(1, SPRING_BOUNCY));
      continueButtonOpacity.value = withDelay(1700, withTiming(1, { duration: 200 }));
    }

    // 7. Play Again button (1900ms delay if continue shown, 1700ms otherwise)
    const playAgainDelay = showContinueButton ? 1900 : 1700;
    buttonScale.value = withDelay(playAgainDelay, withSpring(1, SPRING_BOUNCY));
    buttonOpacity.value = withDelay(playAgainDelay, withTiming(1, { duration: 200 }));

    // 8. Remove ads prompt (2100ms delay)
    if (!isProUser && onRemoveAds) {
      removeAdsOpacity.value = withDelay(2100, withTiming(1, { duration: 300 }));
    }
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

  const continueButtonStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: continueButtonScale.value * continueButtonPressScale.value }],
      opacity: continueButtonOpacity.value,
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: buttonScale.value * buttonPressScale.value }],
      opacity: buttonOpacity.value,
    };
  });

  const removeAdsStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: removeAdsOpacity.value,
    };
  });

  const handlePressIn = () => {
    buttonPressScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonPressScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handleContinuePressIn = () => {
    continueButtonPressScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handleContinuePressOut = () => {
    continueButtonPressScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePlayAgain = () => {
    feedback.onButtonPress();
    onPlayAgain();
  };

  const handleContinue = () => {
    feedback.onButtonPress();
    onContinue?.();
  };

  const handleRemoveAds = () => {
    feedback.onButtonPress();
    onRemoveAds?.();
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

        {/* Continue Button - shown above Play Again if rewarded ad is ready */}
        {showContinueButton && (
          <Animated.View style={[styles.continueButtonContainer, continueButtonStyle]}>
            <Pressable
              style={styles.continueButton}
              onPress={handleContinue}
              onPressIn={handleContinuePressIn}
              onPressOut={handleContinuePressOut}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Text style={styles.continueSubtext}>Watch ad to keep playing</Text>
            </Pressable>
          </Animated.View>
        )}

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

        {/* Remove Ads prompt - shown below Play Again for non-pro users */}
        {!isProUser && onRemoveAds && (
          <Animated.View style={[styles.removeAdsContainer, removeAdsStyle]}>
            <Pressable
              style={styles.removeAdsButton}
              onPress={handleRemoveAds}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={Colors.warning} />
              ) : (
                <>
                  <Text style={styles.removeAdsText}>Tired of ads?</Text>
                  <Text style={styles.removeAdsPrice}>
                    Remove them for {removeAdsPrice}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

// Separate component for animated score text
function AnimatedScoreText({ score }: { score: SharedValue<number> }) {
  return <ReanimatedText text={score} />;
}

// Helper component to display animated number
function ReanimatedText({ text }: { text: SharedValue<number> }) {
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
    marginBottom: 30,
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
  continueButtonContainer: {
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.background,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  continueSubtext: {
    fontSize: 11,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 4,
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
  removeAdsContainer: {
    marginTop: 30,
  },
  removeAdsButton: {
    alignItems: 'center',
    padding: 12,
  },
  removeAdsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  removeAdsPrice: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: 4,
  },
});
