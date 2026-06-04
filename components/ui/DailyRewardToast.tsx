// Daily return reward toast for BlitzTap

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../utils/colors';
import { useFeedback } from '../../hooks/useFeedback';
import { DailyRewardResult } from '../../utils/dailyReward';

interface Props {
  reward: DailyRewardResult | null;
  onDismiss: () => void;
}

const HOLD_DURATION = 3000;
const SLIDE_DURATION = 400;

export default function DailyRewardToast({ reward, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const feedback = useFeedback();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!reward) return;

    feedback.onStreakMilestone();

    translateY.value = -200;
    opacity.value = 0;

    translateY.value = withSequence(
      withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.back(1.2)) }),
      withDelay(HOLD_DURATION, withTiming(-200, { duration: SLIDE_DURATION, easing: Easing.in(Easing.ease) })),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: SLIDE_DURATION }),
      withDelay(HOLD_DURATION, withTiming(0, { duration: SLIDE_DURATION }, () => {
        runOnJS(onDismiss)();
      })),
    );
  }, [reward]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!reward) return null;

  return (
    <Animated.View style={[styles.container, { top: insets.top + 8 }, animatedStyle]}>
      <View style={styles.toast}>
        <Text style={styles.icon}>🪙</Text>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Welcome back!</Text>
          <Text style={styles.title}>Day {reward.streak} streak 🔥</Text>
          <Text style={styles.reward}>+{reward.amount} coins</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 36,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.warning,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  reward: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
    marginTop: 2,
  },
});
