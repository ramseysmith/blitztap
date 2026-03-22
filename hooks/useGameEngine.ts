// Core game engine hook for BlitzTap - Update 1 (multi-mode)

import { useCallback, useRef, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useGame, GameMode } from '../contexts/GameContext';
import { generateRound } from '../utils/levelGenerator';
import { calculateMultiplier, calculateRoundCoins } from '../utils/scoring';
import { setHighScore, addCoins, setModeHighScore } from '../utils/storage';

// Grace period before timeout fires (ms) — accounts for animation frame delays
const TIMEOUT_GRACE_MS = 50;
const MASTER_TIMER_DURATION_MS = 60000;
const WRONG_TAP_PENALTY_MS = 2000;

interface ModeConfig {
  mode: GameMode;
  hasPerTapTimer: boolean;
  hasMasterTimer: boolean;
  wrongTapEndsGame: boolean;
  coinMultiplier: number;
}

const MODE_CONFIGS: Record<GameMode, ModeConfig> = {
  classic: {
    mode: 'classic',
    hasPerTapTimer: true,
    hasMasterTimer: false,
    wrongTapEndsGame: true,
    coinMultiplier: 1.0,
  },
  timeAttack: {
    mode: 'timeAttack',
    hasPerTapTimer: true,
    hasMasterTimer: true,
    wrongTapEndsGame: false,
    coinMultiplier: 1.0,
  },
  zen: {
    mode: 'zen',
    hasPerTapTimer: false,
    hasMasterTimer: false,
    wrongTapEndsGame: false,
    coinMultiplier: 0.5,
  },
};

interface UseGameEngineOptions {
  onTimeout?: () => void;
  onTimeoutContinue?: () => void; // Time Attack: per-tap timeout just refreshes
  mode?: GameMode;
}

