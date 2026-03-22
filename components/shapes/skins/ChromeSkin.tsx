import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Chrome: metallic finish with bright specular highlight
export function ChromeSkin({ shape, color, size }: Props) {
  const borderRadius = shape === 'circle' ? size / 2 : shape === 'square' ? 8 : 4;
  const rotation = shape === 'diamond' ? '45deg' : '0deg';
  const containerSize = shape === 'diamond' ? size * 0.72 : size;

  if (shape === 'triangle') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={[styles.triangleBase, {
          borderBottomColor: color,
          borderBottomWidth: size * 0.85,
          borderLeftWidth: size * 0.43,
          borderRightWidth: size * 0.43,
        }]} />
        <View style={[styles.triangleShine, {
          borderBottomColor: 'rgba(255,255,255,0.4)',
          borderBottomWidth: size * 0.3,
          borderLeftWidth: size * 0.15,
          borderRightWidth: size * 0.15,
          bottom: size * 0.4,
          left: size * 0.28,
        }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: color,
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {/* Top shine */}
      <View style={[styles.shine, { borderRadius: borderRadius - 2 }]} />
      {/* Bottom shadow */}
      <View style={[styles.shadow, { borderRadius: borderRadius - 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  shine: {
    position: 'absolute',
    top: '5%',
    left: '8%',
    width: '55%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  shadow: {
    position: 'absolute',
    bottom: '5%',
    right: '8%',
    width: '40%',
    height: '25%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  triangleBase: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    bottom: 0,
  },
  triangleShine: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
  },
});
