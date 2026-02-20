// Sound system for BlitzTap
// Uses expo-av for audio playback with preloading and pooling

import { useEffect, useRef, useCallback, useState } from 'react';
import { Audio, AVPlaybackSource } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';

// Sound assets
const SOUND_FILES = {
  correct: require('../assets/sounds/correct.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  timeout: require('../assets/sounds/timeout.wav'),
  countdownTick: require('../assets/sounds/countdown_tick.wav'),
  countdownGo: require('../assets/sounds/countdown_go.wav'),
  levelUp: require('../assets/sounds/levelup.wav'),
  streak: require('../assets/sounds/streak.wav'),
  highScore: require('../assets/sounds/highscore.wav'),
  gameOver: require('../assets/sounds/gameover.wav'),
  button: require('../assets/sounds/button.wav'),
  scoreTick: require('../assets/sounds/score_tick.wav'),
};

// Pool size for high-frequency sounds
const CORRECT_POOL_SIZE = 4;

interface SoundManager {
  playCorrectTap: () => void;
  playWrongTap: () => void;
  playTimeout: () => void;
  playCountdownTick: () => void;
  playCountdownGo: () => void;
  playLevelUp: () => void;
  playStreakMilestone: () => void;
  playNewHighScore: () => void;
  playGameOver: () => void;
  playButtonPress: () => void;
  playScoreCount: () => void;
  stopAll: () => void;
  cleanup: () => void;
  isLoaded: boolean;
}

interface SoundPool {
  sounds: Audio.Sound[];
  currentIndex: number;
}

export function useSound(): SoundManager {
  const { settings } = useSettings();
  const [isLoaded, setIsLoaded] = useState(false);

  // Sound references
  const correctPoolRef = useRef<SoundPool>({ sounds: [], currentIndex: 0 });
  const wrongSoundRef = useRef<Audio.Sound | null>(null);
  const timeoutSoundRef = useRef<Audio.Sound | null>(null);
  const countdownTickSoundRef = useRef<Audio.Sound | null>(null);
  const countdownGoSoundRef = useRef<Audio.Sound | null>(null);
  const levelUpSoundRef = useRef<Audio.Sound | null>(null);
  const streakSoundRef = useRef<Audio.Sound | null>(null);
  const highScoreSoundRef = useRef<Audio.Sound | null>(null);
  const gameOverSoundRef = useRef<Audio.Sound | null>(null);
  const buttonSoundRef = useRef<Audio.Sound | null>(null);
  const scoreTickSoundRef = useRef<Audio.Sound | null>(null);

  const appStateRef = useRef<AppStateStatus>('active');

  // Configure audio mode
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: false, // Respect device silent switch
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          allowsRecordingIOS: false, // Allow mixing with other audio
        });
      } catch (error) {
        console.warn('Failed to configure audio mode:', error);
      }
    }
    setupAudio();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        // App going to background - stop all sounds
        stopAllSounds();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  // Preload all sounds on mount
  useEffect(() => {
    let isMounted = true;

    async function preloadSounds() {
      try {
        // Load correct tap sound pool (for rapid taps)
        const correctPool: Audio.Sound[] = [];
        for (let i = 0; i < CORRECT_POOL_SIZE; i++) {
          const { sound } = await Audio.Sound.createAsync(SOUND_FILES.correct);
          correctPool.push(sound);
        }
        if (isMounted) {
          correctPoolRef.current = { sounds: correctPool, currentIndex: 0 };
        }

        // Load single-instance sounds
        const [
          { sound: wrongSound },
          { sound: timeoutSound },
          { sound: countdownTickSound },
          { sound: countdownGoSound },
          { sound: levelUpSound },
          { sound: streakSound },
          { sound: highScoreSound },
          { sound: gameOverSound },
          { sound: buttonSound },
          { sound: scoreTickSound },
        ] = await Promise.all([
          Audio.Sound.createAsync(SOUND_FILES.wrong),
          Audio.Sound.createAsync(SOUND_FILES.timeout),
          Audio.Sound.createAsync(SOUND_FILES.countdownTick),
          Audio.Sound.createAsync(SOUND_FILES.countdownGo),
          Audio.Sound.createAsync(SOUND_FILES.levelUp),
          Audio.Sound.createAsync(SOUND_FILES.streak),
          Audio.Sound.createAsync(SOUND_FILES.highScore),
          Audio.Sound.createAsync(SOUND_FILES.gameOver),
          Audio.Sound.createAsync(SOUND_FILES.button),
          Audio.Sound.createAsync(SOUND_FILES.scoreTick),
        ]);

        if (isMounted) {
          wrongSoundRef.current = wrongSound;
          timeoutSoundRef.current = timeoutSound;
          countdownTickSoundRef.current = countdownTickSound;
          countdownGoSoundRef.current = countdownGoSound;
          levelUpSoundRef.current = levelUpSound;
          streakSoundRef.current = streakSound;
          highScoreSoundRef.current = highScoreSound;
          gameOverSoundRef.current = gameOverSound;
          buttonSoundRef.current = buttonSound;
          scoreTickSoundRef.current = scoreTickSound;
          setIsLoaded(true);
        }
      } catch (error) {
        console.warn('Failed to preload sounds:', error);
        if (isMounted) {
          setIsLoaded(true); // Still mark as loaded to not block gameplay
        }
      }
    }

    preloadSounds();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  // Stop all currently playing sounds
  const stopAllSounds = useCallback(() => {
    try {
      correctPoolRef.current.sounds.forEach((sound) => {
        sound.stopAsync().catch(() => {});
      });
      wrongSoundRef.current?.stopAsync().catch(() => {});
      timeoutSoundRef.current?.stopAsync().catch(() => {});
      countdownTickSoundRef.current?.stopAsync().catch(() => {});
      countdownGoSoundRef.current?.stopAsync().catch(() => {});
      levelUpSoundRef.current?.stopAsync().catch(() => {});
      streakSoundRef.current?.stopAsync().catch(() => {});
      highScoreSoundRef.current?.stopAsync().catch(() => {});
      gameOverSoundRef.current?.stopAsync().catch(() => {});
      buttonSoundRef.current?.stopAsync().catch(() => {});
      scoreTickSoundRef.current?.stopAsync().catch(() => {});
    } catch (error) {
      // Ignore errors during cleanup
    }
  }, []);

  // Cleanup all sounds
  const cleanup = useCallback(() => {
    try {
      correctPoolRef.current.sounds.forEach((sound) => {
        sound.unloadAsync().catch(() => {});
      });
      wrongSoundRef.current?.unloadAsync().catch(() => {});
      timeoutSoundRef.current?.unloadAsync().catch(() => {});
      countdownTickSoundRef.current?.unloadAsync().catch(() => {});
      countdownGoSoundRef.current?.unloadAsync().catch(() => {});
      levelUpSoundRef.current?.unloadAsync().catch(() => {});
      streakSoundRef.current?.unloadAsync().catch(() => {});
      highScoreSoundRef.current?.unloadAsync().catch(() => {});
      gameOverSoundRef.current?.unloadAsync().catch(() => {});
      buttonSoundRef.current?.unloadAsync().catch(() => {});
      scoreTickSoundRef.current?.unloadAsync().catch(() => {});
    } catch (error) {
      // Ignore errors during cleanup
    }
  }, []);

  // Play a single sound (fire and forget)
  const playSound = useCallback((soundRef: React.RefObject<Audio.Sound | null>) => {
    if (!settings.soundEnabled) return;
    if (appStateRef.current !== 'active') return;
    if (!soundRef.current) return;

    soundRef.current.replayAsync().catch(() => {
      // Ignore playback errors
    });
  }, [settings.soundEnabled]);

  // Play correct tap sound from pool
  const playCorrectTap = useCallback(() => {
    if (!settings.soundEnabled) return;
    if (appStateRef.current !== 'active') return;

    const pool = correctPoolRef.current;
    if (pool.sounds.length === 0) return;

    const sound = pool.sounds[pool.currentIndex];
    pool.currentIndex = (pool.currentIndex + 1) % pool.sounds.length;

    sound.replayAsync().catch(() => {
      // Ignore playback errors
    });
  }, [settings.soundEnabled]);

  return {
    playCorrectTap,
    playWrongTap: useCallback(() => playSound(wrongSoundRef), [playSound]),
    playTimeout: useCallback(() => playSound(timeoutSoundRef), [playSound]),
    playCountdownTick: useCallback(() => playSound(countdownTickSoundRef), [playSound]),
    playCountdownGo: useCallback(() => playSound(countdownGoSoundRef), [playSound]),
    playLevelUp: useCallback(() => playSound(levelUpSoundRef), [playSound]),
    playStreakMilestone: useCallback(() => playSound(streakSoundRef), [playSound]),
    playNewHighScore: useCallback(() => playSound(highScoreSoundRef), [playSound]),
    playGameOver: useCallback(() => playSound(gameOverSoundRef), [playSound]),
    playButtonPress: useCallback(() => playSound(buttonSoundRef), [playSound]),
    playScoreCount: useCallback(() => playSound(scoreTickSoundRef), [playSound]),
    stopAll: stopAllSounds,
    cleanup,
    isLoaded,
  };
}
