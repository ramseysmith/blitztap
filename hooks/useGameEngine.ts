// Core game engine hook for BlitzTap

import { useCallback, useRef, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useGame } from '../contexts/GameContext';
import { generateRound } from '../utils/levelGenerator';
import { calculateMultiplier, calculateRoundCoins } from '../utils/scoring';
import { setHighScore, addCoins } from '../utils/storage';

interface UseGameEngineOptions {
  onTimeout?: () => void;
}

export function useGameEngine(options?: UseGameEngineOptions) {
  const { state, dispatch } = useGame();

  // Use refs for values needed in the timer loop to avoid recreating callbacks
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const timePerTapRef = useRef(state.timePerTap);
  const statusRef = useRef(state.status);
  const stateRef = useRef(state);
  const onTimeoutRef = useRef(options?.onTimeout);

  const timeProgress = useSharedValue(1);

  // Keep onTimeout ref in sync
  useEffect(() => {
    onTimeoutRef.current = options?.onTimeout;
  }, [options?.onTimeout]);

  // Keep refs in sync with state
  useEffect(() => {
    timePerTapRef.current = state.timePerTap;
    statusRef.current = state.status;
    stateRef.current = state;
  }, [state]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, []);

  // Handle game over (timeout)
  const handleTimeout = useCallback(async () => {
    if (statusRef.current !== 'playing' || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;

    // Cancel timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    // Notify caller about timeout (for animations)
    onTimeoutRef.current?.();

    // Delay the actual game over to allow for correct reveal animation
    await new Promise(resolve => setTimeout(resolve, 1100));

    const currentState = stateRef.current;
    const isNewHighScore = currentState.score > currentState.highScore;
    const roundCoins = calculateRoundCoins(currentState.score, currentState.maxStreak, isNewHighScore);

    if (isNewHighScore) {
      await setHighScore(currentState.score);
    }

    const newTotalCoins = await addCoins(roundCoins);

    dispatch({
      type: 'TIMEOUT',
      payload: { roundCoins, isNewHighScore },
    });
    dispatch({
      type: 'UPDATE_COINS',
      payload: { totalCoins: newTotalCoins },
    });
  }, [dispatch]);

  // Store handleTimeout in a ref to avoid recreating updateTimer
  const handleTimeoutRef = useRef(handleTimeout);
  useEffect(() => {
    handleTimeoutRef.current = handleTimeout;
  }, [handleTimeout]);

  // Timer loop using requestAnimationFrame for precision
  const updateTimer = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    const elapsed = Date.now() - startTimeRef.current;
    const timePerTap = timePerTapRef.current;
    const remaining = timePerTap - elapsed;

    if (remaining <= 0) {
      timeProgress.value = 0;
      handleTimeoutRef.current();
      return;
    }

    timeProgress.value = remaining / timePerTap;
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [timeProgress]);

  // Start the timer
  const startTimer = useCallback(() => {
    // Cancel any existing timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    startTimeRef.current = Date.now();
    timeProgress.value = 1;
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [updateTimer, timeProgress]);

  // Store startTimer in a ref to avoid effect re-running
  const startTimerRef = useRef(startTimer);
  useEffect(() => {
    startTimerRef.current = startTimer;
  }, [startTimer]);

  // Start/stop timer based on game status
  useEffect(() => {
    if (state.status === 'playing' && state.target) {
      // Don't restart timer if we're handling a timeout (waiting for game over)
      if (!timeoutHandledRef.current) {
        startTimerRef.current();
      }
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      // Reset the timeout flag when not playing (for next game)
      timeoutHandledRef.current = false;
    }
  }, [state.status, state.target?.color, state.target?.shape]);

  // Start game (called after countdown)
  const startGame = useCallback(() => {
    const round = generateRound(0);
    dispatch({
      type: 'START_GAME',
      payload: {
        target: round.target,
        options: round.options,
        gridColumns: round.gridColumns,
        timePerTap: round.timePerTap,
        tier: round.tier,
      },
    });
  }, [dispatch]);

  // Start countdown
  const startCountdown = useCallback(() => {
    dispatch({ type: 'START_COUNTDOWN' });
  }, [dispatch]);

  // Handle tap on an option
  const handleTap = useCallback(async (optionId: string) => {
    const currentState = stateRef.current;
    if (currentState.status !== 'playing') return;

    const tappedOption = currentState.options.find(opt => opt.id === optionId);
    if (!tappedOption) return;

    // Cancel current timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    if (tappedOption.isCorrect) {
      // Correct tap!
      const newScore = currentState.score + 1;
      const newStreak = currentState.streak + 1;
      const newMultiplier = calculateMultiplier(newStreak);
      const round = generateRound(newScore);

      dispatch({
        type: 'CORRECT_TAP',
        payload: {
          target: round.target,
          options: round.options,
          gridColumns: round.gridColumns,
          timePerTap: round.timePerTap,
          tier: round.tier,
          multiplier: newMultiplier,
        },
      });

      // Timer will restart via useEffect when target changes
    } else {
      // Wrong tap - game over
      const isNewHighScore = currentState.score > currentState.highScore;
      const roundCoins = calculateRoundCoins(currentState.score, currentState.maxStreak, isNewHighScore);

      if (isNewHighScore) {
        await setHighScore(currentState.score);
      }

      const newTotalCoins = await addCoins(roundCoins);

      dispatch({
        type: 'WRONG_TAP',
        payload: { roundCoins, isNewHighScore },
      });
      dispatch({
        type: 'UPDATE_COINS',
        payload: { totalCoins: newTotalCoins },
      });
    }
  }, [dispatch]);

  // Reset game
  const resetGame = useCallback(() => {
    timeoutHandledRef.current = false;
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    // Reset timer progress to full so it doesn't flicker when game restarts
    timeProgress.value = 1;
    dispatch({ type: 'RESET_GAME' });
  }, [dispatch, timeProgress]);

  // Play again (reset and start countdown)
  const playAgain = useCallback(() => {
    resetGame();
    setTimeout(() => {
      startCountdown();
    }, 50);
  }, [resetGame, startCountdown]);

  // Continue game after watching rewarded ad (keeps score and streak)
  const continueGame = useCallback(() => {
    timeoutHandledRef.current = false;
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    // Generate new round at current tier (based on current score)
    const currentState = stateRef.current;
    const round = generateRound(currentState.score);
    timeProgress.value = 1;

    dispatch({
      type: 'CONTINUE_GAME',
      payload: {
        target: round.target,
        options: round.options,
        gridColumns: round.gridColumns,
        timePerTap: round.timePerTap,
        tier: round.tier,
      },
    });
  }, [dispatch, timeProgress]);

  return {
    startGame,
    startCountdown,
    handleTap,
    resetGame,
    playAgain,
    continueGame,
    timeProgress,
  };
}
