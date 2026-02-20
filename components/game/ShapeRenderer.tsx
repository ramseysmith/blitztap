import React from 'react';
import { Circle, Square, Triangle, Diamond } from '../shapes';
import { getPieceColor, PieceColor } from '../../utils/colors';
import { ShapeType } from '../../utils/levelGenerator';

interface ShapeRendererProps {
  shape: ShapeType;
  color: PieceColor;
  size: number;
}

export function ShapeRenderer({ shape, color, size }: ShapeRendererProps) {
  const colorValue = getPieceColor(color);

  switch (shape) {
    case 'circle':
      return <Circle color={colorValue} size={size} />;
    case 'square':
      return <Square color={colorValue} size={size} />;
    case 'triangle':
      return <Triangle color={colorValue} size={size} />;
    case 'diamond':
      return <Diamond color={colorValue} size={size} />;
    default:
      return <Circle color={colorValue} size={size} />;
  }
}
