import React, { useEffect } from 'react';
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
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface TimerBarProps {
  timeProgress: SharedValue<number>;
  onTimerWarning?: (intensity: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_HEIGHT = 10;
const BAR_MARGIN = 20;
const BAR_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2;

export function TimerBar({ timeProgress, onTimerWarning }: TimerBarProps) {
  const pulseOpacity = useSharedValue(1);

  // Pulse animation when time is low
  useEffect(() => {
    const checkPulse = () => {
      if (timeProgress.value < 0.25 && timeProgress.value > 0) {
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
          -1,
          true
        );
      } else {
        cancelAnimation(pulseOpacity);
        pulseOpacity.value = 1;
      }
    };

    const interval = setInterval(checkPulse, 100);
    return () => clearInterval(interval);
  }, [timeProgress, pulseOpacity]);

  const barStyle = useAnimatedStyle(() => {
    const width = Math.max(0, timeProgress.value * BAR_WIDTH);
    const backgroundColor = interpolateColor(
      timeProgress.value,
      [0, 0.25, 0.5, 1],
      [Colors.error, Colors.error, Colors.warning, Colors.success]
    );

    // Report warning intensity
    if (timeProgress.value < 0.25 && timeProgress.value > 0 && onTimerWarning) {
      const intensity = 1 - timeProgress.value / 0.25;
      onTimerWarning(intensity);
    }

    return {
      width,
      backgroundColor,
      opacity: pulseOpacity.value,
      shadowColor: backgroundColor,
    };
  });

  const trackStyle = useAnimatedStyle(() => {
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
