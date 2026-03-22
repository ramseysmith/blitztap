import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface Props {
  masterTimeProgress: SharedValue<number>; // 0-1
  timeRemainingMs: number;
}

export function MasterTimerBar({ masterTimeProgress, timeRemainingMs }: Props) {
  const seconds = Math.max(0, Math.ceil(timeRemainingMs / 1000));

  const barStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = masterTimeProgress.value;
    const color = progress > 0.5 ? '#00D4FF' : progress > 0.25 ? '#FFB800' : '#FF3366';
    return {
      width: `${progress * 100}%`,
      backgroundColor: color,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>TIME</Text>
        <Text style={[styles.seconds, seconds <= 10 && styles.secondsCritical]}>
          {seconds}s
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  seconds: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D4FF',
    fontVariant: ['tabular-nums'],
  },
  secondsCritical: {
    color: '#FF3366',
  },
  track: {
    height: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
