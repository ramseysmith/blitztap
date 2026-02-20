import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { useHaptics } from '../../hooks/useHaptics';

interface CountdownReadyProps {
  onComplete: () => void;
}

export function CountdownReady({ onComplete }: CountdownReadyProps) {
  const [count, setCount] = useState(3);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const haptics = useHaptics();

  useEffect(() => {
    // Animate and haptic for each count
    const animate = () => {
      scale.value = 0.5;
      opacity.value = 0;
      scale.value = withSequence(
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 100 })
      );
      opacity.value = withTiming(1, { duration: 200 });
      haptics.countdown();
    };

    animate();

    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Count reached 0, trigger game start after showing "GO!"
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [count, onComplete, scale, opacity, haptics]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Text style={styles.countText}>
          {count > 0 ? count : 'GO!'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  countText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: Colors.accent,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
