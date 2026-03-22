import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Colors } from '../../utils/colors';

interface Props {
  backgroundId: string; // 'default' or item ID
}

const STAR_COUNT = 30;
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => ({
  x: Math.random(),
  y: Math.random(),
  size: Math.random() * 2 + 1,
  opacity: Math.random() * 0.5 + 0.2,
}));

function DefaultBackground() {
  return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.background }]} />;
}

function MidnightBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#080818' }]} />
      <View style={[styles.gradientOverlay, { backgroundColor: '#0D0D2E', opacity: 0.8 }]} />
      <View style={[styles.gradientBottom, { backgroundColor: '#050510', opacity: 0.6 }]} />
    </View>
  );
}

function ForestBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#050F05' }]} />
      <View style={[styles.gradientOverlay, { backgroundColor: '#0A1A0A', opacity: 0.9 }]} />
      {/* Subtle leaf-like shapes */}
      {[0.1, 0.3, 0.6, 0.8].map((x, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: `${(i * 0.25) * 100}%`,
            width: 40 + i * 10,
            height: 60 + i * 10,
            borderRadius: 20,
            backgroundColor: '#0F2A0F',
            opacity: 0.4,
            transform: [{ rotate: `${i * 30}deg` }],
          }}
        />
      ))}
    </View>
  );
}

function SunsetBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#150510' }]} />
      <View style={[styles.gradientOverlay, { backgroundColor: '#2A1020', opacity: 0.9 }]} />
      <View style={[styles.gradientTop, { backgroundColor: '#4A1A10', opacity: 0.5 }]} />
      <View style={[styles.gradientBottom, { backgroundColor: '#1A0530', opacity: 0.7 }]} />
    </View>
  );
}

function OceanBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#040E12' }]} />
      <View style={[styles.gradientOverlay, { backgroundColor: '#071A1F', opacity: 0.95 }]} />
      <View style={[styles.gradientBottom, { backgroundColor: '#041015', opacity: 0.8 }]} />
      {/* Wave-like lines */}
      {[0.3, 0.5, 0.7].map((y, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: '-10%',
            top: `${y * 100}%`,
            width: '120%',
            height: 1,
            backgroundColor: '#0A3A4A',
            opacity: 0.5,
            transform: [{ rotate: `${(i - 1) * 2}deg` }],
          }}
        />
      ))}
    </View>
  );
}

function NebulaBackground() {
  const { reduceMotion } = useAccessibility();
  const twinkle = useSharedValue(0.8);

  useEffect(() => {
    if (reduceMotion) return;
    twinkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.6, { duration: 3000 }),
      ),
      -1,
      true,
    );
  }, [reduceMotion]);

  const starStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: twinkle.value };
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#03030A' }]} />
      {/* Nebula glow patches */}
      <View style={[styles.nebulaGlow, { backgroundColor: '#0A0A3A', top: '10%', left: '20%', width: 150, height: 100 }]} />
      <View style={[styles.nebulaGlow, { backgroundColor: '#1A051A', bottom: '20%', right: '10%', width: 120, height: 80 }]} />
      {/* Stars */}
      <Animated.View style={[StyleSheet.absoluteFillObject, starStyle]}>
        {STARS.map((star, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${star.x * 100}%`,
              top: `${star.y * 100}%`,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: '#FFFFFF',
              opacity: star.opacity,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function AuroraBackground() {
  const { reduceMotion } = useAccessibility();
  const shift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    shift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000 }),
        withTiming(0, { duration: 4000 }),
      ),
      -1,
      true,
    );
  }, [reduceMotion]);

  const aurora1Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 0.2 + shift.value * 0.15,
      transform: [{ translateY: shift.value * 20 - 10 }],
    };
  });

  const aurora2Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 0.15 + (1 - shift.value) * 0.15,
      transform: [{ translateY: (1 - shift.value) * 20 - 10 }],
    };
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#030A07' }]} />
      {/* Animated aurora bands */}
      <Animated.View style={[styles.aurora, aurora1Style, { backgroundColor: '#00AA5550', top: '15%', height: 200 }]} />
      <Animated.View style={[styles.aurora, aurora2Style, { backgroundColor: '#AA00FF40', top: '35%', height: 160 }]} />
      <Animated.View style={[styles.aurora, aurora1Style, { backgroundColor: '#00CC8830', top: '55%', height: 120 }]} />
    </View>
  );
}

export function GameBackground({ backgroundId }: Props) {
  switch (backgroundId) {
    case 'bg_midnight':
      return <MidnightBackground />;
    case 'bg_forest':
      return <ForestBackground />;
    case 'bg_sunset':
      return <SunsetBackground />;
    case 'bg_ocean':
      return <OceanBackground />;
    case 'bg_space':
      return <NebulaBackground />;
    case 'bg_aurora':
      return <AuroraBackground />;
    default:
      return <DefaultBackground />;
  }
}

const styles = StyleSheet.create({
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  nebulaGlow: {
    position: 'absolute',
    borderRadius: 80,
    opacity: 0.6,
  },
  aurora: {
    position: 'absolute',
    left: '-20%',
    right: '-20%',
    borderRadius: 100,
  },
});
