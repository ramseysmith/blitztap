// AsyncStorage helpers for BlitzTap

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HIGH_SCORE: 'blitztap_high_score',
  TOTAL_COINS: 'blitztap_total_coins',
  SETTINGS: 'blitztap_settings',
  ONBOARDING_COMPLETE: 'blitztap_onboarding_complete',
  HAS_PLAYED_BEFORE: 'blitztap_has_played_before',
  LAST_REVIEW_GAME: 'blitztap_last_review_game',
  MODE_HIGH_SCORES: 'blitztap_mode_high_scores',
} as const;

export interface Settings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
};

// High Score
export async function getHighScore(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(KEYS.HIGH_SCORE);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Error reading high score:', error);
    return 0;
  }
}

export async function setHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HIGH_SCORE, score.toString());
  } catch (error) {
    console.error('Error saving high score:', error);
  }
}

// Coins
export async function getTotalCoins(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(KEYS.TOTAL_COINS);
    return value ? parseInt(value, 10) : 0;
  } catch (error) {
    console.error('Error reading total coins:', error);
    return 0;
  }
}

export async function addCoins(amount: number): Promise<number> {
  try {
    const current = await getTotalCoins();
    const newTotal = current + amount;
    await AsyncStorage.setItem(KEYS.TOTAL_COINS, newTotal.toString());
    return newTotal;
  } catch (error) {
    console.error('Error adding coins:', error);
    return 0;
  }
}

// Settings
export async function getSettings(): Promise<Settings> {
  try {
    const value = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (value) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error updating settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Onboarding
export async function getOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (error) {
    console.error('Error saving onboarding state:', error);
  }
}

// Has Played Before (first-time tutorial flag)
export async function getHasPlayedBefore(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEYS.HAS_PLAYED_BEFORE);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setHasPlayedBefore(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.HAS_PLAYED_BEFORE, 'true');
  } catch (error) {
    console.error('Error saving hasPlayedBefore:', error);
  }
}

// Review prompt tracking
export async function getLastReviewGame(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(KEYS.LAST_REVIEW_GAME);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setLastReviewGame(gamesPlayed: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_REVIEW_GAME, gamesPlayed.toString());
  } catch (error) {
    console.error('Error saving lastReviewGame:', error);
  }
}

// Spend coins (for shop purchases)
export async function spendCoins(amount: number): Promise<number> {
  try {
    const current = await getTotalCoins();
    const newTotal = Math.max(0, current - amount);
    await AsyncStorage.setItem(KEYS.TOTAL_COINS, newTotal.toString());
    return newTotal;
  } catch (error) {
    console.error('Error spending coins:', error);
    return 0;
  }
}

// Per-mode high scores
type GameMode = 'classic' | 'timeAttack' | 'zen';

interface ModeHighScores {
  classic: number;
  timeAttack: number;
  zen: number;
}

export async function getModeHighScores(): Promise<ModeHighScores> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MODE_HIGH_SCORES);
    // Migrate: if classic is 0 but legacy high score exists, use that
    const base: ModeHighScores = { classic: 0, timeAttack: 0, zen: 0 };
    if (data) {
      return { ...base, ...JSON.parse(data) };
    }
    // First time: seed classic high score from legacy key
    const legacy = await getHighScore();
    const migrated = { ...base, classic: legacy };
    await AsyncStorage.setItem(KEYS.MODE_HIGH_SCORES, JSON.stringify(migrated));
    return migrated;
  } catch {
    return { classic: 0, timeAttack: 0, zen: 0 };
  }
}

export async function getModeHighScore(mode: GameMode): Promise<number> {
  const scores = await getModeHighScores();
  return scores[mode];
}

export async function setModeHighScore(mode: GameMode, score: number): Promise<void> {
  try {
    const scores = await getModeHighScores();
    if (score > scores[mode]) {
      scores[mode] = score;
      await AsyncStorage.setItem(KEYS.MODE_HIGH_SCORES, JSON.stringify(scores));
      // Keep legacy HIGH_SCORE in sync for classic
      if (mode === 'classic') {
        await setHighScore(score);
      }
    }
  } catch (error) {
    console.error('Error saving mode high score:', error);
  }
}
