// Haptic feedback system for BlitzTap

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../contexts/SettingsContext';

interface HapticManager {
  correctTap: () => void;
  wrongTap: () => void;
  timeout: () => void;
  countdownTick: () => void;
  countdownGo: () => void;
  levelUp: () => void;
  streakMilestone: () => void;
  newHighScore: () => void;
  gameOver: () => void;
  buttonPress: () => void;
}

export function useHaptics(): HapticManager {
  const { settings } = useSettings();

  const triggerHaptic = useCallback(
    async (callback: () => Promise<void>) => {
      if (!settings.hapticsEnabled) return;

      try {
        await callback();
      } catch (error) {
        // Haptics not available on this device (e.g., simulator)
      }
    },
    [settings.hapticsEnabled]
  );

  const correctTap = useCallback(() => {
    triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, [triggerHaptic]);

  const wrongTap = useCallback(() => {
    triggerHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }, [triggerHaptic]);

  const timeout = useCallback(() => {
    triggerHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  }, [triggerHaptic]);

  const countdownTick = useCallback(() => {
    triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }, [triggerHaptic]);

  const countdownGo = useCallback(() => {
    triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  }, [triggerHaptic]);

  const levelUp = useCallback(() => {
    triggerHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }, [triggerHaptic]);

  // Double tap pattern for streak milestones
  const streakMilestone = useCallback(() => {
    if (!settings.hapticsEnabled) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 100);
    } catch (error) {
      // Haptics not available
    }
  }, [settings.hapticsEnabled]);

  // Triple pattern for new high score
  const newHighScore = useCallback(() => {
    if (!settings.hapticsEnabled) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 120);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 240);
    } catch (error) {
      // Haptics not available
    }
  }, [settings.hapticsEnabled]);

  const gameOver = useCallback(() => {
    triggerHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }, [triggerHaptic]);

  const buttonPress = useCallback(() => {
    triggerHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, [triggerHaptic]);

  return {
    correctTap,
    wrongTap,
    timeout,
    countdownTick,
    countdownGo,
    levelUp,
    streakMilestone,
    newHighScore,
    gameOver,
    buttonPress,
  };
}
