import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { CoinDisplay } from '../components/ui/CoinDisplay';
import { Colors } from '../utils/colors';
import { SPRING_CONFIG, SPRING_BOUNCY } from '../hooks/useGameAnimations';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();

  // Animation values
  const titleGlow = useSharedValue(0.5);
  const buttonGlow = useSharedValue(0.3);
  const buttonScale = useSharedValue(1);

  // Title glow pulse
  useEffect(() => {
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    buttonGlow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const titleGlowStyle = useAnimatedStyle(() => ({
    textShadowRadius: 20 + titleGlow.value * 15,
    opacity: 0.8 + titleGlow.value * 0.2,
  }));

  const buttonGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: buttonGlow.value,
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handlePlay = () => {
    router.push('/game');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Background decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.bgShape, styles.bgShape1]} />
        <View style={[styles.bgShape, styles.bgShape2]} />
        <View style={[styles.bgShape, styles.bgShape3]} />
      </View>

      {/* Header with coins */}
      <View style={styles.header}>
        <CoinDisplay coins={state.totalCoins} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.title, titleGlowStyle]}>
            BLITZ
          </Animated.Text>
          <Animated.Text style={[styles.titleAccent, titleGlowStyle]}>
            TAP
          </Animated.Text>
        </View>

        <View style={styles.highScoreContainer}>
          <View style={styles.highScoreRow}>
            <Text style={styles.trophyIcon}>🏆</Text>
            <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
          </View>
          <Text style={styles.highScoreValue}>{state.highScore}</Text>
        </View>
      </View>

      {/* Play button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <Pressable
          onPress={handlePlay}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.playButton, buttonGlowStyle]}>
            <Text style={styles.playButtonText}>PLAY</Text>
          </Animated.View>
        </Pressable>

        {/* Shop teaser */}
        <View style={styles.shopTeaser}>
          <Text style={styles.shopTeaserText}>Shop Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgShape: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.03,
  },
  bgShape1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.accent,
    top: -100,
    right: -100,
  },
  bgShape2: {
    width: 200,
    height: 200,
    backgroundColor: '#AA44FF',
    bottom: 100,
    left: -80,
  },
  bgShape3: {
    width: 150,
    height: 150,
    backgroundColor: Colors.success,
    bottom: -50,
    right: 50,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 80,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 10,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
  },
  titleAccent: {
    fontSize: 80,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: 10,
    marginTop: -15,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
  },
  highScoreContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  highScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trophyIcon: {
    fontSize: 18,
  },
  highScoreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 3,
  },
  highScoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    fontVariant: ['tabular-nums'],
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  footer: {
    alignItems: 'center',
    zIndex: 1,
  },
  playButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 80,
    paddingVertical: 22,
    borderRadius: 40,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
  },
  playButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 6,
  },
  shopTeaser: {
    marginTop: 30,
  },
  shopTeaserText: {
    fontSize: 12,
    color: Colors.textSecondary,
    opacity: 0.5,
  },
});
