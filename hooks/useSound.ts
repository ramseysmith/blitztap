// Sound effects hook for BlitzTap
// Placeholder for Phase 3 - sounds not implemented yet

import { useCallback } from 'react';

export function useSound() {
  // Placeholder implementations - will be filled in Phase 3
  const playCorrect = useCallback(async () => {
    // TODO: Implement sound playback
  }, []);

  const playWrong = useCallback(async () => {
    // TODO: Implement sound playback
  }, []);

  const playLevelUp = useCallback(async () => {
    // TODO: Implement sound playback
  }, []);

  const playCountdown = useCallback(async () => {
    // TODO: Implement sound playback
  }, []);

  const playHighScore = useCallback(async () => {
    // TODO: Implement sound playback
  }, []);

  return {
    playCorrect,
    playWrong,
    playLevelUp,
    playCountdown,
    playHighScore,
  };
}
