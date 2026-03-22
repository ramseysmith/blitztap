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
