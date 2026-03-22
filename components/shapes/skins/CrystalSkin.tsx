import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ShapeType } from '../../../utils/levelGenerator';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Crystal: sparkling crystalline with shimmer animation
export function CrystalSkin({ shape, color, size }: Props) {
  const { reduceMotion } = useAccessibility();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [reduceMotion]);

  const shimmerStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: shimmer.value * 0.7 };
  });

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'square' ? 6 : 4;
  const rotation = shape === 'diamond' ? '45deg' : '0deg';
  const containerSize = shape === 'diamond' ? size * 0.72 : size;

  if (shape === 'triangle') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={[styles.triangleFill, {
          borderBottomColor: color + 'AA',
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
          position: 'absolute', bottom: 0,
        }]} />
        <View style={[styles.triangleFill, {
          borderBottomColor: '#FFFFFF33',
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
          position: 'absolute', bottom: 0,
        }]} />
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
          backgroundColor: color + '88',
          borderColor: color,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {/* Facet lines */}
      <View style={[styles.facet1, { borderColor: 'rgba(255,255,255,0.3)' }]} />
      <View style={[styles.facet2, { borderColor: 'rgba(255,255,255,0.15)' }]} />
      {/* Shimmer highlight */}
      <Animated.View style={[styles.shimmer, shimmerStyle, { borderRadius: borderRadius - 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  facet1: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    width: '40%',
    height: '60%',
    borderWidth: 1,
    transform: [{ rotate: '20deg' }],
  },
  facet2: {
    position: 'absolute',
    top: '10%',
    right: '15%',
    width: '30%',
    height: '50%',
    borderWidth: 1,
    transform: [{ rotate: '-15deg' }],
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  triangleFill: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
