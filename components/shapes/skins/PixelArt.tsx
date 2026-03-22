import React from 'react';
import { View } from 'react-native';
import { ShapeType } from '../../../utils/levelGenerator';

interface Props {
  shape: ShapeType;
  color: string;
  size: number;
}

// 8x8 pixel circle mask — 1 = filled, 0 = empty
const CIRCLE_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];

// Pixel Art: chunky blocky look with distinct per-shape rendering
export function PixelArtSkin({ shape, color, size }: Props) {
  const cols = 8;
  const blockSize = Math.floor(size / cols);
  const gridSize = blockSize * cols;

  if (shape === 'circle') {
    return (
      <View style={{ width: gridSize, height: gridSize }}>
        {CIRCLE_GRID.map((row, rowIdx) =>
          row.map((cell, colIdx) =>
            cell ? (
              <View
                key={`${rowIdx}-${colIdx}`}
                style={{
                  position: 'absolute',
                  top: rowIdx * blockSize,
                  left: colIdx * blockSize,
                  width: blockSize,
                  height: blockSize,
                  backgroundColor: color,
                }}
              />
            ) : null
          )
        )}
      </View>
    );
  }

  if (shape === 'square') {
    // Solid filled square, sharp corners, clearly blocky
    return (
      <View style={{
        width: gridSize,
        height: gridSize,
        backgroundColor: color,
        borderRadius: 0,
      }} />
    );
  }

  if (shape === 'diamond') {
    // Stepped diamond using stacked rows that widen then narrow
    const steps = 7;
    const stepH = Math.floor(gridSize / steps);
    const rows = Array.from({ length: steps }, (_, i) => {
      const half = Math.floor(steps / 2);
      const dist = Math.abs(i - half);
      const w = Math.round(gridSize * (1 - dist / (half + 1)));
      return w;
    });
    return (
      <View style={{ width: gridSize, height: gridSize, alignItems: 'center', justifyContent: 'center' }}>
        {rows.map((w, i) => (
          <View
            key={i}
            style={{
              width: w,
              height: stepH,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
    );
  }

  if (shape === 'triangle') {
    // Stepped triangle — narrow at top, wide at bottom
    const steps = 6;
    const stepH = Math.floor(gridSize / steps);
    return (
      <View style={{ width: gridSize, height: gridSize, alignItems: 'center', justifyContent: 'flex-end' }}>
        {Array.from({ length: steps }, (_, i) => {
          // i=0 at top of flex stack (narrowest), i=steps-1 at bottom (widest)
          const w = Math.round(gridSize * ((steps - i) / steps));
          // Snap width to nearest blockSize for pixel feel
          const snapped = Math.round(w / blockSize) * blockSize;
          return (
            <View
              key={i}
              style={{
                width: snapped,
                height: stepH,
                backgroundColor: color,
              }}
            />
          );
        }).reverse()}
      </View>
    );
  }

  return null;
}
