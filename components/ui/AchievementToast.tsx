// Achievement unlock toast for BlitzTap - Update 2

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
import { useRouter } from 'expo-router';
import { Achievement, TIER_COLORS } from '../../utils/achievements';
import { Colors } from '../../utils/colors';
import { useFeedback } from '../../hooks/useFeedback';

interface Props {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const HOLD_DURATION = 3000;
const SLIDE_DURATION = 400;

export default function AchievementToast({ achievement, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const feedback = useFeedback();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!achievement) return;

    // Play sound based on tier
    if (achievement.tier === 'platinum') {
      feedback.onNewHighScore();
    } else {
      feedback.onStreakMilestone();
    }

    // Slide in, hold, slide out
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
  }, [achievement]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!achievement) return null;

  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8 },
        animatedStyle,
      ]}
    >
      <Pressable
        style={[styles.toast, { borderColor: tierColor }]}
        onPress={() => {
          translateY.value = withTiming(-200, { duration: 200 });
          opacity.value = withTiming(0, { duration: 200 }, () => {
            runOnJS(onDismiss)();
          });
          router.push('/achievements');
        }}
      >
        <Text style={styles.icon}>{achievement.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: tierColor }]}>Achievement Unlocked!</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.reward}>+{achievement.reward} coins</Text>
        </View>
      </Pressable>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    // Shadow
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
