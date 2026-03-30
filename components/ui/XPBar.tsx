// XP progress bar for home screen - BlitzTap Update 2

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface Props {
  level: number;
  currentXP: number;
  xpNeeded: number;
}

export default function XPBar({ level, currentXP, xpNeeded }: Props) {
  const progress = Math.min(currentXP / xpNeeded, 1);
  const animatedWidth = useSharedValue(0);

  React.useEffect(() => {
    animatedWidth.value = withTiming(progress, { duration: 600 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%` as any,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>
          {currentXP.toLocaleString()} / {xpNeeded.toLocaleString()} XP
        </Text>
      </View>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  barBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
});
