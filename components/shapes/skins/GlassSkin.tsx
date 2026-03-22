import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Glass: semi-transparent fill with highlight overlay
export function GlassSkin({ shape, color, size }: Props) {
  if (shape === 'triangle') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={[styles.triangle, {
          borderBottomColor: color + '88',
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
          position: 'absolute',
          bottom: 0,
        }]} />
        {/* Top highlight */}
        <View style={[styles.triangle, {
          borderBottomColor: 'rgba(255,255,255,0.3)',
          borderBottomWidth: size * 0.3,
          borderLeftWidth: size * 0.15,
          borderRightWidth: size * 0.15,
          position: 'absolute',
          bottom: size * 0.5,
          alignSelf: 'center',
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
          backgroundColor: color + '55',
          borderColor: color + 'AA',
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {/* Highlight shimmer */}
      <View style={[styles.highlight, { borderRadius: borderRadius - 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  highlight: {
    width: '60%',
    height: '35%',
    marginTop: '8%',
    marginLeft: '10%',
    backgroundColor: 'rgba(255,255,255,0.35)',
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
