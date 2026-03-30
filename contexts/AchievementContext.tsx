// Achievement context for BlitzTap - Update 2

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Achievement, AchievementProgress, ACHIEVEMENTS } from '../utils/achievements';
import { getAllProgress, saveAllProgress, markClaimed } from '../utils/achievementStorage';
import { useAchievements, GameResult, DailyResult } from '../hooks/useAchievements';
import { addCoins } from '../utils/storage';

interface AchievementContextType {
  progress: AchievementProgress[];
  isLoaded: boolean;
  pendingToasts: Achievement[];
  checkAfterGame: (result: GameResult) => Promise<void>;
  checkAfterDaily: (result: DailyResult) => Promise<void>;
  checkAfterPurchase: () => Promise<void>;
  checkAfterAction: (actionId: string) => Promise<void>;
  claimReward: (achievementId: string) => Promise<number>;
  dismissToast: () => void;
  refreshProgress: () => Promise<void>;
  completedCount: number;
  unclaimedCount: number;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingToasts, setPendingToasts] = useState<Achievement[]>([]);
  const engine = useAchievements();

  useEffect(() => {
    async function load() {
      const p = await getAllProgress();
      setProgress(p);
      setIsLoaded(true);

      // Backfill on first load after update
      const backfilled = await engine.backfillProgress();
      if (backfilled.length > 0) {
        const updated = await getAllProgress();
        setProgress(updated);
        // Don't toast backfilled achievements - just let them discover when they open the screen
      }
    }
    load();
  }, []);

  const refreshProgress = useCallback(async () => {
    const p = await getAllProgress();
    setProgress(p);
  }, []);

  const checkAfterGame = useCallback(async (result: GameResult) => {
    const newlyCompleted = await engine.checkAfterGame(result);
    if (newlyCompleted.length > 0) {
      setPendingToasts(prev => [...prev, ...newlyCompleted]);
      await refreshProgress();
    }
  }, [engine, refreshProgress]);

  const checkAfterDaily = useCallback(async (result: DailyResult) => {
    const newlyCompleted = await engine.checkAfterDaily(result);
    if (newlyCompleted.length > 0) {
      setPendingToasts(prev => [...prev, ...newlyCompleted]);
      await refreshProgress();
    }
  }, [engine, refreshProgress]);

  const checkAfterPurchase = useCallback(async () => {
    const newlyCompleted = await engine.checkAfterPurchase();
    if (newlyCompleted.length > 0) {
      setPendingToasts(prev => [...prev, ...newlyCompleted]);
      await refreshProgress();
    }
  }, [engine, refreshProgress]);

  const checkAfterAction = useCallback(async (actionId: string) => {
    const newlyCompleted = await engine.checkAfterAction(actionId);
    if (newlyCompleted.length > 0) {
      setPendingToasts(prev => [...prev, ...newlyCompleted]);
      await refreshProgress();
    }
  }, [engine, refreshProgress]);

  const claimReward = useCallback(async (achievementId: string): Promise<number> => {
    const coins = await engine.claimReward(achievementId);
    if (coins > 0) {
      await refreshProgress();
    }
    return coins;
  }, [engine, refreshProgress]);

  const dismissToast = useCallback(() => {
    setPendingToasts(prev => prev.slice(1));
  }, []);

  const completedCount = progress.filter(p => p.completed).length;
  const unclaimedCount = progress.filter(p => p.completed && !p.claimed).length;

  return (
    <AchievementContext.Provider
      value={{
        progress,
        isLoaded,
        pendingToasts,
        checkAfterGame,
        checkAfterDaily,
        checkAfterPurchase,
        checkAfterAction,
        claimReward,
        dismissToast,
        refreshProgress,
        completedCount,
        unclaimedCount,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) throw new Error('useAchievementContext must be used within AchievementProvider');
  return context;
}
