import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScreenGlowProps {
  opacity: SharedValue<number>;
  colorValue: SharedValue<number>; // 0 = red, 1 = green
}

export function ScreenGlow({ opacity, colorValue }: ScreenGlowProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorValue.value,
      [0, 1],
      [Colors.error, Colors.success]
    );

    return {
      opacity: opacity.value,
      shadowColor: color,
      borderColor: color,
    };
  });

  return (
    <Animated.View
      style={[styles.screenGlow, animatedStyle]}
      pointerEvents="none"
    />
  );
}

interface ScreenShakeContainerProps {
  shakeX: SharedValue<number>;
  children: React.ReactNode;
}

export function ScreenShakeContainer({ shakeX, children }: ScreenShakeContainerProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={[styles.shakeContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screenGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    backgroundColor: 'transparent',
  },
  shakeContainer: {
    flex: 1,
  },
});
