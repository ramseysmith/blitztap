// Game animation triggers for BlitzTap Phase 2

import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Spring config for snappy game feel
export const SPRING_CONFIG = {
  damping: 14,
  stiffness: 180,
  mass: 1,
};

export const SPRING_BOUNCY = {
  damping: 10,
  stiffness: 200,
  mass: 0.8,
};

export function useGameAnimations() {
  // Score animation
  const scoreScale = useSharedValue(1);
  const scoreBump = useSharedValue(0);

  // Multiplier animation
  const multiplierScale = useSharedValue(1);
  const multiplierGlow = useSharedValue(0);

  // Screen shake
  const screenShakeX = useSharedValue(0);

  // Screen edge glow (for timer warning and wrong tap)
  const screenGlowOpacity = useSharedValue(0);
  const screenGlowColor = useSharedValue(0); // 0 = red, 1 = green

  // Grid dim for correct tap transition
  const gridDimOpacity = useSharedValue(1);

  // Tier transition text
  const tierTextScale = useSharedValue(0);
  const tierTextOpacity = useSharedValue(0);
  const currentTierText = useRef('');
  const currentTierColor = useRef('#00D4FF');

  // Streak milestone
  const streakTextScale = useSharedValue(0);
  const streakTextOpacity = useSharedValue(0);
  const currentStreakText = useRef('');
  const showParticles = useSharedValue(0);

  // Animate correct tap effects
  const animateCorrectTap = useCallback(() => {
    'worklet';
    // Score bump
    scoreBump.value = withSequence(
      withTiming(-5, { duration: 80 }),
      withSpring(0, SPRING_CONFIG)
    );
    scoreScale.value = withSequence(
      withSpring(1.15, { damping: 10, stiffness: 300 }),
      withSpring(1, SPRING_CONFIG)
    );

    // Brief grid dim
    gridDimOpacity.value = withSequence(
      withTiming(0.4, { duration: 80 }),
      withTiming(1, { duration: 150 })
    );
  }, [scoreBump, scoreScale, gridDimOpacity]);

  // Animate multiplier change
  const animateMultiplierChange = useCallback(() => {
    'worklet';
    multiplierScale.value = withSequence(
      withSpring(1.5, SPRING_BOUNCY),
      withSpring(1, SPRING_CONFIG)
    );
    multiplierGlow.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 300 })
    );
  }, [multiplierScale, multiplierGlow]);

  // Animate wrong tap effects
  const animateWrongTap = useCallback(() => {
    'worklet';
    // Screen shake
    screenShakeX.value = withSequence(
      withTiming(4, { duration: 40 }),
      withTiming(-4, { duration: 40 }),
      withTiming(2, { duration: 40 }),
      withTiming(-2, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );

    // Red screen glow
    screenGlowColor.value = 0; // red
    screenGlowOpacity.value = withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0, { duration: 200 })
    );
  }, [screenShakeX, screenGlowOpacity, screenGlowColor]);

  // Animate timeout
  const animateTimeout = useCallback(() => {
    'worklet';
    screenGlowColor.value = 0; // red
    screenGlowOpacity.value = withSequence(
      withTiming(0.5, { duration: 80 }),
      withTiming(0.2, { duration: 80 }),
      withTiming(0.5, { duration: 80 }),
      withTiming(0.2, { duration: 80 }),
      withTiming(0.5, { duration: 80 }),
      withTiming(0, { duration: 200 })
    );
  }, [screenGlowOpacity, screenGlowColor]);

  // Timer warning pulse (called when timer < 25%)
  const animateTimerWarning = useCallback((intensity: number) => {
    'worklet';
    screenGlowColor.value = 0; // red
    screenGlowOpacity.value = intensity * 0.3;
  }, [screenGlowOpacity, screenGlowColor]);

  // Tier transition animation
  const animateTierTransition = useCallback((tier: number) => {
    const texts = ['', '', 'TIER 2', 'TIER 3', 'TIER 4'];
    const colors = ['', '', '#4488FF', '#AA44FF', '#FFD700'];
    currentTierText.current = texts[tier] || '';
    currentTierColor.current = colors[tier] || '#00D4FF';

    tierTextScale.value = 0.5;
    tierTextOpacity.value = 0;

    tierTextScale.value = withSequence(
      withSpring(1.2, SPRING_BOUNCY),
      withSpring(1, SPRING_CONFIG),
      withDelay(200, withTiming(0.8, { duration: 200 }))
    );
    tierTextOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(400, withTiming(0, { duration: 300 }))
    );
  }, [tierTextScale, tierTextOpacity]);

  // Streak milestone animation
  const animateStreakMilestone = useCallback((streak: number) => {
    let text = '';
    if (streak === 5) text = 'ON FIRE!';
    else if (streak === 10) text = 'UNSTOPPABLE!';
    else if (streak === 20) text = 'LEGENDARY!';
    else return;

    currentStreakText.current = text;

    streakTextScale.value = 0.5;
    streakTextOpacity.value = 0;
    showParticles.value = 0;

    streakTextScale.value = withSequence(
      withSpring(1.2, SPRING_BOUNCY),
      withSpring(1, SPRING_CONFIG)
    );
    streakTextOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(300, withTiming(0, { duration: 400 }))
    );
    showParticles.value = withSequence(
      withTiming(1, { duration: 50 }),
      withDelay(500, withTiming(0, { duration: 100 }))
    );
  }, [streakTextScale, streakTextOpacity, showParticles]);

  // Reset all animations
  const resetAnimations = useCallback(() => {
    'worklet';
    scoreScale.value = 1;
    scoreBump.value = 0;
    multiplierScale.value = 1;
    multiplierGlow.value = 0;
    screenShakeX.value = 0;
    screenGlowOpacity.value = 0;
    gridDimOpacity.value = 1;
    tierTextOpacity.value = 0;
    streakTextOpacity.value = 0;
  }, [
    scoreScale, scoreBump, multiplierScale, multiplierGlow,
    screenShakeX, screenGlowOpacity, gridDimOpacity,
    tierTextOpacity, streakTextOpacity
  ]);

  return {
    // Shared values for components to consume
    scoreScale,
    scoreBump,
    multiplierScale,
    multiplierGlow,
    screenShakeX,
    screenGlowOpacity,
    screenGlowColor,
    gridDimOpacity,
    tierTextScale,
    tierTextOpacity,
    currentTierText,
    currentTierColor,
    streakTextScale,
    streakTextOpacity,
    currentStreakText,
    showParticles,

    // Animation triggers
    animateCorrectTap,
    animateMultiplierChange,
    animateWrongTap,
    animateTimeout,
    animateTimerWarning,
    animateTierTransition,
    animateStreakMilestone,
    resetAnimations,
  };
}
