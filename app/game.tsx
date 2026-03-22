import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, AppStateStatus, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame, GameMode } from '../contexts/GameContext';
import { useShop } from '../contexts/ShopContext';
import { usePurchase } from '../contexts/PurchaseContext';
import { useGameEngine } from '../hooks/useGameEngine';
import { useFeedback } from '../hooks/useFeedback';
import { useGameAnimations } from '../hooks/useGameAnimations';
import { useAds } from '../hooks/useAds';
import { useAppState } from '../hooks/useAppState';
import { TimerBar } from '../components/game/TimerBar';
import { MasterTimerBar } from '../components/game/MasterTimerBar';
import { TargetDisplay } from '../components/game/TargetDisplay';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { GameBoard } from '../components/game/GameBoard';
import { CountdownReady } from '../components/game/CountdownReady';
import { GameOverOverlay } from '../components/game/GameOverOverlay';
import { PauseOverlay } from '../components/game/PauseOverlay';
import { ScreenGlow, ScreenShakeContainer } from '../components/game/ScreenEffects';
import { TierTransition } from '../components/game/TierTransition';
import { StreakMilestone } from '../components/game/StreakMilestone';
import { GameBackground } from '../components/backgrounds/GameBackground';
import { TapEffectRenderer, TapEvent } from '../components/effects/TapEffectRenderer';
import { Colors, PieceColor } from '../utils/colors';
import { calculateMultiplier, calculateTier } from '../utils/scoring';
import { getLastReviewGame, setLastReviewGame } from '../utils/storage';
import { recordGameResult } from '../utils/stats';

// Dev-only FPS counter
let FpsCounter: React.ComponentType | null = null;
if (__DEV__) {
  FpsCounter = require('../components/game/FpsCounter').FpsCounter;
}

