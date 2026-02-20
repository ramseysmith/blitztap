import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShapeRenderer } from './ShapeRenderer';
import { Colors, PieceColor } from '../../utils/colors';
import { ShapeType } from '../../utils/levelGenerator';

interface TargetDisplayProps {
  color: PieceColor;
  shape?: ShapeType;
}

export function TargetDisplay({ color, shape }: TargetDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Match this!</Text>
      <View style={styles.targetWrapper}>
        <ShapeRenderer
          shape={shape || 'circle'}
          color={color}
          size={80}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  targetWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
});
