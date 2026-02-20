// Scoring logic for BlitzTap

/**
 * Calculate the streak multiplier based on current streak
 * Streak of 5 = 2x, Streak of 10 = 3x, Streak of 20 = 5x
 */
export function calculateMultiplier(streak: number): number {
  if (streak >= 20) return 5;
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
}

/**
 * Calculate the tier based on current score
 * Tier 1: 0-9, Tier 2: 10-24, Tier 3: 25-49, Tier 4: 50+
 */
export function calculateTier(score: number): 1 | 2 | 3 | 4 {
  if (score >= 50) return 4;
  if (score >= 25) return 3;
  if (score >= 10) return 2;
  return 1;
}

/**
 * Get the time per tap based on tier
 */
export function getTimePerTap(tier: 1 | 2 | 3 | 4): number {
  switch (tier) {
    case 1: return 3.0;
    case 2: return 2.2;
    case 3: return 1.6;
    case 4: return 1.2;
  }
}

/**
 * Get the grid size based on tier
 */
export function getGridSize(tier: 1 | 2 | 3 | 4): number {
  switch (tier) {
    case 1: return 4;   // 2x2
    case 2: return 6;   // 3x2
    case 3: return 9;   // 3x3
    case 4: return 12;  // 4x3
  }
}

/**
 * Get the number of grid columns based on tier
 */
export function getGridColumns(tier: 1 | 2 | 3 | 4): number {
  switch (tier) {
    case 1: return 2;
    case 2: return 3;
    case 3: return 3;
    case 4: return 4;
  }
}

/**
 * Calculate coins earned for a round
 * - 10 coins per round played (participation reward)
 * - 1 coin per correct tap
 * - 50 bonus for beating personal best
 * - 25 bonus for streak of 10+
 */
export function calculateRoundCoins(
  score: number,
  maxStreak: number,
  isNewHighScore: boolean
): number {
  let coins = 10; // Participation reward
  coins += score; // 1 coin per correct tap

  if (isNewHighScore) {
    coins += 50;
  }

  if (maxStreak >= 10) {
    coins += 25;
  }

  return coins;
}
