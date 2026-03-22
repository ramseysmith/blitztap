import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'blitztap_stats';

export type GameMode = 'classic' | 'timeAttack' | 'zen';

export interface ModeStats {
  gamesPlayed: number;
  highScore: number;
  highStreak: number;
  highTier: number;
  totalScore: number;
  totalTimePlayed: number; // seconds
}

const DEFAULT_MODE_STATS: ModeStats = {
  gamesPlayed: 0,
  highScore: 0,
  highStreak: 0,
  highTier: 1,
  totalScore: 0,
  totalTimePlayed: 0,
};

export interface GameStats {
  // Per-mode stats
  classic: ModeStats;
  timeAttack: ModeStats;
  zen: ModeStats;
  // Global stats
  totalGamesPlayed: number;
  totalCorrectTaps: number;
  totalTimePlayed: number; // seconds
  highScore: number;
  highStreak: number;
  highTier: number;
  totalScoreSum: number;
  totalCoinsEarned: number;
  shapeTapCounts: Record<string, number>; // e.g. { 'red_circle': 42 }
  firstPlayDate: string; // ISO date string
}

const DEFAULT_STATS: GameStats = {
  classic: { ...DEFAULT_MODE_STATS },
  timeAttack: { ...DEFAULT_MODE_STATS },
  zen: { ...DEFAULT_MODE_STATS },
  totalGamesPlayed: 0,
  totalCorrectTaps: 0,
  totalTimePlayed: 0,
  highScore: 0,
  highStreak: 0,
  highTier: 1,
  totalScoreSum: 0,
  totalCoinsEarned: 0,
  shapeTapCounts: {},
  firstPlayDate: new Date().toISOString(),
};

export async function getStats(): Promise<GameStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (!data) return { ...DEFAULT_STATS, firstPlayDate: new Date().toISOString() };
    const parsed = JSON.parse(data);
    // Migration: if per-mode stats don't exist, initialize from global
    const migrated: GameStats = {
      ...DEFAULT_STATS,
      ...parsed,
      classic: parsed.classic ?? {
        ...DEFAULT_MODE_STATS,
        gamesPlayed: parsed.totalGamesPlayed ?? 0,
        highScore: parsed.highScore ?? 0,
        highStreak: parsed.highStreak ?? 0,
        highTier: parsed.highTier ?? 1,
        totalScore: parsed.totalScoreSum ?? 0,
        totalTimePlayed: parsed.totalTimePlayed ?? 0,
      },
      timeAttack: parsed.timeAttack ?? { ...DEFAULT_MODE_STATS },
      zen: parsed.zen ?? { ...DEFAULT_MODE_STATS },
    };
    return migrated;
  } catch {
    return { ...DEFAULT_STATS, firstPlayDate: new Date().toISOString() };
  }
}

export async function recordGameResult(params: {
  score: number;
  correctTaps: number;
  maxStreak: number;
  tier: number;
  coinsEarned: number;
  timePlayed: number;
  shapeTaps: Record<string, number>;
  mode?: GameMode;
}): Promise<void> {
  try {
    const current = await getStats();
    const isFirstPlay = current.totalGamesPlayed === 0;
    const mode = params.mode ?? 'classic';

    const updatedMode: ModeStats = {
      gamesPlayed: current[mode].gamesPlayed + 1,
      highScore: Math.max(current[mode].highScore, params.score),
      highStreak: Math.max(current[mode].highStreak, params.maxStreak),
      highTier: Math.max(current[mode].highTier, params.tier),
      totalScore: current[mode].totalScore + params.score,
      totalTimePlayed: current[mode].totalTimePlayed + params.timePlayed,
    };

    const updated: GameStats = {
      ...current,
      [mode]: updatedMode,
      totalGamesPlayed: current.totalGamesPlayed + 1,
      totalCorrectTaps: current.totalCorrectTaps + params.correctTaps,
      totalTimePlayed: current.totalTimePlayed + params.timePlayed,
      highScore: Math.max(current.highScore, params.score),
      highStreak: Math.max(current.highStreak, params.maxStreak),
      highTier: Math.max(current.highTier, params.tier),
      totalScoreSum: current.totalScoreSum + params.score,
      totalCoinsEarned: current.totalCoinsEarned + params.coinsEarned,
      shapeTapCounts: mergeShapeCounts(current.shapeTapCounts, params.shapeTaps),
      firstPlayDate: isFirstPlay ? new Date().toISOString() : current.firstPlayDate,
    };

    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error recording stats:', error);
  }
}

function mergeShapeCounts(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const result = { ...a };
  for (const key of Object.keys(b)) {
    result[key] = (result[key] || 0) + b[key];
  }
  return result;
}

export function getFavoriteShape(shapeTapCounts: Record<string, number>): string {
  const entries = Object.entries(shapeTapCounts);
  if (entries.length === 0) return '—';
  const top = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best), entries[0]);
  const [colorShape] = top;
  const parts = colorShape.split('_');
  if (parts.length === 2) {
    const [color, shape] = parts;
    return `${color.charAt(0).toUpperCase() + color.slice(1)} ${shape}`;
  }
  return colorShape;
}
