import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { usePurchase } from '../contexts/PurchaseContext';
import { useGameEngine } from '../hooks/useGameEngine';
import { useFeedback } from '../hooks/useFeedback';
import { useGameAnimations } from '../hooks/useGameAnimations';
import { useAds } from '../hooks/useAds';
import { useAppState } from '../hooks/useAppState';
import { TimerBar } from '../components/game/TimerBar';
import { TargetDisplay } from '../components/game/TargetDisplay';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { GameBoard } from '../components/game/GameBoard';
import { CountdownReady } from '../components/game/CountdownReady';
import { GameOverOverlay } from '../components/game/GameOverOverlay';
import { PauseOverlay } from '../components/game/PauseOverlay';
import { ScreenGlow, ScreenShakeContainer } from '../components/game/ScreenEffects';
import { TierTransition } from '../components/game/TierTransition';
import { StreakMilestone } from '../components/game/StreakMilestone';
import { Colors, PieceColor } from '../utils/colors';
import { calculateMultiplier, calculateTier } from '../utils/scoring';
import { getLastReviewGame, setLastReviewGame } from '../utils/storage';
import { recordGameResult } from '../utils/stats';

// Dev-only FPS counter
let FpsCounter: React.ComponentType | null = null;
if (__DEV__) {
  FpsCounter = require('../components/game/FpsCounter').FpsCounter;
}

