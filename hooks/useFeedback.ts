// Combined feedback system for BlitzTap
// Unifies sound and haptics for cleaner integration

import { useCallback } from 'react';
import { useSound } from './useSound';
import { useHaptics } from './useHaptics';

interface FeedbackManager {
  onCorrectTap: () => void;
  onWrongTap: () => void;
  onTimeout: () => void;
  onCountdownTick: () => void;
  onCountdownGo: () => void;
  onLevelUp: () => void;
  onStreakMilestone: () => void;
  onNewHighScore: () => void;
  onGameOver: () => void;
  onButtonPress: () => void;
  onScoreCountTick: () => void;
  stopAllSounds: () => void;
}

export function useFeedback(): FeedbackManager {
  const sound = useSound();
  const haptics = useHaptics();

  const onCorrectTap = useCallback(() => {
    sound.playCorrectTap();
    haptics.correctTap();
  }, [sound, haptics]);

  const onWrongTap = useCallback(() => {
    sound.playWrongTap();
    haptics.wrongTap();
  }, [sound, haptics]);

  const onTimeout = useCallback(() => {
    sound.playTimeout();
    haptics.timeout();
  }, [sound, haptics]);

  const onCountdownTick = useCallback(() => {
    sound.playCountdownTick();
    haptics.countdownTick();
  }, [sound, haptics]);

  const onCountdownGo = useCallback(() => {
    sound.playCountdownGo();
    haptics.countdownGo();
  }, [sound, haptics]);

  const onLevelUp = useCallback(() => {
    sound.playLevelUp();
    haptics.levelUp();
  }, [sound, haptics]);

  const onStreakMilestone = useCallback(() => {
    sound.playStreakMilestone();
    haptics.streakMilestone();
  }, [sound, haptics]);

  const onNewHighScore = useCallback(() => {
    sound.playNewHighScore();
    haptics.newHighScore();
  }, [sound, haptics]);

  const onGameOver = useCallback(() => {
    sound.playGameOver();
    haptics.gameOver();
  }, [sound, haptics]);

  const onButtonPress = useCallback(() => {
    sound.playButtonPress();
    haptics.buttonPress();
  }, [sound, haptics]);

  // Score count only plays sound, no haptic (would be annoying)
  const onScoreCountTick = useCallback(() => {
    sound.playScoreCount();
  }, [sound]);

  const stopAllSounds = useCallback(() => {
    sound.stopAll();
  }, [sound]);

  return {
    onCorrectTap,
    onWrongTap,
    onTimeout,
    onCountdownTick,
    onCountdownGo,
    onLevelUp,
    onStreakMilestone,
    onNewHighScore,
    onGameOver,
    onButtonPress,
    onScoreCountTick,
    stopAllSounds,
  };
}
