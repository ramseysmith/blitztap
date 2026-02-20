import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface TimerBarProps {
  timeProgress: SharedValue<number>;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_HEIGHT = 8;
const BAR_MARGIN = 20;
const BAR_WIDTH = SCREEN_WIDTH - BAR_MARGIN * 2;

export function TimerBar({ timeProgress }: TimerBarProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = timeProgress.value * BAR_WIDTH;
    const backgroundColor = interpolateColor(
      timeProgress.value,
      [0, 0.25, 0.5, 1],
      [Colors.error, Colors.error, Colors.warning, Colors.success]
    );

    return {
      width,
      backgroundColor,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, animatedStyle]} />
      </View>
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
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
});
