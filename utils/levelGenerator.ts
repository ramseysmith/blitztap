// Level generation for BlitzTap

import {
  TIER_1_COLORS,
  TIER_3_COLORS,
  TIER_4_COLORS,
  PieceColor
} from './colors';
import {
  calculateTier,
  getTimePerTap,
  getGridSize,
  getGridColumns
} from './scoring';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'diamond';

export interface Target {
  color: PieceColor;
  shape?: ShapeType;
}

export interface Option {
  id: string;
  color: PieceColor;
  shape: ShapeType;
  isCorrect: boolean;
}

export interface RoundData {
  target: Target;
  options: Option[];
  gridColumns: number;
  timePerTap: number;
  tier: 1 | 2 | 3 | 4;
}

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'diamond'];

let optionIdCounter = 0;

function generateId(): string {
  return `opt_${++optionIdCounter}_${Math.random().toString(36).substr(2, 5)}`;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRandomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getColorsForTier(tier: 1 | 2 | 3 | 4): readonly PieceColor[] {
  if (tier >= 4) return TIER_4_COLORS;
  if (tier >= 3) return TIER_3_COLORS;
  return TIER_1_COLORS;
}

/**
 * Generate a round based on current score
 *
 * Tier 1 (0-9): Color match only, 4 options (2x2)
 * Tier 2 (10-24): Color AND shape match, 6 options (3x2)
 * Tier 3 (25-49): Same as tier 2 but 9 options (3x3), more near-misses
 * Tier 4 (50+): 12 options (4x3), maximum confusion
 */
export function generateRound(score: number): RoundData {
  const tier = calculateTier(score);
  const gridSize = getGridSize(tier);
  const gridColumns = getGridColumns(tier);
  const timePerTap = getTimePerTap(tier);
  const availableColors = getColorsForTier(tier);

  if (tier === 1) {
    return generateTier1Round(gridSize, gridColumns, timePerTap, availableColors);
  }

  return generateAdvancedRound(tier, gridSize, gridColumns, timePerTap, availableColors);
}

function generateTier1Round(
  gridSize: number,
  gridColumns: number,
  timePerTap: number,
  availableColors: readonly PieceColor[]
): RoundData {
  // Tier 1: Color match only - all shapes are circles
  const targetColor = getRandomItem(availableColors);
  const target: Target = { color: targetColor };

  const options: Option[] = [];

  // Add the correct answer
  options.push({
    id: generateId(),
    color: targetColor,
    shape: 'circle',
    isCorrect: true,
  });

  // Add distractors with different colors
  const otherColors = availableColors.filter(c => c !== targetColor);
  const shuffledColors = shuffle([...otherColors]);

  for (let i = 0; i < gridSize - 1; i++) {
    options.push({
      id: generateId(),
      color: shuffledColors[i % shuffledColors.length],
      shape: 'circle',
      isCorrect: false,
    });
  }

  return {
    target,
    options: shuffle(options),
    gridColumns,
    timePerTap,
    tier: 1,
  };
}

function generateAdvancedRound(
  tier: 2 | 3 | 4,
  gridSize: number,
  gridColumns: number,
  timePerTap: number,
  availableColors: readonly PieceColor[]
): RoundData {
  // Tiers 2-4: Color AND shape match
  const targetColor = getRandomItem(availableColors);
  const targetShape = getRandomItem(SHAPES);
  const target: Target = { color: targetColor, shape: targetShape };

  const options: Option[] = [];

  // Add the correct answer
  options.push({
    id: generateId(),
    color: targetColor,
    shape: targetShape,
    isCorrect: true,
  });

  const otherColors = availableColors.filter(c => c !== targetColor);
  const otherShapes = SHAPES.filter(s => s !== targetShape);

  // Calculate how many of each distractor type
  const remainingSlots = gridSize - 1;

  // Near-miss distractors (same color OR same shape, but not both)
  // Higher tiers have more near-misses
  const nearMissCount = tier === 2 ? 2 : tier === 3 ? 4 : 6;
  const actualNearMisses = Math.min(nearMissCount, remainingSlots);

  // Add same-color-different-shape distractors
  const sameColorCount = Math.ceil(actualNearMisses / 2);
  for (let i = 0; i < sameColorCount; i++) {
    options.push({
      id: generateId(),
      color: targetColor,
      shape: otherShapes[i % otherShapes.length],
      isCorrect: false,
    });
  }

  // Add same-shape-different-color distractors
  const sameShapeCount = actualNearMisses - sameColorCount;
  for (let i = 0; i < sameShapeCount; i++) {
    options.push({
      id: generateId(),
      color: otherColors[i % otherColors.length],
      shape: targetShape,
      isCorrect: false,
    });
  }

  // Fill remaining slots with random distractors (different color AND shape)
  const fillerCount = remainingSlots - actualNearMisses;
  for (let i = 0; i < fillerCount; i++) {
    options.push({
      id: generateId(),
      color: otherColors[i % otherColors.length],
      shape: otherShapes[i % otherShapes.length],
      isCorrect: false,
    });
  }

  return {
    target,
    options: shuffle(options),
    gridColumns,
    timePerTap,
    tier,
  };
}
