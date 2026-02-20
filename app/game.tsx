import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { usePurchase } from '../contexts/PurchaseContext';
import { useGameEngine } from '../hooks/useGameEngine';
import { useFeedback } from '../hooks/useFeedback';
import { useGameAnimations } from '../hooks/useGameAnimations';
import { useAds } from '../hooks/useAds';
import { TimerBar } from '../components/game/TimerBar';
import { TargetDisplay } from '../components/game/TargetDisplay';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { GameBoard } from '../components/game/GameBoard';
import { CountdownReady } from '../components/game/CountdownReady';
import { GameOverOverlay } from '../components/game/GameOverOverlay';
import { ScreenGlow, ScreenShakeContainer } from '../components/game/ScreenEffects';
import { TierTransition } from '../components/game/TierTransition';
import { StreakMilestone } from '../components/game/StreakMilestone';
import { Colors, PieceColor } from '../utils/colors';
import { calculateMultiplier, calculateTier } from '../utils/scoring';

export default function GameScreen() {
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

  const { startGame, startCountdown, handleTap, playAgain, continueGame, timeProgress } =
    useGameEngine({
      onTimeout,
    });

  // Start countdown when screen mounts
  useEffect(() => {
    startCountdown();
    return () => {
      animations.resetAnimations();
      feedback.stopAllSounds();
    };
  }, [startCountdown]);

  // Detect tier changes
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

  // Detect streak milestones
  useEffect(() => {
    if (state.status === 'playing') {
      const streak = state.streak;
      const prevStreak = prevStreakRef.current;

      // Check if we just crossed a milestone
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

  // Detect multiplier changes
  useEffect(() => {
    if (state.status === 'playing') {
      const multiplier = calculateMultiplier(state.streak);
      if (multiplier !== prevMultiplierRef.current) {
        animations.animateMultiplierChange();
      }
      prevMultiplierRef.current = multiplier;
    }
  }, [state.streak, state.status, animations]);

  // Reset animation state when game resets
  useEffect(() => {
    if (state.status === 'countdown') {
      setCorrectOptionId(null);
      setWrongOptionId(null);
      setShowCorrectReveal(false);
      setIsTimedOut(false);
      prevTierRef.current = 1;
      prevStreakRef.current = 0;
      prevMultiplierRef.current = 1;
    }
  }, [state.status]);

  // Handle tap with feedback and animations
  const onTap = useCallback(
    async (optionId: string) => {
      if (isTimedOut) return;

      const tappedOption = state.options.find((opt) => opt.id === optionId);
      if (!tappedOption) return;

      if (tappedOption.isCorrect) {
        // Correct tap
        setCorrectOptionId(optionId);
        feedback.onCorrectTap();
        animations.animateCorrectTap();

        // Clear after animation
        setTimeout(() => {
          setCorrectOptionId(null);
        }, 200);

        handleTap(optionId);
      } else {
        // Wrong tap
        setWrongOptionId(optionId);
        feedback.onWrongTap();
        animations.animateWrongTap();

        // Show correct answer after shake
        setTimeout(() => {
          setShowCorrectReveal(true);
        }, 300);

        // Delay game over to show correct answer
        setTimeout(() => {
          handleTap(optionId);
        }, 1100); // 300ms shake + 800ms reveal
      }
    },
    [state.options, feedback, animations, handleTap, isTimedOut]
  );

  // Handle play again with interstitial ad
  const onPlayAgain = useCallback(async () => {
    // Check if we should show an interstitial
    if (shouldShowInterstitial(state.roundsPlayedThisSession)) {
      await showInterstitial();
    }
    playAgain();
  }, [playAgain, shouldShowInterstitial, showInterstitial, state.roundsPlayedThisSession]);

  // Handle continue (watch rewarded ad to keep playing)
  const onContinue = useCallback(async () => {
    const rewarded = await showRewarded();
    if (rewarded) {
      // User watched the ad - continue game
      continueGame();
    }
    // If not rewarded (user dismissed), stay on game over screen
  }, [showRewarded, continueGame]);

  // Handle remove ads purchase
  const onRemoveAds = useCallback(async () => {
    setIsPurchasing(true);
    const result = await purchaseRemoveAds();
    setIsPurchasing(false);

    if (result.message) {
      Alert.alert(result.success ? 'Success' : 'Purchase', result.message);
    }
  }, [purchaseRemoveAds]);

  const renderContent = () => {
    switch (state.status) {
      case 'countdown':
        return <CountdownReady onComplete={startGame} />;

      case 'playing':
        return (
          <ScreenShakeContainer shakeX={animations.screenShakeX}>
            <View style={styles.gameContainer}>
              <TimerBar timeProgress={timeProgress} />

              <ScoreDisplay
                score={state.score}
                streak={state.streak}
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
                disabled={wrongOptionId !== null || isTimedOut}
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
            </View>
          </ScreenShakeContainer>
        );

      case 'gameover':
        return (
          <View style={styles.gameContainer}>
            <TimerBar timeProgress={timeProgress} />

            <ScoreDisplay score={state.score} streak={state.streak} multiplier={state.multiplier} />

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
              score={state.score}
              isNewHighScore={state.isNewHighScore}
              roundCoins={state.roundCoins}
              onPlayAgain={onPlayAgain}
              rewardedReady={isRewardedReady}
              hasUsedContinue={state.hasUsedContinue}
              onContinue={onContinue}
              onRemoveAds={onRemoveAds}
              isProUser={isProUser}
              removeAdsPrice={removeAdsPrice}
              isPurchasing={isPurchasing}
            />
          </View>
        );

      default:
        return <CountdownReady onComplete={startGame} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {renderContent()}
    </View>
  );
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
