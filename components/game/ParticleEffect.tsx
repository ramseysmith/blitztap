import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  SharedValue,
  Easing,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface ParticleEffectProps {
  trigger: SharedValue<number>;
  color?: string;
  particleCount?: number;
}

interface ParticleProps {
  index: number;
  color: string;
  angle: number;
  distance: number;
  delay: number;
  triggerAnimation: boolean;
}

function Particle({ index, color, angle, distance, delay, triggerAnimation }: ParticleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (triggerAnimation) {
      const radians = (angle * Math.PI) / 180;
      const targetX = Math.cos(radians) * distance;
      const targetY = Math.sin(radians) * distance;

      // Reset
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      opacity.value = 0;

      // Animate
      opacity.value = withDelay(delay, withTiming(1, { duration: 50 }));
      translateX.value = withDelay(
        delay,
        withTiming(targetX, { duration: 400, easing: Easing.out(Easing.quad) })
      );
      translateY.value = withDelay(
        delay,
        withTiming(targetY, { duration: 400, easing: Easing.out(Easing.quad) })
      );
      scale.value = withDelay(
        delay,
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
      );
      opacity.value = withDelay(
        delay + 200,
        withTiming(0, { duration: 200 })
      );
    }
  }, [triggerAnimation, angle, distance, delay, translateX, translateY, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function ParticleEffect({
  trigger,
  color = Colors.accent,
  particleCount = 6,
}: ParticleEffectProps) {
  const [animationTrigger, setAnimationTrigger] = React.useState(0);
  const lastTriggerRef = useRef(0);

  // Watch for trigger changes
  useAnimatedReaction(
    () => trigger.value,
    (current: number, previous: number | null) => {
      if (current > 0.5 && (previous === null || previous <= 0.5)) {
        runOnJS(setAnimationTrigger)(Date.now());
      }
    },
    [trigger]
  );

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      angle: (360 / particleCount) * i + Math.random() * 30 - 15,
      distance: 30 + Math.random() * 20,
      delay: Math.random() * 50,
    }));
  }, [particleCount]);

  const shouldTrigger = animationTrigger !== lastTriggerRef.current;
  if (shouldTrigger) {
    lastTriggerRef.current = animationTrigger;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <Particle
          key={p.id}
          index={p.id}
          color={color}
          angle={p.angle}
          distance={p.distance}
          delay={p.delay}
          triggerAnimation={shouldTrigger}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
