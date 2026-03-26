import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

const STAR_POSITIONS = [
  { x: 0.15, y: 0.2 },
  { x: 0.5, y: 0.12 },
  { x: 0.75, y: 0.3 },
  { x: 0.25, y: 0.55 },
  { x: 0.65, y: 0.6 },
  { x: 0.45, y: 0.8 },
  { x: 0.8, y: 0.75 },
  { x: 0.1, y: 0.8 },
];

// Cosmic: dark fill with galaxy-like star dots and colored tint
export function CosmicSkin({ shape, color, size }: Props) {
  const borderRadius = shape === 'circle' ? size / 2 : shape === 'square' ? 8 : 4;
  const rotation = shape === 'diamond' ? '45deg' : '0deg';
  const containerSize = shape === 'diamond' ? size * 0.72 : size;

  const innerContent = (
    <>
      {/* Base: deep dark with color tint overlay */}
      <View style={[styles.colorTint, { backgroundColor: color + '30', borderRadius }]} />
      {/* Star dots */}
      {STAR_POSITIONS.map((pos, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              left: pos.x * containerSize,
              top: pos.y * containerSize,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              backgroundColor: i % 4 === 0 ? color : '#FFFFFF',
              borderRadius: 2,
              opacity: 0.6 + (i % 3) * 0.15,
            },
          ]}
        />
      ))}
      {/* Nebula haze in center */}
      <View style={[styles.nebula, { backgroundColor: color + '20', borderRadius: containerSize / 2 }]} />
    </>
  );

  if (shape === 'triangle') {
    const triH = size * 0.85;
    const triW = size * 0.43;
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
        {/* Color tint triangle (back layer) */}
        <View style={[styles.triangleBase, {
          borderBottomColor: color + '35',
          borderBottomWidth: triH,
          borderLeftWidth: triW,
          borderRightWidth: triW,
        }]} />
        {/* Dark base triangle (slightly inset to let color show at edges) */}
        <View style={[styles.triangleBase, {
          borderBottomColor: '#0A0A1A',
          borderBottomWidth: triH - 4,
          borderLeftWidth: triW - 2,
          borderRightWidth: triW - 2,
          bottom: 0,
        }]} />
        {/* Nebula haze (centered in triangle) */}
        <View style={{
          position: 'absolute',
          bottom: triH * 0.25,
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: size * 0.175,
          backgroundColor: color + '20',
          alignSelf: 'center',
        }} />
        {/* Star dots */}
        {STAR_POSITIONS.slice(0, 5).map((pos, i) => (
          <View key={i} style={[styles.star, {
            left: pos.x * size,
            bottom: pos.y * size * 0.8,
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            backgroundColor: i % 4 === 0 ? color : '#FFFFFF',
            opacity: 0.6 + (i % 3) * 0.15,
          }]} />
        ))}
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
          transform: [{ rotate: rotation }],
        },
      ]}
    >
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#0A0A1A',
    overflow: 'hidden',
  },
  colorTint: {
    ...StyleSheet.absoluteFillObject,
  },
  nebula: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: '25%',
    left: '25%',
    opacity: 0.6,
  },
  star: {
    position: 'absolute',
    borderRadius: 2,
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
});
