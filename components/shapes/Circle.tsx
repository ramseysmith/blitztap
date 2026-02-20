import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CircleProps {
  color: string;
  size: number;
}

export function Circle({ color, size }: CircleProps) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {},
});
