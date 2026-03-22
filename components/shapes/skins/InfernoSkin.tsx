import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ShapeType } from '../../../utils/levelGenerator';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Inferno: animated fire-like flickering effect
export function InfernoSkin({ shape, color, size }: Props) {
  const { reduceMotion } = useAccessibility();
  const flicker = useSharedValue(0.7);
  const flicker2 = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150, easing: Easing.linear }),
        withTiming(0.6, { duration: 200, easing: Easing.linear }),
        withTiming(0.9, { duration: 100, easing: Easing.linear }),
        withTiming(0.5, { duration: 250, easing: Easing.linear }),
      ),
      -1,
      true,
    );
    flicker2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 200, easing: Easing.linear }),
        withTiming(0.3, { duration: 150, easing: Easing.linear }),
        withTiming(0.7, { duration: 300, easing: Easing.linear }),
      ),
      -1,
      true,
    );
  }, [reduceMotion]);

  const flickerStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: flicker.value };
  });

  const flicker2Style = useAnimatedStyle(() => {
    'worklet';
    return { opacity: flicker2.value };
  });

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'square' ? 6 : 4;
  const rotation = shape === 'diamond' ? '45deg' : '0deg';
  const containerSize = shape === 'diamond' ? size * 0.72 : size;

  if (shape === 'triangle') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={[styles.triangleBase, {
          borderBottomColor: '#2A0A00',
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
          position: 'absolute', bottom: 0,
        }]} />
        <Animated.View style={[flickerStyle, { position: 'absolute', bottom: size * 0.1, left: size * 0.1, right: size * 0.1 }]}>
          <View style={[styles.triangleFlame, {
            borderBottomColor: color,
            borderBottomWidth: size * 0.7,
            borderLeftWidth: size * 0.35,
            borderRightWidth: size * 0.35,
          }]} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {/* Dark char base */}
      <Animated.View style={[flickerStyle, styles.flame1, { backgroundColor: color, borderRadius }]} />
      <Animated.View style={[flicker2Style, styles.flame2, { backgroundColor: '#FF6600', borderRadius }]} />
      <Animated.View style={[flickerStyle, styles.flame3, { backgroundColor: '#FFAA00', borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#1A0500',
    overflow: 'hidden',
  },
  flame1: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  flame2: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: '65%',
    opacity: 0.8,
  },
  flame3: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: '35%',
    opacity: 0.9,
  },
  triangleBase: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleFlame: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
