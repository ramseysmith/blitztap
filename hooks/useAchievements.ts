// Achievement checking engine for BlitzTap - Update 2

import { useCallback, useRef } from 'react';
import {
  Achievement,
  AchievementProgress,
  ACHIEVEMENTS,
} from '../utils/achievements';
import {
  getAllProgress,
  saveAllProgress,
  markCompleted,
  getActionCounts,
  incrementActionCount,
  recordModePlayedToday,
  getModesPlayedToday,
  getDailyChallengeStreak,
} from '../utils/achievementStorage';
import { getStats, GameStats } from '../utils/stats';
import { addCoins } from '../utils/storage';
import { getInventory } from '../utils/shopStorage';
import { getDailyChallengeHistory } from '../utils/dailyChallenge';

export interface GameResult {
  score: number;
  maxStreak: number;
  tier: number;
  mode: 'classic' | 'timeAttack' | 'zen';
  isNewHighScore: boolean;
  coinsEarned: number;
  correctTaps: number;
}

export interface DailyResult {
  correctTaps: number;
  completed: boolean;
}

export function useAchievements() {
  const processingRef = useRef(false);

  const checkAfterGame = useCallback(async (result: GameResult): Promise<Achievement[]> => {
    if (processingRef.current) return [];
    processingRef.current = true;

    try {
      const [progress, stats, actionCounts] = await Promise.all([
        getAllProgress(),
        getStats(),
        getActionCounts(),
      ]);

      // Record mode played today
      const modesToday = await recordModePlayedToday(result.mode);

      const newlyCompleted: Achievement[] = [];
      const progressMap = new Map(progress.map(p => [p.achievementId, p]));

      for (const achievement of ACHIEVEMENTS) {
        const p = progressMap.get(achievement.id);
        if (!p || p.completed) continue;

        const { completed, newValue } = evaluateAchievement(
          achievement,
          stats,
          result,
          actionCounts,
          modesToday,
          0, // cosmetics checked separately
          0, // daily streak checked separately
        );

        if (newValue !== p.currentValue) {
          p.currentValue = newValue;
        }

        if (completed && !p.completed) {
          p.completed = true;
          p.completedAt = new Date().toISOString();
          newlyCompleted.push(achievement);
        }
      }

      await saveAllProgress(progress);
      return newlyCompleted;
    } finally {
      processingRef.current = false;
    }
  }, []);

  const checkAfterDaily = useCallback(async (result: DailyResult): Promise<Achievement[]> => {
    if (processingRef.current) return [];
    processingRef.current = true;

    try {
      const [progress, stats, actionCounts, dailyStreak, history] = await Promise.all([
        getAllProgress(),
        getStats(),
        getActionCounts(),
        getDailyChallengeStreak(),
        getDailyChallengeHistory(),
      ]);

      const completedDailies = history.filter(h => h.correctTaps > 0).length;
      const perfectDailies = history.filter(h => h.completed).length;

      const newlyCompleted: Achievement[] = [];
      const progressMap = new Map(progress.map(p => [p.achievementId, p]));

      const dailyAchievements = ACHIEVEMENTS.filter(a =>
        a.requirement.mode === 'daily' ||
        a.requirement.type === 'daily_challenge_streak' ||
        a.requirement.type === 'daily_challenge_complete' ||
        a.requirement.type === 'perfect_daily'
      );

      for (const achievement of dailyAchievements) {
        const p = progressMap.get(achievement.id);
        if (!p || p.completed) continue;

        let newValue = p.currentValue;
        let completed = false;

        switch (achievement.requirement.type) {
          case 'daily_challenge_streak':
            newValue = dailyStreak;
            completed = newValue >= achievement.requirement.value;
            break;
          case 'daily_challenge_complete':
            newValue = completedDailies;
            completed = newValue >= achievement.requirement.value;
            break;
          case 'perfect_daily':
            newValue = perfectDailies;
            completed = newValue >= achievement.requirement.value;
            break;
        }

        if (newValue !== p.currentValue) {
          p.currentValue = newValue;
        }
        if (completed && !p.completed) {
          p.completed = true;
          p.completedAt = new Date().toISOString();
          newlyCompleted.push(achievement);
        }
      }

      await saveAllProgress(progress);
      return newlyCompleted;
    } finally {
      processingRef.current = false;
    }
  }, []);

  const checkAfterPurchase = useCallback(async (): Promise<Achievement[]> => {
    if (processingRef.current) return [];
    processingRef.current = true;

    try {
      const [progress, inventory] = await Promise.all([
        getAllProgress(),
        getInventory(),
      ]);

      const cosmeticsOwned = inventory.ownedItems.length;
      const newlyCompleted: Achievement[] = [];
      const progressMap = new Map(progress.map(p => [p.achievementId, p]));

      const cosmeticAchievements = ACHIEVEMENTS.filter(
        a => a.requirement.type === 'cosmetics_owned'
      );

      for (const achievement of cosmeticAchievements) {
        const p = progressMap.get(achievement.id);
        if (!p || p.completed) continue;

        p.currentValue = cosmeticsOwned;
        if (cosmeticsOwned >= achievement.requirement.value) {
          p.completed = true;
          p.completedAt = new Date().toISOString();
          newlyCompleted.push(achievement);
        }
      }

      await saveAllProgress(progress);
      return newlyCompleted;
    } finally {
      processingRef.current = false;
    }
  }, []);

  const checkAfterAction = useCallback(async (actionId: string): Promise<Achievement[]> => {
    if (processingRef.current) return [];
    processingRef.current = true;

    try {
      const count = await incrementActionCount(actionId);
      const progress = await getAllProgress();
      const newlyCompleted: Achievement[] = [];
      const progressMap = new Map(progress.map(p => [p.achievementId, p]));

      const actionAchievements = ACHIEVEMENTS.filter(
        a => a.requirement.type === 'specific_action' && a.requirement.actionId === actionId
      );

      for (const achievement of actionAchievements) {
        const p = progressMap.get(achievement.id);
        if (!p || p.completed) continue;

        p.currentValue = count;
        if (count >= achievement.requirement.value) {
          p.completed = true;
          p.completedAt = new Date().toISOString();
          newlyCompleted.push(achievement);
        }
      }

      await saveAllProgress(progress);
      return newlyCompleted;
    } finally {
      processingRef.current = false;
    }
  }, []);

  const claimReward = useCallback(async (achievementId: string): Promise<number> => {
    const progress = await getAllProgress();
    const p = progress.find(pr => pr.achievementId === achievementId);
    if (!p || !p.completed || p.claimed) return 0;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return 0;

    p.claimed = true;
    await saveAllProgress(progress);
    await addCoins(achievement.reward);

    return achievement.reward;
  }, []);

  const getCompletionPercentage = useCallback(async (): Promise<number> => {
    const progress = await getAllProgress();
    const completed = progress.filter(p => p.completed).length;
    return Math.round((completed / ACHIEVEMENTS.length) * 100);
  }, []);

  const backfillProgress = useCallback(async (): Promise<Achievement[]> => {
    // Run on first launch after update: check existing stats against all achievements
    const [progress, stats, inventory, actionCounts, dailyStreak, history] = await Promise.all([
      getAllProgress(),
      getStats(),
      getInventory(),
      getActionCounts(),
      getDailyChallengeStreak(),
      getDailyChallengeHistory(),
    ]);

    const cosmeticsOwned = inventory.ownedItems.length;
    const completedDailies = history.filter(h => h.correctTaps > 0).length;
    const perfectDailies = history.filter(h => h.completed).length;

    const newlyCompleted: Achievement[] = [];

    for (const p of progress) {
      if (p.completed) continue;
      const achievement = ACHIEVEMENTS.find(a => a.id === p.achievementId);
      if (!achievement) continue;

      let value = 0;
      let completed = false;

      switch (achievement.requirement.type) {
        case 'score':
          value = achievement.requirement.mode === 'classic' ? stats.classic.highScore : stats.highScore;
          break;
        case 'streak':
          value = stats.highStreak;
          break;
        case 'tier':
          value = achievement.requirement.mode === 'classic' ? stats.classic.highTier : stats.highTier;
          break;
        case 'games_played':
          if (achievement.requirement.mode === 'classic') value = stats.classic.gamesPlayed;
          else if (achievement.requirement.mode === 'timeAttack') value = stats.timeAttack.gamesPlayed;
          else if (achievement.requirement.mode === 'zen') value = stats.zen.gamesPlayed;
          else value = stats.totalGamesPlayed;
          break;
        case 'total_taps':
          value = stats.totalCorrectTaps;
          break;
        case 'mode_played':
          if (achievement.requirement.mode === 'timeAttack') value = stats.timeAttack.gamesPlayed;
          else if (achievement.requirement.mode === 'zen') value = stats.zen.gamesPlayed;
          break;
        case 'coins_earned':
          value = stats.totalCoinsEarned;
          break;
        case 'cosmetics_owned':
          value = cosmeticsOwned;
          break;
        case 'time_attack_score':
          value = stats.timeAttack.highScore;
          break;
        case 'zen_score':
          value = stats.zen.highScore;
          break;
        case 'daily_challenge_streak':
          value = dailyStreak;
          break;
        case 'daily_challenge_complete':
          value = completedDailies;
          break;
        case 'perfect_daily':
          value = perfectDailies;
          break;
        case 'specific_action':
          value = actionCounts[achievement.requirement.actionId ?? ''] ?? 0;
          break;
      }

      p.currentValue = value;
      completed = value >= achievement.requirement.value;

      if (completed) {
        p.completed = true;
        p.completedAt = new Date().toISOString();
        // Note: NOT auto-claiming so players get the dopamine of claiming
        newlyCompleted.push(achievement);
      }
    }

    await saveAllProgress(progress);
    return newlyCompleted;
  }, []);

  return {
    checkAfterGame,
    checkAfterDaily,
    checkAfterPurchase,
    checkAfterAction,
    claimReward,
    getCompletionPercentage,
    backfillProgress,
    getAllProgress,
  };
}

