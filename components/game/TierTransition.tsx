import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';

interface TierTransitionProps {
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  text: string;
  color: string;
}

export function TierTransition({ scale, opacity, text, color }: TierTransitionProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!text) return null;

  return (
    <Animated.View style={[styles.container]} pointerEvents="none">
      <Animated.Text
        style={[
          styles.text,
          { color, textShadowColor: color },
          animatedStyle,
        ]}
      >
        {text}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
});
