import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Gradient: multi-tone look using color + overlays to simulate gradient
export function GradientSkin({ shape, color, size }: Props) {
  if (shape === 'triangle') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={[styles.triangle, {
          borderBottomColor: color,
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
          position: 'absolute',
          bottom: 0,
        }]} />
        {/* Lighter overlay to simulate gradient */}
        <View style={[styles.triangle, {
          borderBottomColor: 'rgba(255,255,255,0.25)',
          borderBottomWidth: size * 0.4,
          borderLeftWidth: size * 0.2,
          borderRightWidth: size * 0.2,
          position: 'absolute',
          bottom: size * 0.43,
        }]} />
      </View>
    );
  }

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'square' ? 8 : 4;
  const rotation = shape === 'diamond' ? '45deg' : '0deg';
  const containerSize = shape === 'diamond' ? size * 0.72 : size;

  return (
    <View
      style={[
        styles.base,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: color,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {/* Light-to-dark gradient approximation */}
      <View style={[styles.topGradient, { borderRadius }]} />
      <View style={[styles.bottomGradient, { borderRadius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
