/**
 * useReviewPrompt
 *
 * Manages in-app review prompts for BlitzTap, firing only at the highest-intent
 * moment: when the player sets a new personal best.
 *
 * Trigger conditions (ALL must be true):
 *  1. At least 8 total games completed across all sessions
 *  2. Current game resulted in a strictly new personal best (isNewPersonalBest === true)
 *  3. At least 30 days have passed since the last prompt (or never prompted)
 *  4. Fewer than 3 prompts have been shown in the last 365 days (Apple policy)
 *  5. StoreReview.isAvailableAsync() returns true
 *  6. StoreReview.hasAction() returns true
 *
 * Timing: the actual requestReview() call is delayed by ~1.5 s so the "NEW HIGH SCORE"
 * celebration animation fully lands before the system dialog appears.
 *
 * Storage key: `blitztap.reviewPrompt.v1`
 */

import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

// ─── Constants ────────────────────────────────────────────────────────────────

const REVIEW_KEY = 'blitztap.reviewPrompt.v1';
const MIN_GAMES_BEFORE_PROMPT = 8;
const MIN_DAYS_BETWEEN_PROMPTS = 30;
const MAX_PROMPTS_PER_YEAR = 3;
/** Delay before showing the dialog so the high-score celebration lands first. */
const PROMPT_DELAY_MS = 1500;

// ─── Storage helpers ──────────────────────────────────────────────────────────

interface ReviewPromptState {
  /** Cumulative count of completed games across all sessions. */
  totalGamesCompleted: number;
  /** Unix timestamps (ms) of every prompt that was actually shown. */
  promptHistory: number[];
}

async function loadState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(REVIEW_KEY);
    if (raw) return JSON.parse(raw) as ReviewPromptState;
  } catch {
    // Treat read errors as fresh state
  }
  return { totalGamesCompleted: 0, promptHistory: [] };
}

async function saveState(state: ReviewPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
  } catch {
    // Silent — a failed write is not worth surfacing to the player
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReviewPrompt() {
  /**
   * Call after every game ends. Increments the total-games counter, then
   * checks all gating conditions and — if they all pass — fires the OS review
   * dialog after a short delay.
   *
   * @param isNewPersonalBest - Pass `true` only when the player has beaten
   *   their previous best score (strictly greater, not tied).
   */
  const maybeRequestReview = useCallback(
    async ({ isNewPersonalBest }: { isNewPersonalBest: boolean }) => {
      // Always increment the completed-games counter, regardless of outcome
      const state = await loadState();
      state.totalGamesCompleted += 1;
      await saveState(state);

      // Gate 1: only fire on a strictly new personal best
      if (!isNewPersonalBest) return;

      // Gate 2: player must have enough experience with the app
      if (state.totalGamesCompleted < MIN_GAMES_BEFORE_PROMPT) return;

      // Gate 3 & 4: platform availability checks
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;

      const hasAction = await StoreReview.hasAction();
      if (!hasAction) return;

      const now = Date.now();
      const MS_PER_DAY = 24 * 60 * 60 * 1000;

      // Only look at prompts within the last 365 days
      const recentPrompts = state.promptHistory.filter(
        (t) => t > now - 365 * MS_PER_DAY,
      );

      // Gate 5: Apple policy — max 3 prompts per 365 days
      if (recentPrompts.length >= MAX_PROMPTS_PER_YEAR) return;

      // Gate 6: must wait at least 30 days since the last prompt
      const lastPromptAt =
        recentPrompts.length > 0 ? Math.max(...recentPrompts) : 0;
      if (lastPromptAt > now - MIN_DAYS_BETWEEN_PROMPTS * MS_PER_DAY) return;

      // All gates passed — let the celebration animation finish first
      await new Promise<void>((resolve) => setTimeout(resolve, PROMPT_DELAY_MS));

      try {
        await StoreReview.requestReview();
        // Record this prompt so we respect the frequency limits next time
        state.promptHistory = [...recentPrompts, now];
        await saveState(state);
      } catch (e) {
        if (__DEV__) {
          console.log('[useReviewPrompt] requestReview failed silently:', e);
        }
      }
    },
    [],
  );

  /**
   * Resets the AsyncStorage key so you can re-trigger the prompt during
   * development. Only available when `__DEV__` is true.
   */
  const resetForDevTesting = __DEV__
    ? async (): Promise<void> => {
        await AsyncStorage.removeItem(REVIEW_KEY);
        if (__DEV__) console.log('[useReviewPrompt] State reset for dev testing.');
      }
    : undefined;

  return { maybeRequestReview, resetForDevTesting };
}
