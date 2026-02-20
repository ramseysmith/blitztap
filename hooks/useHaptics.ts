// Haptic feedback hook for BlitzTap

import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export function useHaptics() {
  const correctTap = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const wrongTap = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const newHighScore = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  const countdown = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available on this device
    }
  }, []);

  return {
    correctTap,
    wrongTap,
    newHighScore,
    countdown,
  };
}
