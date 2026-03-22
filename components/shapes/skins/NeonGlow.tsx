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
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Outer glow layer (slightly larger, more transparent) */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color + '44',
          borderBottomWidth: (size * 0.85) + 6,
          borderLeftWidth: (size * 0.43) + 4,
          borderRightWidth: (size * 0.43) + 4,
        }} />
        {/* Main triangle */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
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
