// XP and Level system for BlitzTap - Update 2

import AsyncStorage from '@react-native-async-storage/async-storage';

const LEVEL_KEY = 'blitztap_player_level';

export interface LevelReward {
  level: number;
  coins: number;
  bonusItem?: string;
}

export interface PlayerLevel {
  level: number;
  currentXP: number;
  totalXP: number;
  unclaimedRewards: LevelReward[];
}

const DEFAULT_LEVEL: PlayerLevel = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  unclaimedRewards: [],
};

// ─── XP Config ───────────────────────────────────────────────────────────────

export const XP_CONFIG = {
  correctTap: 1,
  gameComplete: 10,
  dailyChallenge: 25,
  dailyPerfect: 50,
  achievementUnlock: 15,
  shareScore: 5,
  newHighScore: 20,
} as const;

// ─── Level math ──────────────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return Math.round(100 * (1 + 0.15 * (level - 1)));
}

export function levelReward(level: number): LevelReward {
  const baseCoins = 25 + level * 5;

  if (level === 5) return { level, coins: baseCoins + 100, bonusItem: 'Exclusive: "Veteran" title badge' };
  if (level === 10) return { level, coins: baseCoins + 250, bonusItem: 'Exclusive shape skin: "Holographic"' };
  if (level === 15) return { level, coins: baseCoins + 150 };
  if (level === 20) return { level, coins: baseCoins + 500, bonusItem: 'Exclusive background: "Champions Arena"' };
  if (level === 25) return { level, coins: baseCoins + 300, bonusItem: 'Exclusive effect: "Golden Trail"' };
  if (level === 50) return { level, coins: baseCoins + 1000, bonusItem: 'Exclusive shape skin: "Prismatic"' };

  return { level, coins: baseCoins };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function getPlayerLevel(): Promise<PlayerLevel> {
  try {
    const data = await AsyncStorage.getItem(LEVEL_KEY);
    if (!data) return { ...DEFAULT_LEVEL };
    return { ...DEFAULT_LEVEL, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_LEVEL };
  }
}

export async function savePlayerLevel(level: PlayerLevel): Promise<void> {
  try {
    await AsyncStorage.setItem(LEVEL_KEY, JSON.stringify(level));
  } catch (error) {
    console.error('Error saving player level:', error);
  }
}

export interface AddXPResult {
  newLevel: PlayerLevel;
  levelUps: LevelReward[];
}

export async function addXP(amount: number): Promise<AddXPResult> {
  const current = await getPlayerLevel();
  let { level, currentXP, totalXP, unclaimedRewards } = current;

  totalXP += amount;
  currentXP += amount;

  const levelUps: LevelReward[] = [];

  // Check for level ups
  let threshold = xpForLevel(level);
  while (currentXP >= threshold) {
    currentXP -= threshold;
    level++;
    const reward = levelReward(level);
    levelUps.push(reward);
    unclaimedRewards.push(reward);
    threshold = xpForLevel(level);
  }

  const newLevel: PlayerLevel = { level, currentXP, totalXP, unclaimedRewards };
  await savePlayerLevel(newLevel);

  return { newLevel, levelUps };
}

export async function claimLevelReward(rewardLevel: number): Promise<{ coins: number; playerLevel: PlayerLevel }> {
  const current = await getPlayerLevel();
  const idx = current.unclaimedRewards.findIndex(r => r.level === rewardLevel);
  if (idx < 0) return { coins: 0, playerLevel: current };

  const reward = current.unclaimedRewards[idx];
  current.unclaimedRewards.splice(idx, 1);
  await savePlayerLevel(current);

  return { coins: reward.coins, playerLevel: current };
}
