import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolateColor,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface TimerBarProps {
  timeProgress: SharedValue<number>;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_HEIGHT = 10;
const BAR_MARGIN = 20;
const BAR_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2;

export function TimerBar({ timeProgress }: TimerBarProps) {
  const pulseOpacity = useSharedValue(1);
  const isPulsing = useSharedValue(false);

  // React to time progress changes on the UI thread
  useAnimatedReaction(
    () => timeProgress.value,
    (current, previous) => {
      'worklet';
      const shouldPulse = current < 0.25 && current > 0;
      const wasPulsing = isPulsing.value;

      if (shouldPulse && !wasPulsing) {
        // Start pulsing
        isPulsing.value = true;
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
          -1,
          true
        );
      } else if (!shouldPulse && wasPulsing) {
        // Stop pulsing
        isPulsing.value = false;
        cancelAnimation(pulseOpacity);
        pulseOpacity.value = 1;
      }
    },
    [timeProgress]
  );

  const barStyle = useAnimatedStyle(() => {
    'worklet';
    const width = Math.max(0, timeProgress.value * BAR_WIDTH);
    const backgroundColor = interpolateColor(
      timeProgress.value,
      [0, 0.25, 0.5, 1],
      [Colors.error, Colors.error, Colors.warning, Colors.success]
    );

    return {
      width,
      backgroundColor,
      opacity: pulseOpacity.value,
    };
  });

  const trackStyle = useAnimatedStyle(() => {
    'worklet';
    const glowColor = interpolateColor(
      timeProgress.value,
      [0, 0.25, 0.5, 1],
      [Colors.error, Colors.error, Colors.warning, Colors.success]
    );

    return {
      shadowColor: glowColor,
      shadowOpacity: timeProgress.value < 0.25 ? 0.5 : 0.2,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.bar, barStyle]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: BAR_MARGIN,
    paddingVertical: 10,
  },
  track: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
