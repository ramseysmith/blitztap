// Level/XP context for BlitzTap - Update 2

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  PlayerLevel,
  LevelReward,
  AddXPResult,
  XP_CONFIG,
  getPlayerLevel,
  addXP as addXPUtil,
  claimLevelReward,
  xpForLevel,
} from '../utils/xp';
import { addCoins } from '../utils/storage';

interface LevelContextType {
  playerLevel: PlayerLevel;
  isLoaded: boolean;
  xpNeeded: number;
  addXP: (amount: number) => Promise<AddXPResult>;
  claimReward: (level: number) => Promise<number>;
  pendingLevelUps: LevelReward[];
  clearPendingLevelUp: () => void;
}

const LevelContext = createContext<LevelContextType | undefined>(undefined);

export function LevelProvider({ children }: { children: ReactNode }) {
  const [playerLevel, setPlayerLevel] = useState<PlayerLevel>({
    level: 1,
    currentXP: 0,
    totalXP: 0,
    unclaimedRewards: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingLevelUps, setPendingLevelUps] = useState<LevelReward[]>([]);

  useEffect(() => {
    async function load() {
      const level = await getPlayerLevel();
      setPlayerLevel(level);
      setIsLoaded(true);
    }
    load();
  }, []);

  const addXP = useCallback(async (amount: number): Promise<AddXPResult> => {
    const result = await addXPUtil(amount);
    setPlayerLevel(result.newLevel);
    if (result.levelUps.length > 0) {
      setPendingLevelUps(prev => [...prev, ...result.levelUps]);
    }
    return result;
  }, []);

  const claimReward = useCallback(async (level: number): Promise<number> => {
    const { coins, playerLevel: updated } = await claimLevelReward(level);
    if (coins > 0) {
      await addCoins(coins);
    }
    setPlayerLevel(updated);
    return coins;
  }, []);

  const clearPendingLevelUp = useCallback(() => {
    setPendingLevelUps(prev => prev.slice(1));
  }, []);

  const xpNeeded = xpForLevel(playerLevel.level);

  return (
    <LevelContext.Provider
      value={{
        playerLevel,
        isLoaded,
        xpNeeded,
        addXP,
        claimReward,
        pendingLevelUps,
        clearPendingLevelUp,
      }}
    >
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  const context = useContext(LevelContext);
  if (!context) throw new Error('useLevel must be used within a LevelProvider');
  return context;
}

export { XP_CONFIG };
