import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../utils/colors';

interface PauseOverlayProps {
  score: number;
  onResume: () => void;
}

export function PauseOverlay({ score, onResume }: PauseOverlayProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Text style={styles.pausedText} accessibilityRole="header">
        PAUSED
      </Text>
      <Text style={styles.scoreText} accessibilityLabel={`Current score: ${score}`}>
        Score: {score}
      </Text>
      <Pressable
        style={({ pressed }) => [styles.resumeButton, pressed && styles.resumeButtonPressed]}
        onPress={onResume}
        accessibilityRole="button"
        accessibilityLabel="Resume game"
      >
        <Text style={styles.resumeButtonText}>Tap to Resume</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 15, 35, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pausedText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: 8,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 20,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 60,
  },
  resumeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  resumeButtonPressed: {
    opacity: 0.8,
  },
  resumeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 2,
  },
});
