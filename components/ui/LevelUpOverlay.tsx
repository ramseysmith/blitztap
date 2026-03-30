// Level up celebration overlay for BlitzTap - Update 2

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { LevelReward } from '../../utils/xp';
import { useFeedback } from '../../hooks/useFeedback';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface Props {
  reward: LevelReward | null;
  onDismiss: () => void;
  onShare?: () => void;
}

export default function LevelUpOverlay({ reward, onDismiss, onShare }: Props) {
  const feedback = useFeedback();
  const { reduceMotion } = useAccessibility();
  const backdropOpacity = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const coinsOpacity = useSharedValue(0);
  const bonusOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    if (!reward) return;

    feedback.onNewHighScore();

    const dur = reduceMotion ? 0 : 300;

    backdropOpacity.value = withTiming(1, { duration: dur });
    levelScale.value = withDelay(reduceMotion ? 0 : 200,
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    coinsOpacity.value = withDelay(reduceMotion ? 0 : 600,
      withTiming(1, { duration: dur })
    );
    bonusOpacity.value = withDelay(reduceMotion ? 0 : 900,
      withTiming(1, { duration: dur })
    );
    buttonsOpacity.value = withDelay(reduceMotion ? 0 : 1200,
      withTiming(1, { duration: dur })
    );
  }, [reward]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));

  const coinsStyle = useAnimatedStyle(() => ({
    opacity: coinsOpacity.value,
  }));

  const bonusStyle = useAnimatedStyle(() => ({
    opacity: bonusOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  if (!reward) return null;

  const glowColor = reward.bonusItem ? Colors.warning : Colors.accent;

  return (
    <Animated.View style={[styles.overlay, backdropStyle]}>
      <Animated.View style={[styles.content, levelStyle]}>
        <Text style={styles.label}>LEVEL UP!</Text>
        <Text style={[styles.level, { color: glowColor }]}>
          Level {reward.level}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.rewardsSection, coinsStyle]}>
        <Text style={styles.coinsLabel}>+{reward.coins} coins</Text>
      </Animated.View>

      {reward.bonusItem && (
        <Animated.View style={[styles.bonusSection, bonusStyle]}>
          <Text style={styles.bonusLabel}>BONUS REWARD</Text>
          <Text style={styles.bonusItem}>{reward.bonusItem}</Text>
        </Animated.View>
      )}

      <Animated.View style={[styles.buttons, buttonsStyle]}>
        {onShare && (
          <Pressable
            style={[styles.button, styles.shareButton]}
            onPress={() => {
              feedback.onButtonPress();
              onShare();
            }}
          >
            <Text style={styles.buttonText}>Share</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.button, styles.continueButton]}
          onPress={() => {
            feedback.onButtonPress();
            onDismiss();
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  level: {
    fontSize: 64,
    fontWeight: '900',
  },
  rewardsSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  coinsLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.warning,
  },
  bonusSection: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bonusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 2,
    marginBottom: 4,
  },
  bonusItem: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  continueButton: {
    backgroundColor: Colors.accent,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
