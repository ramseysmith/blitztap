import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SquareProps {
  color: string;
  size: number;
}

export function Square({ color, size }: SquareProps) {
  return (
    <View
      style={[
        styles.square,
        {
          width: size,
          height: size,
          backgroundColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  square: {
    borderRadius: 4,
  },
});