// Optional expo-store-review
let StoreReview: { isAvailableAsync: () => Promise<boolean>; requestReview: () => Promise<void> } | null = null;
try {
  StoreReview = require('expo-store-review');
} catch {
  // Not installed yet
}

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'CLASSIC',
  timeAttack: 'TIME ATTACK',
  zen: 'ZEN',
};

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: GameMode = (['classic', 'timeAttack', 'zen'].includes(params.mode ?? '')
    ? (params.mode as GameMode)
    : 'classic');

  const insets = useSafeAreaInsets();
  const { state, dispatch } = useGame();
  const { inventory } = useShop();
  const { isProUser, removeAdsPrice, purchaseRemoveAds } = usePurchase();
  const feedback = useFeedback();
  const animations = useGameAnimations();
  const { showInterstitial, showRewarded, shouldShowInterstitial, isRewardedReady } = useAds();

  // Set mode in context when screen mounts
  useEffect(() => {
    dispatch({ type: 'SET_MODE', payload: { mode } });
  }, [mode]);

  // Track tapped options for animations
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [wrongOptionId, setWrongOptionId] = useState<string | null>(null);
  const [showCorrectReveal, setShowCorrectReveal] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tapEvent, setTapEvent] = useState<TapEvent | null>(null);
  const tapEventIdRef = useRef(0);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [pendingResume, setPendingResume] = useState(false);

  // Session tracking
  const gameStartTimeRef = useRef<number>(0);
  const sessionShapeTapsRef = useRef<Record<string, number>>({});

  // Track previous values
  const prevTierRef = useRef<1 | 2 | 3 | 4>(1);
  const prevStreakRef = useRef(0);
  const prevMultiplierRef = useRef(1);

  // Handle per-tap timeout (classic: game over)
  const onTimeout = useCallback(() => {
    setIsTimedOut(true);
    setShowCorrectReveal(true);
    animations.animateTimeout();
    feedback.onTimeout();
  }, [animations, feedback]);

  // Handle Time Attack per-tap timeout (just refreshes round)
  const onTimeoutContinue = useCallback(() => {
    setIsTimedOut(true);
    setShowCorrectReveal(true);
    animations.animateTimeout();
    feedback.onTimeout();
    setTimeout(() => {
      setIsTimedOut(false);
      setShowCorrectReveal(false);
      setCorrectOptionId(null);
      setWrongOptionId(null);
    }, 650);
  }, [animations, feedback]);

  const { startGame, startCountdown, handleTap, playAgain, continueGame, zenQuit, pauseTimer, resumeTimer, timeProgress, masterTimeProgress, modeConfig } =
    useGameEngine({ onTimeout, onTimeoutContinue, mode });

  // ─── App state (pause/resume) ───
  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    if (nextState === 'background' || nextState === 'inactive') {
      if (state.status === 'playing' && !isPaused) {
        pauseTimer();
        setIsPaused(true);
      }
      if (state.status === 'countdown') {
        setPendingResume(true);
      }
      feedback.stopAllSounds();
    }
  }, [state.status, isPaused, pauseTimer, feedback]);

  useAppState(handleAppStateChange);

  // ─── Start countdown on mount ───
  useEffect(() => {
    startCountdown();
    return () => {
      animations.resetAnimations();
      feedback.stopAllSounds();
    };
  }, [startCountdown]);

  useEffect(() => {
    return () => {
      animations.resetAnimations();
      feedback.stopAllSounds();
    };
  }, []);

  // ─── Tier changes ───
  useEffect(() => {
    if (state.status === 'playing') {
      const currentTier = calculateTier(state.score);
      if (currentTier !== prevTierRef.current && state.score > 0) {
        animations.animateTierTransition(currentTier);
        feedback.onLevelUp();
      }
      prevTierRef.current = currentTier;
    }
  }, [state.score, state.status, animations, feedback]);

  // ─── Streak milestones (only in modes that show callouts) ───
  useEffect(() => {
    if (state.status === 'playing' && modeConfig.mode !== 'zen') {
      const streak = state.streak;
      const prevStreak = prevStreakRef.current;
      if (
        (streak === 5 && prevStreak < 5) ||
        (streak === 10 && prevStreak < 10) ||
        (streak === 20 && prevStreak < 20)
      ) {
        animations.animateStreakMilestone(streak);
        feedback.onStreakMilestone();
      }
      prevStreakRef.current = streak;
    }
  }, [state.streak, state.status, animations, feedback, modeConfig.mode]);

  // ─── Multiplier changes ───
  useEffect(() => {
    if (state.status === 'playing') {
      const multiplier = calculateMultiplier(state.streak);
      if (multiplier !== prevMultiplierRef.current) {
        animations.animateMultiplierChange();
      }
      prevMultiplierRef.current = multiplier;
    }
  }, [state.streak, state.status, animations]);

  // ─── Reset on countdown ───
  useEffect(() => {
    if (state.status === 'countdown') {
      setCorrectOptionId(null);
      setWrongOptionId(null);
      setShowCorrectReveal(false);
      setIsTimedOut(false);
      prevTierRef.current = 1;
      prevStreakRef.current = 0;
      prevMultiplierRef.current = 1;
      sessionShapeTapsRef.current = {};
    }
  }, [state.status]);

  // ─── Track game start time ───
  useEffect(() => {
    if (state.status === 'playing' && gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
    }
    if (state.status === 'countdown') {
      gameStartTimeRef.current = 0;
    }
  }, [state.status]);

  // ─── Record stats on game over ───
  useEffect(() => {
    if (state.status === 'gameover') {
      const timePlayed = gameStartTimeRef.current > 0
        ? (Date.now() - gameStartTimeRef.current) / 1000
        : 0;
      gameStartTimeRef.current = 0;

      const tier = calculateTier(state.score);
      recordGameResult({
        score: Math.max(0, state.score),
        correctTaps: Math.max(0, state.score),
        maxStreak: Math.max(0, state.maxStreak),
        tier,
        coinsEarned: Math.max(0, state.roundCoins),
        timePlayed,
        shapeTaps: sessionShapeTapsRef.current,
        mode,
      });

      maybeRequestReview(state.score, state.roundsPlayedThisSession);
    }
  }, [state.status]);

  // ─── Handle tap ───
  const onTap = useCallback(
    async (optionId: string, tapX?: number, tapY?: number) => {
      if (isTimedOut || isPaused) return;

      const tappedOption = state.options.find((opt) => opt.id === optionId);
      if (!tappedOption) return;

      if (tappedOption.isCorrect) {
        if (state.target) {
          const key = `${state.target.color}_${state.target.shape ?? 'circle'}`;
          sessionShapeTapsRef.current[key] = (sessionShapeTapsRef.current[key] ?? 0) + 1;
        }

        setCorrectOptionId(optionId);
        feedback.onCorrectTap();
        animations.animateCorrectTap();

        // Fire tap effect
        if (tapX !== undefined && tapY !== undefined) {
          setTapEvent({ id: ++tapEventIdRef.current, x: tapX, y: tapY });
        }

        setTimeout(() => setCorrectOptionId(null), 200);
        handleTap(optionId);
      } else {
        setWrongOptionId(optionId);
        feedback.onWrongTap();
        animations.animateWrongTap();

        if (mode === 'classic') {
          setTimeout(() => setShowCorrectReveal(true), 300);
          setTimeout(() => { handleTap(optionId); }, 1100);
        } else {
          // Time Attack / Zen: flash and continue
          setTimeout(() => {
            setWrongOptionId(null);
          }, 500);
          handleTap(optionId);
        }
      }
    },
    [state.options, state.target, feedback, animations, handleTap, isTimedOut, isPaused, mode],
  );

  // ─── Play again ───
  const onPlayAgain = useCallback(async () => {
    if (shouldShowInterstitial(state.roundsPlayedThisSession)) {
      await showInterstitial();
    }
    playAgain();
    setIsPaused(false);
  }, [playAgain, shouldShowInterstitial, showInterstitial, state.roundsPlayedThisSession]);

  // ─── Continue (rewarded ad) ───
  const onContinue = useCallback(async () => {
    const rewarded = await showRewarded();
    if (rewarded) { continueGame(); }
  }, [showRewarded, continueGame]);

  // ─── Remove ads ───
  const onRemoveAds = useCallback(async () => {
    setIsPurchasing(true);
    const result = await purchaseRemoveAds();
    setIsPurchasing(false);
    if (result.message) {
      Alert.alert(result.success ? 'Success' : 'Purchase', result.message);
    }
  }, [purchaseRemoveAds]);

  const onHome = useCallback(() => { router.back(); }, [router]);

  // ─── Pause overlay ───
  const onResume = useCallback(() => {
    setIsPaused(false);
    setPendingResume(true);
  }, []);

  const onResumeCountdownComplete = useCallback(() => {
    setPendingResume(false);
    resumeTimer();
  }, [resumeTimer]);

  // ─── Zen quit ───
  const onZenQuit = useCallback(async () => {
    if (state.status === 'playing') {
      await zenQuit();
    } else {
      router.back();
    }
  }, [state.status, zenQuit, router]);

  const renderContent = () => {
    if (pendingResume) {
      return (
        <View style={styles.gameContainer}>
          <CountdownReady onComplete={onResumeCountdownComplete} />
        </View>
      );
    }

    switch (state.status) {
      case 'countdown':
        return <CountdownReady onComplete={startGame} />;

      case 'playing':
        return (
          <ScreenShakeContainer shakeX={animations.screenShakeX}>
            <View style={styles.gameContainer}>
              {/* Zen mode quit button */}
              {mode === 'zen' && (
                <Pressable
                  onPress={onZenQuit}
                  style={styles.zenQuitButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Quit Zen mode"
                >
                  <Text style={styles.zenQuitText}>✕ Quit</Text>
                </Pressable>
              )}

              {/* Timer: per-tap for Classic, master for Time Attack, hidden for Zen */}
              {mode === 'classic' && <TimerBar timeProgress={timeProgress} />}
              {mode === 'timeAttack' && (
                <MasterTimerBar
                  masterTimeProgress={masterTimeProgress}
                  timeRemainingMs={state.masterTimeRemaining}
                />
              )}

              <ScoreDisplay
                score={Math.max(0, state.score)}
                streak={Math.max(0, state.streak)}
                multiplier={state.multiplier}
                scoreScale={animations.scoreScale}
                scoreBump={animations.scoreBump}
                multiplierScale={animations.multiplierScale}
                multiplierGlow={animations.multiplierGlow}
              />

              {state.target && (
                <TargetDisplay color={state.target.color as PieceColor} shape={state.target.shape} />
              )}

              <GameBoard
                options={state.options}
                gridColumns={state.gridColumns}
                onTap={onTap}
                gridDimOpacity={animations.gridDimOpacity}
                correctOptionId={correctOptionId}
                wrongOptionId={wrongOptionId}
                showCorrectReveal={showCorrectReveal}
                disabled={wrongOptionId !== null || isTimedOut || isPaused}
                equippedSkinId={inventory.equippedShape}
              />

              <TierTransition
                scale={animations.tierTextScale}
                opacity={animations.tierTextOpacity}
                text={animations.currentTierText.current}
                color={animations.currentTierColor.current}
              />

              {mode !== 'zen' && (
                <StreakMilestone
                  scale={animations.streakTextScale}
                  opacity={animations.streakTextOpacity}
                  text={animations.currentStreakText.current}
                  showParticles={animations.showParticles}
                />
              )}

              <ScreenGlow
                opacity={animations.screenGlowOpacity}
                colorValue={animations.screenGlowColor}
              />

              {/* Tap effects layer */}
              <TapEffectRenderer effectId={inventory.equippedEffect} tapEvent={tapEvent} />

              {isPaused && <PauseOverlay score={state.score} onResume={onResume} />}
            </View>
          </ScreenShakeContainer>
        );

      case 'gameover': {
        const tier = calculateTier(state.score);
        return (
          <View style={styles.gameContainer}>
            {mode === 'classic' && <TimerBar timeProgress={timeProgress} />}
            {mode === 'timeAttack' && (
              <MasterTimerBar
                masterTimeProgress={masterTimeProgress}
                timeRemainingMs={state.masterTimeRemaining}
              />
            )}

            <ScoreDisplay
              score={Math.max(0, state.score)}
              streak={Math.max(0, state.streak)}
              multiplier={state.multiplier}
            />

            {state.target && (
              <TargetDisplay color={state.target.color as PieceColor} shape={state.target.shape} />
            )}

            <GameBoard
              options={state.options}
              gridColumns={state.gridColumns}
              onTap={() => {}}
              showCorrectReveal={mode === 'classic'}
              disabled={true}
              equippedSkinId={inventory.equippedShape}
            />

            <GameOverOverlay
              score={Math.max(0, state.score)}
              isNewHighScore={state.isNewHighScore}
              roundCoins={Math.max(0, state.roundCoins)}
              onPlayAgain={onPlayAgain}
              onHome={onHome}
              rewardedReady={isRewardedReady && mode === 'classic'}
              hasUsedContinue={state.hasUsedContinue}
              onContinue={onContinue}
              onRemoveAds={onRemoveAds}
              isProUser={isProUser}
              removeAdsPrice={removeAdsPrice}
              isPurchasing={isPurchasing}
              tier={tier}
              mode={mode}
            />
          </View>
        );
      }

      default:
        return <CountdownReady onComplete={startGame} />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background layer */}
      <GameBackground backgroundId={inventory.equippedBackground} />

      {/* Mode label */}
      {state.status === 'playing' && mode !== 'classic' && (
        <View style={styles.modeLabelContainer}>
          <Text style={styles.modeLabel}>{MODE_LABELS[mode]}</Text>
        </View>
      )}

      {renderContent()}

      {__DEV__ && FpsCounter && <FpsCounter />}
    </View>
  );
}

async function maybeRequestReview(score: number, gamesPlayed: number) {
  if (!StoreReview) return;
  if (gamesPlayed < 10) return;
  if (score < 20) return;

  try {
    const lastGame = await getLastReviewGame();
    if (gamesPlayed - lastGame < 30) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    await StoreReview.requestReview();
    await setLastReviewGame(gamesPlayed);
  } catch {
    // silent
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gameContainer: {
    flex: 1,
  },
  modeLabelContainer: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    zIndex: 10,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
    opacity: 0.6,
  },
  zenQuitButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 20,
    padding: 8,
  },
  zenQuitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
