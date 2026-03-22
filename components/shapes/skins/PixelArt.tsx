import React from 'react';
import { View } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// Pixel Art: chunky blocky look with stepped border
export function PixelArtSkin({ shape, color, size }: Props) {
  const blockSize = Math.round(size / 6);

  if (shape === 'circle') {
    // Approximate circle with blocks — large center + small corner blocks
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.8, height: size * 0.8, backgroundColor: color, borderRadius: 2 }} />
        {/* Corner cutouts to make it rounder */}
        <View style={{ position: 'absolute', top: 0, left: 0, width: blockSize, height: blockSize, backgroundColor: 'transparent' }} />
        <View style={{ position: 'absolute', top: 0, right: 0, width: blockSize, height: blockSize, backgroundColor: 'transparent' }} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, width: blockSize, height: blockSize, backgroundColor: 'transparent' }} />
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: blockSize, height: blockSize, backgroundColor: 'transparent' }} />
      </View>
    );
  }

  if (shape === 'diamond') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: size * 0.65,
          height: size * 0.65,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          borderRadius: 2,
        }} />
      </View>
    );
  }

  if (shape === 'triangle') {
    // Chunky stepped triangle using stacked rectangles
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        {[1, 0.75, 0.5, 0.25].map((w, i) => (
          <View
            key={i}
            style={{
              width: size * w,
              height: Math.max(blockSize, Math.round(size / 4)),
              backgroundColor: color,
            }}
          />
        ))}
      </View>
    );
  }

  // Square
  return (
    <View style={{ width: size * 0.85, height: size * 0.85, backgroundColor: color, borderRadius: 2 }} />
  );
}
