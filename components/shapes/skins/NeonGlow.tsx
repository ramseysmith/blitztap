import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Neon Glow: dark fill with bright neon border and glow shadow
export function NeonGlowSkin({ shape, color, size }: Props) {
  if (shape === 'triangle') {
    const borderThickness = 2.5;
    const outerH = size * 0.85;
    const outerW = size * 0.43;
    // Inner triangle is smaller to simulate a border: subtract border thickness scaled to triangle geometry
    const inset = borderThickness * 2;
    const innerH = outerH - inset * 1.73;
    const innerW = outerW - inset;
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Outer glow layer */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color + '44',
          borderBottomWidth: outerH + 6,
          borderLeftWidth: outerW + 4,
          borderRightWidth: outerW + 4,
        }} />
        {/* Colored border triangle */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          borderBottomWidth: outerH,
          borderLeftWidth: outerW,
          borderRightWidth: outerW,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
        }} />
        {/* Black inner triangle to create hollow/border effect */}
        <View style={{
          position: 'absolute',
          bottom: inset * 0.6,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#0A0A14',
          borderBottomWidth: innerH,
          borderLeftWidth: innerW,
          borderRightWidth: innerW,
        }} />
      </View>
    );
  }

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'square' ? 6 : 4;
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
          borderColor: color,
          shadowColor: color,
          transform: [{ rotate: rotation }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#0A0A14',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
});
