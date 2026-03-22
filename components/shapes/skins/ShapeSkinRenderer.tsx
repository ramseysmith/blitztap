import React from 'react';
import { ShapeType } from '../../../utils/levelGenerator';
import { PieceColor, getPieceColor } from '../../../utils/colors';
import { ShapeRenderer } from '../../game/ShapeRenderer';
import { NeonGlowSkin } from './NeonGlow';
import { PixelArtSkin } from './PixelArt';
import { GlassSkin } from './GlassSkin';
import { ChromeSkin } from './ChromeSkin';
import { GradientSkin } from './GradientSkin';
import { CosmicSkin } from './CosmicSkin';
import { InfernoSkin } from './InfernoSkin';
import { CrystalSkin } from './CrystalSkin';

interface Props {
  shape: ShapeType;
  color: PieceColor;
  size: number;
  skinId: string; // 'default' or item ID
}

export function ShapeSkinRenderer({ shape, color, size, skinId }: Props) {
  const colorValue = getPieceColor(color);

  switch (skinId) {
    case 'shape_neon':
      return <NeonGlowSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_pixel':
      return <PixelArtSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_glass':
      return <GlassSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_metallic':
      return <ChromeSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_gradient':
      return <GradientSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_cosmic':
      return <CosmicSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_fire':
      return <InfernoSkin shape={shape} color={colorValue} size={size} />;
    case 'shape_diamond':
      return <CrystalSkin shape={shape} color={colorValue} size={size} />;
    default:
      return <ShapeRenderer shape={shape} color={color} size={size} />;
  }
}
