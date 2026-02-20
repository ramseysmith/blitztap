// Color palette for BlitzTap

export const Colors = {
  // Background and UI
  background: '#1A1A2E',
  backgroundLight: '#25253D',

  // Accent colors
  accent: '#00D4FF',
  success: '#00FF88',
  error: '#FF3366',
  warning: '#FFB800',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',

  // Game piece colors (high contrast against dark background)
  pieces: {
    red: '#FF4444',
    blue: '#4488FF',
    green: '#44DD44',
    yellow: '#FFDD44',
    purple: '#AA44FF',  // Tier 3+
    orange: '#FF8844',  // Tier 4
  },
} as const;

// Array of piece colors for easy iteration
export const TIER_1_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export const TIER_3_COLORS = [...TIER_1_COLORS, 'purple'] as const;
export const TIER_4_COLORS = [...TIER_3_COLORS, 'orange'] as const;

export type PieceColor = keyof typeof Colors.pieces;

// Get the hex value for a piece color
export function getPieceColor(color: PieceColor): string {
  return Colors.pieces[color];
}

// Timer bar color based on progress (0-1, where 1 is full time)
export function getTimerColor(progress: number): string {
  if (progress > 0.5) return Colors.success;
  if (progress > 0.25) return Colors.warning;
  return Colors.error;
}
