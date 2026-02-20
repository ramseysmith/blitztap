import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import { ParticleEffect } from './ParticleEffect';
import { Colors } from '../../utils/colors';

interface StreakMilestoneProps {
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  text: string;
  showParticles: SharedValue<number>;
}

export function StreakMilestone({
  scale,
  opacity,
  text,
  showParticles,
}: StreakMilestoneProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.Text style={[styles.text, animatedStyle]}>
        {text}
      </Animated.Text>
      <View style={styles.particleContainer}>
        <ParticleEffect trigger={showParticles} color={Colors.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 2,
  },
  particleContainer: {
    position: 'absolute',
    top: 15,
  },
});
