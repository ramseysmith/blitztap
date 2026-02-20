import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';
import { useFeedback } from '../../hooks/useFeedback';
import { SPRING_BOUNCY } from '../../hooks/useGameAnimations';

interface CountdownReadyProps {
  onComplete: () => void;
}

const COUNT_COLORS = {
  3: '#4488FF',  // Blue
  2: '#FFDD44',  // Yellow
  1: '#FF3366',  // Red
  0: Colors.success, // Green for GO!
};

export function CountdownReady({ onComplete }: CountdownReadyProps) {
  const [count, setCount] = useState(3);
  const scale = useSharedValue(2);
  const opacity = useSharedValue(0);
  const feedback = useFeedback();

  useEffect(() => {
    // Reset animation values
    scale.value = 2;
    opacity.value = 0;

    // Animate in with spring
    scale.value = withSpring(1, SPRING_BOUNCY);
    opacity.value = withTiming(1, { duration: 200 });

    // Haptic and sound feedback
    if (count > 0) {
      feedback.onCountdownTick();
    } else {
      feedback.onCountdownGo();
    }

    if (count > 0) {
      // Hold then fade out
      const timer = setTimeout(() => {
        scale.value = withTiming(0.5, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });

        setTimeout(() => {
          setCount(count - 1);
        }, 200);
      }, 700);

      return () => clearTimeout(timer);
    } else {
      // GO! - special animation
      scale.value = 0.5;
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, SPRING_BOUNCY)
      );

      // Trigger game start after GO! animation
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        setTimeout(onComplete, 200);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const currentColor = COUNT_COLORS[count as keyof typeof COUNT_COLORS] || Colors.accent;
  const displayText = count > 0 ? count.toString() : 'GO!';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.textContainer, animatedStyle]}>
        <Animated.Text
          style={[
            styles.countText,
            {
              color: currentColor,
              textShadowColor: currentColor,
            },
          ]}
        >
          {displayText}
        </Animated.Text>
      </Animated.View>

      {/* Background glow effect */}
      <View
        style={[
          styles.backgroundGlow,
          { backgroundColor: currentColor, opacity: 0.1 },
        ]}
      />
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
  textContainer: {
    zIndex: 1,
  },
  countText: {
    fontSize: 140,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  backgroundGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
