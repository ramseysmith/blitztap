// Core game engine hook for BlitzTap

import { useCallback, useRef, useEffect } from 'react';
import { useSharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useGame } from '../contexts/GameContext';
import { generateRound } from '../utils/levelGenerator';
import { calculateMultiplier, calculateRoundCoins } from '../utils/scoring';
import { setHighScore, addCoins } from '../utils/storage';

export function useGameEngine() {
  const { state, dispatch } = useGame();

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const timeProgress = useSharedValue(1);

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
    if (state.status !== 'playing') return;

    const isNewHighScore = state.score > state.highScore;
    const roundCoins = calculateRoundCoins(state.score, state.maxStreak, isNewHighScore);

    if (isNewHighScore) {
      await setHighScore(state.score);
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
  }, [state.status, state.score, state.highScore, state.maxStreak, dispatch]);

  // Timer loop using requestAnimationFrame for precision
  const updateTimer = useCallback(() => {
    if (state.status !== 'playing') return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = state.timePerTap - elapsed;

    if (remaining <= 0) {
      timeProgress.value = 0;
      handleTimeout();
      return;
    }

    timeProgress.value = remaining / state.timePerTap;
    dispatch({ type: 'UPDATE_TIME', payload: { timeRemaining: remaining } });
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [state.status, state.timePerTap, handleTimeout, dispatch, timeProgress]);

  // Start the timer when game starts playing
  useEffect(() => {
    if (state.status === 'playing') {
      startTimeRef.current = Date.now();
      timeProgress.value = 1;
      timerRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state.status, state.target, updateTimer, timeProgress]);

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
    if (state.status !== 'playing') return;

    const tappedOption = state.options.find(opt => opt.id === optionId);
    if (!tappedOption) return;

    // Cancel current timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    if (tappedOption.isCorrect) {
      // Correct tap!
      const newScore = state.score + 1;
      const newStreak = state.streak + 1;
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

      // Reset timer for new round
      startTimeRef.current = Date.now();
      timeProgress.value = 1;
    } else {
      // Wrong tap - game over
      const isNewHighScore = state.score > state.highScore;
      const roundCoins = calculateRoundCoins(state.score, state.maxStreak, isNewHighScore);

      if (isNewHighScore) {
        await setHighScore(state.score);
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
  }, [state, dispatch, timeProgress]);

  // Reset game
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, [dispatch]);

  // Play again (reset and start countdown)
  const playAgain = useCallback(() => {
    resetGame();
    // Small delay to ensure state is reset before starting countdown
    setTimeout(() => {
      startCountdown();
    }, 50);
  }, [resetGame, startCountdown]);

  return {
    startGame,
    startCountdown,
    handleTap,
    resetGame,
    playAgain,
    timeProgress,
  };
}