export function useGameEngine(options?: UseGameEngineOptions) {
  const { state, dispatch } = useGame();
  const mode: GameMode = options?.mode ?? state.mode ?? 'classic';
  const modeConfig = MODE_CONFIGS[mode];

  // Use refs for values needed in the timer loop to avoid recreating callbacks
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const timePerTapRef = useRef(state.timePerTap);
  const statusRef = useRef(state.status);
  const stateRef = useRef(state);
  const onTimeoutRef = useRef(options?.onTimeout);
  const onTimeoutContinueRef = useRef(options?.onTimeoutContinue);

  // Tap deduplication guard: ignore taps within 100ms of the last registered tap
  const lastTapTimeRef = useRef(0);

  // Pause support: remaining time when paused
  const pausedRemainingRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  // Master timer (Time Attack)
  const masterTimerRef = useRef<number | null>(null);
  const masterStartTimeRef = useRef<number>(0);
  const masterPausedRemainingRef = useRef<number | null>(null);
  const masterExpiredRef = useRef(false);

  const timeProgress = useSharedValue(1);
  const masterTimeProgress = useSharedValue(1); // 0-1 for the 60s countdown

  // Keep refs in sync
  useEffect(() => { onTimeoutRef.current = options?.onTimeout; }, [options?.onTimeout]);
  useEffect(() => { onTimeoutContinueRef.current = options?.onTimeoutContinue; }, [options?.onTimeoutContinue]);

  useEffect(() => {
    timePerTapRef.current = state.timePerTap;
    statusRef.current = state.status;
    stateRef.current = state;
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      if (masterTimerRef.current) cancelAnimationFrame(masterTimerRef.current);
    };
  }, []);

  // ─── Master timer (Time Attack) ────────────────────────────────────────────

  const handleMasterTimerExpired = useCallback(async () => {
    if (masterExpiredRef.current) return;
    masterExpiredRef.current = true;

    if (masterTimerRef.current) {
      cancelAnimationFrame(masterTimerRef.current);
      masterTimerRef.current = null;
    }
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    const currentState = stateRef.current;
    const isNewHighScore = currentState.score > currentState.highScore;
    const roundCoins = Math.round(
      calculateRoundCoins(currentState.score, currentState.maxStreak, isNewHighScore) *
        modeConfig.coinMultiplier,
    );

    if (isNewHighScore) await setHighScore(currentState.score);
    await setModeHighScore(mode, currentState.score);
    const newTotalCoins = await addCoins(roundCoins);

    dispatch({ type: 'MASTER_TIMER_EXPIRED', payload: { roundCoins, isNewHighScore } });
    dispatch({ type: 'UPDATE_COINS', payload: { totalCoins: newTotalCoins } });
  }, [dispatch, mode, modeConfig.coinMultiplier]);

  const masterTimerExpiredRef = useRef(handleMasterTimerExpired);
  useEffect(() => { masterTimerExpiredRef.current = handleMasterTimerExpired; }, [handleMasterTimerExpired]);

  const updateMasterTimer = useCallback(() => {
    if (statusRef.current !== 'playing' || isPausedRef.current || masterExpiredRef.current) return;

    const elapsed = Date.now() - masterStartTimeRef.current;
    const remaining = MASTER_TIMER_DURATION_MS - elapsed - (stateRef.current.masterTimePenalty ?? 0);

    if (remaining <= 0) {
      masterTimeProgress.value = 0;
      dispatch({ type: 'UPDATE_MASTER_TIMER', payload: { masterTimeRemaining: 0 } });
      masterTimerExpiredRef.current();
      return;
    }

    masterTimeProgress.value = Math.max(0, remaining / MASTER_TIMER_DURATION_MS);
    dispatch({ type: 'UPDATE_MASTER_TIMER', payload: { masterTimeRemaining: remaining } });
    masterTimerRef.current = requestAnimationFrame(updateMasterTimer);
  }, [dispatch, masterTimeProgress]);

  const startMasterTimer = useCallback(() => {
    if (masterTimerRef.current) cancelAnimationFrame(masterTimerRef.current);
    masterExpiredRef.current = false;
    masterStartTimeRef.current = Date.now();
    masterTimeProgress.value = 1;
    masterTimerRef.current = requestAnimationFrame(updateMasterTimer);
  }, [updateMasterTimer, masterTimeProgress]);

  // ─── Per-tap timeout handler ───────────────────────────────────────────────

  const handleTimeoutContinue = useCallback(() => {
    // Time Attack: timeout just refreshes to next round (no game over, no penalty)
    if (statusRef.current !== 'playing' || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    onTimeoutContinueRef.current?.();

    // Generate a new round and continue
    const currentState = stateRef.current;
    const round = generateRound(currentState.score);

    // Small delay for animation to show correct answer briefly
    setTimeout(() => {
      dispatch({
        type: 'TIMEOUT_CONTINUE',
        payload: {
          target: round.target,
          options: round.options,
          gridColumns: round.gridColumns,
          timePerTap: round.timePerTap,
          tier: round.tier,
        },
      });
      timeoutHandledRef.current = false;
    }, 600);
  }, [dispatch]);

  const handleTimeoutContinueRef = useRef(handleTimeoutContinue);
  useEffect(() => { handleTimeoutContinueRef.current = handleTimeoutContinue; }, [handleTimeoutContinue]);

  const handleTimeout = useCallback(async () => {
    if (statusRef.current !== 'playing' || timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    onTimeoutRef.current?.();

    await new Promise(resolve => setTimeout(resolve, 1100));

    const currentState = stateRef.current;
    const isNewHighScore = currentState.score > currentState.highScore;
    const roundCoins = Math.round(
      calculateRoundCoins(currentState.score, currentState.maxStreak, isNewHighScore) *
        modeConfig.coinMultiplier,
    );

    if (isNewHighScore) await setHighScore(currentState.score);
    await setModeHighScore(mode, currentState.score);
    const newTotalCoins = await addCoins(roundCoins);

    dispatch({ type: 'TIMEOUT', payload: { roundCoins, isNewHighScore } });
    dispatch({ type: 'UPDATE_COINS', payload: { totalCoins: newTotalCoins } });
  }, [dispatch, mode, modeConfig.coinMultiplier]);

  const handleTimeoutRef = useRef(handleTimeout);
  useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);

  // ─── Per-tap timer loop ────────────────────────────────────────────────────

  const updateTimer = useCallback(() => {
    if (statusRef.current !== 'playing' || isPausedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const timePerTap = timePerTapRef.current;
    const remaining = timePerTap - elapsed;

    if (remaining <= -TIMEOUT_GRACE_MS) {
      timeProgress.value = 0;
      if (modeConfig.mode === 'timeAttack') {
        handleTimeoutContinueRef.current();
      } else {
        handleTimeoutRef.current();
      }
      return;
    }

    timeProgress.value = Math.max(0, remaining / timePerTap);
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [timeProgress, modeConfig.mode]);

  const startTimer = useCallback(() => {
    if (!modeConfig.hasPerTapTimer) return;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    startTimeRef.current = Date.now();
    timeProgress.value = 1;
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [updateTimer, timeProgress, modeConfig.hasPerTapTimer]);

  const startTimerRef = useRef(startTimer);
  useEffect(() => { startTimerRef.current = startTimer; }, [startTimer]);

  // Start/stop per-tap timer based on game status
  useEffect(() => {
    if (state.status === 'playing' && state.target) {
      if (!timeoutHandledRef.current && modeConfig.hasPerTapTimer) {
        startTimerRef.current();
      }
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      timeoutHandledRef.current = false;
    }
  }, [state.status, state.target, modeConfig.hasPerTapTimer]);

  // Start master timer when game starts (Time Attack)
  useEffect(() => {
    if (modeConfig.hasMasterTimer && state.status === 'playing' && state.target) {
      if (!masterExpiredRef.current && masterTimerRef.current === null) {
        startMasterTimer();
      }
    }
    if (state.status !== 'playing') {
      if (masterTimerRef.current) {
        cancelAnimationFrame(masterTimerRef.current);
        masterTimerRef.current = null;
      }
      masterExpiredRef.current = false;
    }
  }, [state.status, modeConfig.hasMasterTimer, startMasterTimer]);

  // ─── Pause support ─────────────────────────────────────────────────────────

  const pauseTimer = useCallback(() => {
    if (statusRef.current !== 'playing' || isPausedRef.current) return;
    isPausedRef.current = true;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    const elapsed = Date.now() - startTimeRef.current;
    pausedRemainingRef.current = Math.max(0, timePerTapRef.current - elapsed);

    // Pause master timer too
    if (modeConfig.hasMasterTimer && masterTimerRef.current) {
      cancelAnimationFrame(masterTimerRef.current);
      masterTimerRef.current = null;
      const masterElapsed = Date.now() - masterStartTimeRef.current;
      masterPausedRemainingRef.current = Math.max(0, MASTER_TIMER_DURATION_MS - masterElapsed);
    }
  }, [modeConfig.hasMasterTimer]);

  const resumeTimer = useCallback(() => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;

    if (modeConfig.hasPerTapTimer) {
      const remaining = pausedRemainingRef.current ?? timePerTapRef.current;
      startTimeRef.current = Date.now() - (timePerTapRef.current - remaining);
      pausedRemainingRef.current = null;
      timerRef.current = requestAnimationFrame(updateTimer);
    }

    // Resume master timer
    if (modeConfig.hasMasterTimer && masterPausedRemainingRef.current !== null) {
      const remaining = masterPausedRemainingRef.current;
      masterStartTimeRef.current = Date.now() - (MASTER_TIMER_DURATION_MS - remaining);
      masterPausedRemainingRef.current = null;
      masterTimerRef.current = requestAnimationFrame(updateMasterTimer);
    }
  }, [updateTimer, updateMasterTimer, modeConfig]);

  // ─── Game actions ──────────────────────────────────────────────────────────

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

  const startCountdown = useCallback(() => {
    dispatch({ type: 'START_COUNTDOWN' });
  }, [dispatch]);

  const handleTap = useCallback(async (optionId: string) => {
    const currentState = stateRef.current;
    if (currentState.status !== 'playing') return;

    const now = Date.now();
    if (now - lastTapTimeRef.current < 100) return;
    lastTapTimeRef.current = now;

    const tappedOption = currentState.options.find(opt => opt.id === optionId);
    if (!tappedOption) return;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    if (tappedOption.isCorrect) {
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
    } else {
      // Wrong tap behavior depends on mode
      if (modeConfig.wrongTapEndsGame) {
        // Classic: game over
        const isNewHighScore = currentState.score > currentState.highScore;
        const roundCoins = Math.round(
          calculateRoundCoins(currentState.score, currentState.maxStreak, isNewHighScore) *
            modeConfig.coinMultiplier,
        );

        if (isNewHighScore) await setHighScore(currentState.score);
        await setModeHighScore(mode, currentState.score);
        const newTotalCoins = await addCoins(roundCoins);

        dispatch({ type: 'WRONG_TAP', payload: { roundCoins, isNewHighScore } });
        dispatch({ type: 'UPDATE_COINS', payload: { totalCoins: newTotalCoins } });
      } else {
        // Time Attack / Zen: continue with penalty
        const round = generateRound(currentState.score);

        let newMasterTimeRemaining = currentState.masterTimeRemaining;
        let newMasterTimePenalty = currentState.masterTimePenalty ?? 0;

        if (modeConfig.hasMasterTimer) {
          // Deduct 2 seconds from master timer
          newMasterTimePenalty += WRONG_TAP_PENALTY_MS;
          newMasterTimeRemaining = Math.max(0, currentState.masterTimeRemaining - WRONG_TAP_PENALTY_MS);
        }

        dispatch({
          type: 'WRONG_TAP_CONTINUE',
          payload: {
            target: round.target,
            options: round.options,
            gridColumns: round.gridColumns,
            timePerTap: round.timePerTap,
            tier: round.tier,
            masterTimeRemaining: newMasterTimeRemaining,
            masterTimePenalty: newMasterTimePenalty,
          },
        });

        // Check if master timer expired after penalty
        if (modeConfig.hasMasterTimer && newMasterTimeRemaining <= 0) {
          handleMasterTimerExpired();
        }
      }
    }
  }, [dispatch, mode, modeConfig, handleMasterTimerExpired]);

  const resetGame = useCallback(() => {
    timeoutHandledRef.current = false;
    isPausedRef.current = false;
    pausedRemainingRef.current = null;
    lastTapTimeRef.current = 0;
    masterExpiredRef.current = false;
    masterPausedRemainingRef.current = null;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    if (masterTimerRef.current) {
      cancelAnimationFrame(masterTimerRef.current);
      masterTimerRef.current = null;
    }

    timeProgress.value = 1;
    masterTimeProgress.value = 1;
    dispatch({ type: 'RESET_GAME' });
  }, [dispatch, timeProgress, masterTimeProgress]);

  const playAgain = useCallback(() => {
    resetGame();
    setTimeout(() => { startCountdown(); }, 50);
  }, [resetGame, startCountdown]);

  const continueGame = useCallback(() => {
    timeoutHandledRef.current = false;
    isPausedRef.current = false;
    pausedRemainingRef.current = null;
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
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

  const zenQuit = useCallback(async () => {
    const currentState = stateRef.current;
    const roundCoins = Math.round(
      calculateRoundCoins(currentState.score, currentState.maxStreak, false) *
        modeConfig.coinMultiplier,
    );
    await setModeHighScore('zen', currentState.score);
    const newTotalCoins = await addCoins(roundCoins);
    dispatch({ type: 'ZEN_QUIT', payload: { roundCoins } });
    dispatch({ type: 'UPDATE_COINS', payload: { totalCoins: newTotalCoins } });
  }, [dispatch, modeConfig.coinMultiplier]);

  return {
    startGame,
    startCountdown,
    handleTap,
    resetGame,
    playAgain,
    continueGame,
    zenQuit,
    pauseTimer,
    resumeTimer,
    timeProgress,
    masterTimeProgress,
    modeConfig,
  };
}