// ─── Helper: evaluate a single achievement against current state ─────────────

function evaluateAchievement(
  achievement: Achievement,
  stats: GameStats,
  gameResult: GameResult,
  actionCounts: Record<string, number>,
  modesToday: string[],
  cosmeticsOwned: number,
  dailyStreak: number,
): { completed: boolean; newValue: number } {
  const req = achievement.requirement;
  let value = 0;

  switch (req.type) {
    case 'score':
      if (req.mode === 'classic') value = Math.max(stats.classic.highScore, gameResult.mode === 'classic' ? gameResult.score : 0);
      else value = Math.max(stats.highScore, gameResult.score);
      break;

    case 'streak':
      value = Math.max(stats.highStreak, gameResult.maxStreak);
      break;

    case 'tier':
      if (req.mode === 'classic') value = Math.max(stats.classic.highTier, gameResult.mode === 'classic' ? gameResult.tier : 0);
      else value = Math.max(stats.highTier, gameResult.tier);
      break;

    case 'games_played':
      if (req.mode === 'classic') value = stats.classic.gamesPlayed + (gameResult.mode === 'classic' ? 1 : 0);
      else if (req.mode === 'timeAttack') value = stats.timeAttack.gamesPlayed + (gameResult.mode === 'timeAttack' ? 1 : 0);
      else if (req.mode === 'zen') value = stats.zen.gamesPlayed + (gameResult.mode === 'zen' ? 1 : 0);
      else value = stats.totalGamesPlayed + 1;
      break;

    case 'total_taps':
      value = stats.totalCorrectTaps + gameResult.correctTaps;
      break;

    case 'mode_played':
      if (req.mode === 'timeAttack') value = stats.timeAttack.gamesPlayed + (gameResult.mode === 'timeAttack' ? 1 : 0);
      else if (req.mode === 'zen') value = stats.zen.gamesPlayed + (gameResult.mode === 'zen' ? 1 : 0);
      break;

    case 'coins_earned':
      value = stats.totalCoinsEarned + gameResult.coinsEarned;
      break;

    case 'time_attack_score':
      value = Math.max(stats.timeAttack.highScore, gameResult.mode === 'timeAttack' ? gameResult.score : 0);
      break;

    case 'zen_score':
      value = Math.max(stats.zen.highScore, gameResult.mode === 'zen' ? gameResult.score : 0);
      break;

    case 'cosmetics_owned':
      value = cosmeticsOwned;
      break;

    case 'specific_action':
      if (req.actionId === 'all_modes_one_day') {
        value = modesToday.length >= 3 ? 1 : 0;
      } else {
        value = actionCounts[req.actionId ?? ''] ?? 0;
      }
      break;

    // Daily types handled in checkAfterDaily
    default:
      return { completed: false, newValue: 0 };
  }

  return {
    completed: value >= req.value,
    newValue: value,
  };
}