// Optional expo-store-review (installed separately)
let StoreReview: { isAvailableAsync: () => Promise<boolean>; requestReview: () => Promise<void> } | null = null;
try {
  StoreReview = require('expo-store-review');
} catch {
  // Not installed yet
}

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const { isProUser, removeAdsPrice, purchaseRemoveAds } = usePurchase();
  const feedback = useFeedback();
  const animations = useGameAnimations();
  const { showInterstitial, showRewarded, shouldShowInterstitial, isRewardedReady } = useAds();

  // Track tapped options for animations
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [wrongOptionId, setWrongOptionId] = useState<string | null>(null);
  const [showCorrectReveal, setShowCorrectReveal] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Pause state (app backgrounded during play)
  const [isPaused, setIsPaused] = useState(false);
  const [pendingResume, setPendingResume] = useState(false); // show countdown after resume tap

  // Session tracking for stats
  const gameStartTimeRef = useRef<number>(0);
  const sessionShapeTapsRef = useRef<Record<string, number>>({});

  // Track previous values for detecting changes
  const prevTierRef = useRef<1 | 2 | 3 | 4>(1);
  const prevStreakRef = useRef(0);
  const prevMultiplierRef = useRef(1);

  // Handle timeout with animation and feedback
  const onTimeout = useCallback(() => {
    setIsTimedOut(true);
    setShowCorrectReveal(true);
    animations.animateTimeout();
    feedback.onTimeout();
  }, [animations, feedback]);

  const { startGame, startCountdown, handleTap, playAgain, continueGame, pauseTimer, resumeTimer, timeProgress } =
    useGameEngine({ onTimeout });

  // ─── App state (pause/resume) ───
  const handleAppStateChange = useCallback((nextState: AppStateStatus) => {
    if (nextState === 'background' || nextState === 'inactive') {
      // Pause game timer if actively playing
      if (state.status === 'playing' && !isPaused) {
        pauseTimer();
        setIsPaused(true);
      }
      // Cancel countdown if backgrounded during countdown
      if (state.status === 'countdown') {
        // We'll restart countdown when they come back
        setPendingResume(true);
      }
      // Stop sounds
      feedback.stopAllSounds();
    }
  }, [state.status, isPaused, pauseTimer, feedback]);

  useAppState(handleAppStateChange);

  // ─── Start countdown when screen mounts ───
  useEffect(() => {
    startCountdown();
    return () => {
      animations.resetAnimations();
      feedback.stopAllSounds();
    };
  }, [startCountdown]);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      animations.resetAnimations();
      feedback.stopAllSounds();
    };
  }, []);

  // ─── Detect tier changes ───
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

  // ─── Detect streak milestones ───
  useEffect(() => {
    if (state.status === 'playing') {
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
  }, [state.streak, state.status, animations, feedback]);

  // ─── Detect multiplier changes ───
  useEffect(() => {
    if (state.status === 'playing') {
      const multiplier = calculateMultiplier(state.streak);
      if (multiplier !== prevMultiplierRef.current) {
        animations.animateMultiplierChange();
      }
      prevMultiplierRef.current = multiplier;
    }
  }, [state.streak, state.status, animations]);

  // ─── Reset animation state on countdown ───
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

  // ─── Record stats + review prompt on game over ───
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
      });

      // Review prompt (after meaningful engagement)
      maybeRequestReview(state.score, state.roundsPlayedThisSession);
    }
  }, [state.status]);

  // ─── Handle tap with feedback and animations ───
  const onTap = useCallback(
    async (optionId: string) => {
      if (isTimedOut || isPaused) return;

      const tappedOption = state.options.find((opt) => opt.id === optionId);
      if (!tappedOption) return;

      if (tappedOption.isCorrect) {
        // Track for stats
        if (state.target) {
          const key = `${state.target.color}_${state.target.shape ?? 'circle'}`;
          sessionShapeTapsRef.current[key] = (sessionShapeTapsRef.current[key] ?? 0) + 1;
        }

        setCorrectOptionId(optionId);
        feedback.onCorrectTap();
        animations.animateCorrectTap();

          setTimeout(() => setCorrectOptionId(null), 200);
        handleTap(optionId);
      } else {
        setWrongOptionId(optionId);
        feedback.onWrongTap();
        animations.animateWrongTap();

        setTimeout(() => setShowCorrectReveal(true), 300);

        // Delay game over to show correct answer
        setTimeout(() => {
          handleTap(optionId);
        }, 1100);
      }
    },
    [state.options, state.target, feedback, animations, handleTap, isTimedOut, isPaused]
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
    if (rewarded) {
      continueGame();
    }
  }, [showRewarded, continueGame]);

  // ─── Remove ads purchase ───
  const onRemoveAds = useCallback(async () => {
    setIsPurchasing(true);
    const result = await purchaseRemoveAds();
    setIsPurchasing(false);
    if (result.message) {
      Alert.alert(result.success ? 'Success' : 'Purchase', result.message);
    }
  }, [purchaseRemoveAds]);

  // ─── Home ───
  const onHome = useCallback(() => {
    router.back();
  }, [router]);

  // ─── Pause overlay resume ───
  const onResume = useCallback(() => {
    setIsPaused(false);
    setPendingResume(true); // trigger countdown before resuming timer
  }, []);

  const onResumeCountdownComplete = useCallback(() => {
    setPendingResume(false);
    resumeTimer();
  }, [resumeTimer]);

  const renderContent = () => {
    // Show resume countdown after player taps resume
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
              <TimerBar timeProgress={timeProgress} />

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
              />

              {/* Overlay effects */}
              <TierTransition
                scale={animations.tierTextScale}
                opacity={animations.tierTextOpacity}
                text={animations.currentTierText.current}
                color={animations.currentTierColor.current}
              />

              <StreakMilestone
                scale={animations.streakTextScale}
                opacity={animations.streakTextOpacity}
                text={animations.currentStreakText.current}
                showParticles={animations.showParticles}
              />

              <ScreenGlow
                opacity={animations.screenGlowOpacity}
                colorValue={animations.screenGlowColor}
              />

              {/* Pause overlay */}
              {isPaused && <PauseOverlay score={state.score} onResume={onResume} />}
            </View>
          </ScreenShakeContainer>
        );

      case 'gameover': {
        const tier = calculateTier(state.score);
        return (
          <View style={styles.gameContainer}>
            <TimerBar timeProgress={timeProgress} />

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
              showCorrectReveal={true}
              disabled={true}
            />

            <GameOverOverlay
              score={Math.max(0, state.score)}
              isNewHighScore={state.isNewHighScore}
              roundCoins={Math.max(0, state.roundCoins)}
              onPlayAgain={onPlayAgain}
              onHome={onHome}
              rewardedReady={isRewardedReady}
              hasUsedContinue={state.hasUsedContinue}
              onContinue={onContinue}
              onRemoveAds={onRemoveAds}
              isProUser={isProUser}
              removeAdsPrice={removeAdsPrice}
              isPurchasing={isPurchasing}
              tier={tier}
            />
          </View>
        );
      }

      default:
        return <CountdownReady onComplete={startGame} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {renderContent()}

      {/* Dev FPS counter */}
      {__DEV__ && FpsCounter && <FpsCounter />}
    </View>
  );
}

// ─── Review prompt helper ───
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
    // Review request failed silently
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
});
