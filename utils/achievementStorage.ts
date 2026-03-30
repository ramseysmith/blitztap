// Achievement persistence for BlitzTap - Update 2

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementProgress, ACHIEVEMENTS } from './achievements';

const ACHIEVEMENT_KEY = 'blitztap_achievements';
const ACTION_COUNTS_KEY = 'blitztap_action_counts';
const MODES_TODAY_KEY = 'blitztap_modes_today';

// ─── Achievement Progress ────────────────────────────────────────────────────

export async function getAllProgress(): Promise<AchievementProgress[]> {
  try {
    const data = await AsyncStorage.getItem(ACHIEVEMENT_KEY);
    if (!data) return initializeProgress();
    const parsed: AchievementProgress[] = JSON.parse(data);
    // Ensure all achievements have entries (handles new achievements added in updates)
    const existingIds = new Set(parsed.map(p => p.achievementId));
    for (const a of ACHIEVEMENTS) {
      if (!existingIds.has(a.id)) {
        parsed.push({ achievementId: a.id, currentValue: 0, completed: false, claimed: false });
      }
    }
    return parsed;
  } catch {
    return initializeProgress();
  }
}

function initializeProgress(): AchievementProgress[] {
  return ACHIEVEMENTS.map(a => ({
    achievementId: a.id,
    currentValue: 0,
    completed: false,
    claimed: false,
  }));
}

export async function saveAllProgress(progress: AchievementProgress[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving achievement progress:', error);
  }
}

export async function getProgress(achievementId: string): Promise<AchievementProgress> {
  const all = await getAllProgress();
  return all.find(p => p.achievementId === achievementId) ?? {
    achievementId,
    currentValue: 0,
    completed: false,
    claimed: false,
  };
}

export async function updateProgress(
  achievementId: string,
  update: Partial<AchievementProgress>,
): Promise<AchievementProgress[]> {
  const all = await getAllProgress();
  const idx = all.findIndex(p => p.achievementId === achievementId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...update };
  }
  await saveAllProgress(all);
  return all;
}

export async function markCompleted(achievementId: string): Promise<AchievementProgress[]> {
  return updateProgress(achievementId, {
    completed: true,
    completedAt: new Date().toISOString(),
  });
}

export async function markClaimed(achievementId: string): Promise<AchievementProgress[]> {
  return updateProgress(achievementId, { claimed: true });
}

// ─── Action Counts (for specific_action achievements) ────────────────────────

export async function getActionCounts(): Promise<Record<string, number>> {
  try {
    const data = await AsyncStorage.getItem(ACTION_COUNTS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function incrementActionCount(actionId: string): Promise<number> {
  const counts = await getActionCounts();
  counts[actionId] = (counts[actionId] ?? 0) + 1;
  await AsyncStorage.setItem(ACTION_COUNTS_KEY, JSON.stringify(counts));
  return counts[actionId];
}

export async function getActionCount(actionId: string): Promise<number> {
  const counts = await getActionCounts();
  return counts[actionId] ?? 0;
}

// ─── Modes played today tracking (for "Well Rounded" achievement) ────────────

export async function getModesPlayedToday(): Promise<{ date: string; modes: string[] }> {
  try {
    const data = await AsyncStorage.getItem(MODES_TODAY_KEY);
    if (!data) return { date: getTodayStr(), modes: [] };
    const parsed = JSON.parse(data);
    if (parsed.date !== getTodayStr()) return { date: getTodayStr(), modes: [] };
    return parsed;
  } catch {
    return { date: getTodayStr(), modes: [] };
  }
}

export async function recordModePlayedToday(mode: string): Promise<string[]> {
  const current = await getModesPlayedToday();
  if (current.date !== getTodayStr()) {
    current.date = getTodayStr();
    current.modes = [];
  }
  if (!current.modes.includes(mode)) {
    current.modes.push(mode);
  }
  await AsyncStorage.setItem(MODES_TODAY_KEY, JSON.stringify(current));
  return current.modes;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Daily challenge streak calculation ──────────────────────────────────────

export async function getDailyChallengeStreak(): Promise<number> {
  try {
    const { getDailyChallengeHistory } = await import('./dailyChallenge');
    const history = await getDailyChallengeHistory();
    if (history.length === 0) return 0;

    // Sort by date descending
    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;

      if (sorted[i].date === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}
