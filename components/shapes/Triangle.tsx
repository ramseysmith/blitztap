import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TriangleProps {
  color: string;
  size: number;
}

export function Triangle({ color, size }: TriangleProps) {
  // Triangle using border trick
  const borderWidth = size / 2;
  const borderHeight = size * 0.866; // sqrt(3)/2 for equilateral

  return (
    <View
      style={[
        styles.triangle,
        {
          borderLeftWidth: borderWidth,
          borderRightWidth: borderWidth,
          borderBottomWidth: borderHeight,
          borderBottomColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
