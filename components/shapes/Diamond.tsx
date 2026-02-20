import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DiamondProps {
  color: string;
  size: number;
}

export function Diamond({ color, size }: DiamondProps) {
  // Diamond is a rotated square
  const innerSize = size * 0.707; // 1/sqrt(2) to fit in bounding box

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.diamond,
          {
            width: innerSize,
            height: innerSize,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamond: {
    transform: [{ rotate: '45deg' }],
    borderRadius: 4,
  },
});
