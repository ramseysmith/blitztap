// AsyncStorage helpers for BlitzTap

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HIGH_SCORE: 'blitztap_high_score',
  TOTAL_COINS: 'blitztap_total_coins',
  SETTINGS: 'blitztap_settings',
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
