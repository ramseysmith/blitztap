import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, PieceColor } from '../../utils/colors';
import { ShapeType } from '../../utils/levelGenerator';
import { ShapeSkinRenderer } from '../shapes/skins/ShapeSkinRenderer';

interface TargetDisplayProps {
  color: PieceColor;
  shape?: ShapeType;
  skinId?: string;
}

export function TargetDisplay({ color, shape, skinId = 'default' }: TargetDisplayProps) {
  const shapeLabel = shape ? `${color} ${shape}` : color;
  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Match target: ${shapeLabel}`}
    >
      <Text style={styles.label}>Match this!</Text>
      <View style={styles.targetWrapper}>
        <ShapeSkinRenderer
          shape={shape || 'circle'}
          color={color}
          size={80}
          skinId={skinId}
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
