import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface RippleEffectProps {
  trigger: number; // Increment to trigger a ripple
  size: number;
  color?: string;
}

export function RippleEffect({ trigger, size, color = '#FFFFFF' }: RippleEffectProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (trigger > lastTrigger.current) {
      lastTrigger.current = trigger;

      // Reset and animate
      scale.value = 0.5;
      opacity.value = 0.8;

      scale.value = withTiming(2, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [trigger, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  ripple: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
    left: '50%',
    top: '50%',
  },
});
