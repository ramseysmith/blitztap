// Daily challenge logic for BlitzTap
// Uses a seeded PRNG (mulberry32) to generate identical rounds for all players on the same day

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShapeType, Option, Target } from './levelGenerator';
import { PieceColor, TIER_3_COLORS } from './colors';

export interface DailyChallengeResult {
  date: string;      // YYYY-MM-DD
  score: number;
  completed: boolean;
  correctTaps: number;
  timeBonus: number;
}

const DAILY_HISTORY_KEY = 'blitztap_daily_history';
const DAILY_TARGET_COUNT = 30;
const DAILY_TIME_PER_TAP_S = 1.8; // Tier 3 difficulty
const DAILY_GRID_COLUMNS = 3;
const DAILY_GRID_SIZE = 9;

// ─── Date helpers ──────────────────────────────────────────────────────────────

export function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return h;
}

export function createSeededRng(seed: string): () => number {
  let h = hashSeed(seed);
  return function () {
    h |= 0;
    h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Seeded round generation ────────────────────────────────────────────────────

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'diamond'];
let seededIdCounter = 0;

function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function seededRandomItem<T>(array: readonly T[], rng: () => number): T {
  return array[Math.floor(rng() * array.length)];
}

function generateSeededRound(
  rng: () => number,
): { target: Target; options: Option[]; gridColumns: number; timePerTap: number } {
  const availableColors = TIER_3_COLORS;
  const targetColor = seededRandomItem(availableColors, rng) as PieceColor;
  const targetShape = seededRandomItem(SHAPES, rng) as ShapeType;
  const target: Target = { color: targetColor, shape: targetShape };

  const options: Option[] = [];

  options.push({
    id: `daily_${++seededIdCounter}`,
    color: targetColor,
    shape: targetShape,
    isCorrect: true,
  });

  const otherColors = availableColors.filter(c => c !== targetColor) as PieceColor[];
  const otherShapes = SHAPES.filter(s => s !== targetShape);

  // 4 near-misses (Tier 3 style)
  const sameColorCount = 2;
  for (let i = 0; i < sameColorCount; i++) {
    options.push({
      id: `daily_${++seededIdCounter}`,
      color: targetColor,
      shape: otherShapes[i % otherShapes.length],
      isCorrect: false,
    });
  }
  const sameShapeCount = 2;
  for (let i = 0; i < sameShapeCount; i++) {
    options.push({
      id: `daily_${++seededIdCounter}`,
      color: otherColors[i % otherColors.length],
      shape: targetShape,
      isCorrect: false,
    });
  }

  // Remaining fillers
  const fillerCount = DAILY_GRID_SIZE - 1 - 4;
  for (let i = 0; i < fillerCount; i++) {
    options.push({
      id: `daily_${++seededIdCounter}`,
      color: otherColors[i % otherColors.length],
      shape: otherShapes[i % otherShapes.length],
      isCorrect: false,
    });
  }

  return {
    target,
    options: seededShuffle(options, rng),
    gridColumns: DAILY_GRID_COLUMNS,
    timePerTap: DAILY_TIME_PER_TAP_S,
  };
}

// ─── Pre-generate all 30 rounds for today ─────────────────────────────────────

export interface DailyRound {
  target: Target;
  options: Option[];
  gridColumns: number;
  timePerTap: number;
}

export function generateDailyRounds(dateString?: string): DailyRound[] {
  const seed = dateString ?? getTodayDateString();
  const rng = createSeededRng(seed);
  const rounds: DailyRound[] = [];
  for (let i = 0; i < DAILY_TARGET_COUNT; i++) {
    rounds.push(generateSeededRound(rng));
  }
  return rounds;
}

export const DAILY_TARGET_COUNT_EXPORT = DAILY_TARGET_COUNT;

// ─── Daily challenge coin calculation ─────────────────────────────────────────

export function calculateDailyChallengeCoins(
  correctTaps: number,
  completed: boolean,
): number {
  let coins = 25; // base
  coins += correctTaps * 2; // 2 per correct tap
  if (completed) coins += 100; // completion bonus
  return coins;
}

export function calculateTimeBonus(
  correctTaps: number,
  totalTimeTakenMs: number,
): number {
  // Bonus points for speed on completed challenge
  if (correctTaps < DAILY_TARGET_COUNT) return 0;
  const secondsTaken = totalTimeTakenMs / 1000;
  const maxPossibleTime = DAILY_TARGET_COUNT * DAILY_TIME_PER_TAP_S;
  const timeBonus = Math.max(0, Math.floor((maxPossibleTime - secondsTaken) * 2));
  return timeBonus;
}

// ─── Persistence ───────────────────────────────────────────────────────────────

export async function getDailyChallengeHistory(): Promise<DailyChallengeResult[]> {
  try {
    const data = await AsyncStorage.getItem(DAILY_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getTodayResult(): Promise<DailyChallengeResult | null> {
  const history = await getDailyChallengeHistory();
  const today = getTodayDateString();
  return history.find(r => r.date === today) ?? null;
}

export async function saveDailyChallengeResult(
  result: DailyChallengeResult,
): Promise<void> {
  try {
    const history = await getDailyChallengeHistory();
    const existing = history.findIndex(r => r.date === result.date);
    if (existing >= 0) {
      history[existing] = result;
    } else {
      history.unshift(result);
    }
    // Keep only last 30 days
    const trimmed = history.slice(0, 30);
    await AsyncStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving daily challenge result:', error);
  }
}
