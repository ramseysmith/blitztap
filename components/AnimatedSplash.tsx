import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================
// COLORS (matching app theme)
// ============================================================
const COLORS = {
  bg: '#1A1A2E',
  bgLight: '#2A2A4E',
  red: '#FF4444',
  blue: '#4488FF',
  yellow: '#FFDD44',
  green: '#44DD44',
  cyan: '#00D4FF',
  white: '#FFFFFF',
  textMuted: '#B4D2EB',
};

// ============================================================
// SHAPE COMPONENTS
// ============================================================
const Circle = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }}
  >
    {/* Top highlight */}
    <View
      style={{
        position: 'absolute',
        top: size * 0.08,
        left: size * 0.15,
        right: size * 0.15,
        height: size * 0.35,
        borderRadius: size * 0.25,
        backgroundColor: 'rgba(255,255,255,0.18)',
      }}
    />
  </View>
);

const Square = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.12,
      backgroundColor: color,
    }}
  >
    <View
      style={{
        position: 'absolute',
        top: size * 0.08,
        left: size * 0.12,
        right: size * 0.12,
        height: size * 0.3,
        borderRadius: size * 0.08,
        backgroundColor: 'rgba(255,255,255,0.15)',
      }}
    />
  </View>
);

const Diamond = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      transform: [{ rotate: '45deg' }],
      borderRadius: size * 0.1,
      backgroundColor: color,
    }}
  >
    <View
      style={{
        position: 'absolute',
        top: size * 0.1,
        left: size * 0.15,
        right: size * 0.15,
        height: size * 0.3,
        borderRadius: size * 0.08,
        backgroundColor: 'rgba(255,255,255,0.15)',
        transform: [{ rotate: '0deg' }],
      }}
    />
  </View>
);

const Triangle = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: 0,
      height: 0,
      borderLeftWidth: size / 2,
      borderRightWidth: size / 2,
      borderBottomWidth: size * 0.87,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: color,
    }}
  />
);

// ============================================================
// LIGHTNING BOLT SVG-LIKE COMPONENT
// ============================================================
const LightningBolt = ({ size, progress }: { size: number; progress: Animated.SharedValue<number> }) => {
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [0.3, 1.15, 1]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.8, 1], [0, 0.8, 0.5]),
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [0.3, 1.4, 1.2]) }],
  }));

  const boltWidth = size * 0.45;
  const boltHeight = size;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow behind bolt */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: 'rgba(0, 212, 255, 0.15)',
          },
          glowStyle,
        ]}
      />
      {/* Bolt shape using stacked views */}
      <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animStyle]}>
        {/* Top part of bolt */}
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: boltWidth * 0.15,
            borderRightWidth: boltWidth * 0.85,
            borderBottomWidth: boltHeight * 0.45,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: COLORS.white,
            transform: [{ rotate: '180deg' }, { translateX: boltWidth * 0.15 }],
          }}
        />
        {/* Bottom part of bolt */}
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: boltWidth * 0.85,
            borderRightWidth: boltWidth * 0.15,
            borderBottomWidth: boltHeight * 0.45,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: COLORS.white,
            marginTop: -boltHeight * 0.08,
            transform: [{ translateX: -boltWidth * 0.15 }],
          }}
        />
      </Animated.View>
    </View>
  );
};

// ============================================================
// PARTICLE BURST COMPONENT
// ============================================================
const Particle = ({
  delay,
  angle,
  distance,
  size,
  color,
  trigger,
}: {
  delay: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  trigger: Animated.SharedValue<number>;
}) => {
  const animStyle = useAnimatedStyle(() => {
    const progress = trigger.value;
    const dx = Math.cos(angle) * distance * progress;
    const dy = Math.sin(angle) * distance * progress;
    return {
      opacity: interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 0.8, 0]),
      transform: [
        { translateX: dx },
        { translateY: dy },
        { scale: interpolate(progress, [0, 0.3, 1], [0, 1.2, 0.3]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
};

const ParticleBurst = ({ trigger }: { trigger: Animated.SharedValue<number> }) => {
  const particles = [
    { angle: 0, distance: 80, size: 6, color: COLORS.cyan },
    { angle: Math.PI * 0.33, distance: 100, size: 8, color: COLORS.red },
    { angle: Math.PI * 0.66, distance: 70, size: 5, color: COLORS.yellow },
    { angle: Math.PI, distance: 90, size: 7, color: COLORS.green },
    { angle: Math.PI * 1.33, distance: 85, size: 6, color: COLORS.blue },
    { angle: Math.PI * 1.66, distance: 75, size: 5, color: COLORS.cyan },
    { angle: Math.PI * 0.5, distance: 95, size: 4, color: COLORS.white },
    { angle: Math.PI * 1.5, distance: 65, size: 7, color: COLORS.yellow },
  ];

  return (
    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
      {particles.map((p, i) => (
        <Particle key={i} delay={i * 30} trigger={trigger} {...p} />
      ))}
    </View>
  );
};

// ============================================================
// RING PULSE COMPONENT
// ============================================================
const RingPulse = ({
  delay,
  maxRadius,
  trigger,
}: {
  delay: number;
  maxRadius: number;
  trigger: Animated.SharedValue<number>;
}) => {
  const animStyle = useAnimatedStyle(() => {
    const size = interpolate(trigger.value, [0, 1], [0, maxRadius * 2]);
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: `rgba(0, 212, 255, ${interpolate(trigger.value, [0, 0.3, 1], [0, 0.4, 0])})`,
      opacity: interpolate(trigger.value, [0, 0.1, 0.8, 1], [0, 1, 0.3, 0]),
    };
  });

  return <Animated.View style={[{ position: 'absolute' }, animStyle]} />;
};

// ============================================================
// MAIN ANIMATED SPLASH SCREEN
// ============================================================

interface AnimatedSplashProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplash({ onAnimationComplete }: AnimatedSplashProps) {
  // Shape entrance animations (fly in from edges)
  const circleProgress = useSharedValue(0);   // top left
  const squareProgress = useSharedValue(0);   // top right
  const diamondProgress = useSharedValue(0);  // bottom left
  const triangleProgress = useSharedValue(0); // bottom right

  // Bolt
  const boltProgress = useSharedValue(0);

  // Particles + rings (fire after bolt)
  const particleBurst = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);

  // Text
  const blitzOpacity = useSharedValue(0);
  const blitzTranslateY = useSharedValue(30);
  const tapOpacity = useSharedValue(0);
  const tapTranslateY = useSharedValue(30);
  const tapScale = useSharedValue(0.8);

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);

  // Loading dots
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  // Flash overlay (on bolt impact)
  const flashOpacity = useSharedValue(0);

  // Whole screen fade out at the end
  const screenOpacity = useSharedValue(1);

  // Shape positions/sizes
  const SHAPE_SIZE = 75;
  const SHAPE_SPACING = 52;

  useEffect(() => {
    // ==============================
    // TIMELINE
    // ==============================

    // 0ms: Shapes fly in from corners (staggered)
    circleProgress.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));
    squareProgress.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }));
    diamondProgress.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 120 }));
    triangleProgress.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 120 }));

    // 700ms: Lightning bolt strikes in
    boltProgress.value = withDelay(700, withSpring(1, { damping: 8, stiffness: 200 }));

    // 800ms: Flash on bolt impact
    flashOpacity.value = withDelay(750, withSequence(
      withTiming(0.6, { duration: 80 }),
      withTiming(0, { duration: 300 })
    ));

    // 850ms: Particle burst
    particleBurst.value = withDelay(800, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // 800ms+: Ring pulses (staggered)
    ring1.value = withDelay(800, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    ring2.value = withDelay(950, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    ring3.value = withDelay(1100, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // 900ms: "BLITZ" text slides up
    blitzOpacity.value = withDelay(900, withTiming(1, { duration: 300 }));
    blitzTranslateY.value = withDelay(900, withSpring(0, { damping: 14, stiffness: 150 }));

    // 1100ms: "TAP" text slides up with a pop
    tapOpacity.value = withDelay(1100, withTiming(1, { duration: 300 }));
    tapTranslateY.value = withDelay(1100, withSpring(0, { damping: 14, stiffness: 150 }));
    tapScale.value = withDelay(1100, withSequence(
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 })
    ));

    // 1500ms: Tagline fades in
    taglineOpacity.value = withDelay(1500, withTiming(1, { duration: 400 }));
    taglineTranslateY.value = withDelay(1500, withSpring(0, { damping: 14, stiffness: 120 }));

    // 1800ms: Loading dots start pulsing
    const dotPulse = (dot: Animated.SharedValue<number>, delay: number) => {
      dot.value = withDelay(
        1800 + delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    };
    dotPulse(dot1, 0);
    dotPulse(dot2, 200);
    dotPulse(dot3, 400);

    // 3200ms: Fade out entire splash
    screenOpacity.value = withDelay(3200, withTiming(0, { duration: 400 }));

    // 3600ms: Signal completion
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 3600);

    return () => clearTimeout(timer);
  }, []);

  // ============================================================
  // ANIMATED STYLES
  // ============================================================

  // Shapes fly in from off-screen positions
  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleProgress.value,
    transform: [
      { translateX: interpolate(circleProgress.value, [0, 1], [-SCREEN_WIDTH * 0.4, 0]) },
      { translateY: interpolate(circleProgress.value, [0, 1], [-SCREEN_HEIGHT * 0.2, 0]) },
      { scale: interpolate(circleProgress.value, [0, 1], [0.3, 1]) },
    ],
  }));

  const squareStyle = useAnimatedStyle(() => ({
    opacity: squareProgress.value,
    transform: [
      { translateX: interpolate(squareProgress.value, [0, 1], [SCREEN_WIDTH * 0.4, 0]) },
      { translateY: interpolate(squareProgress.value, [0, 1], [-SCREEN_HEIGHT * 0.2, 0]) },
      { scale: interpolate(squareProgress.value, [0, 1], [0.3, 1]) },
    ],
  }));

  const diamondStyle = useAnimatedStyle(() => ({
    opacity: diamondProgress.value,
    transform: [
      { translateX: interpolate(diamondProgress.value, [0, 1], [-SCREEN_WIDTH * 0.4, 0]) },
      { translateY: interpolate(diamondProgress.value, [0, 1], [SCREEN_HEIGHT * 0.2, 0]) },
      { scale: interpolate(diamondProgress.value, [0, 1], [0.3, 1]) },
    ],
  }));

  const triangleStyle = useAnimatedStyle(() => ({
    opacity: triangleProgress.value,
    transform: [
      { translateX: interpolate(triangleProgress.value, [0, 1], [SCREEN_WIDTH * 0.4, 0]) },
      { translateY: interpolate(triangleProgress.value, [0, 1], [SCREEN_HEIGHT * 0.2, 0]) },
      { scale: interpolate(triangleProgress.value, [0, 1], [0.3, 1]) },
    ],
  }));

  const blitzStyle = useAnimatedStyle(() => ({
    opacity: blitzOpacity.value,
    transform: [{ translateY: blitzTranslateY.value }],
  }));

  const tapStyle = useAnimatedStyle(() => ({
    opacity: tapOpacity.value,
    transform: [
      { translateY: tapTranslateY.value },
      { scale: tapScale.value },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ scale: interpolate(dot1.value, [0.3, 1], [0.7, 1.2]) }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ scale: interpolate(dot2.value, [0.3, 1], [0.7, 1.2]) }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
    transform: [{ scale: interpolate(dot3.value, [0.3, 1], [0.7, 1.2]) }],
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      {/* Background */}
      <View style={styles.background} />

      {/* Content centered */}
      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Animated.Text style={[styles.titleBlitz, blitzStyle]}>BLITZ</Animated.Text>
          <Animated.Text style={[styles.titleTap, tapStyle]}>TAP</Animated.Text>
        </View>

        {/* Shapes grid with bolt */}
        <View style={styles.shapesContainer}>
          {/* Ring pulses (behind everything) */}
          <View style={styles.ringsContainer}>
            <RingPulse delay={0} maxRadius={140} trigger={ring1} />
            <RingPulse delay={150} maxRadius={200} trigger={ring2} />
            <RingPulse delay={300} maxRadius={260} trigger={ring3} />
          </View>

          {/* Shapes in 2x2 grid */}
          <View style={styles.shapeGrid}>
            {/* Top row */}
            <View style={styles.shapeRow}>
              <Animated.View style={[styles.shapeWrapper, circleStyle]}>
                <Circle size={SHAPE_SIZE} color={COLORS.red} />
              </Animated.View>
              <Animated.View style={[styles.shapeWrapper, squareStyle]}>
                <Square size={SHAPE_SIZE} color={COLORS.blue} />
              </Animated.View>
            </View>
            {/* Bottom row */}
            <View style={styles.shapeRow}>
              <Animated.View style={[styles.shapeWrapper, diamondStyle]}>
                <Diamond size={SHAPE_SIZE * 0.7} color={COLORS.yellow} />
              </Animated.View>
              <Animated.View style={[styles.shapeWrapper, triangleStyle]}>
                <Triangle size={SHAPE_SIZE} color={COLORS.green} />
              </Animated.View>
            </View>
          </View>

          {/* Lightning bolt (centered, overlapping shapes) */}
          <View style={styles.boltContainer}>
            <LightningBolt size={100} progress={boltProgress} />
            <ParticleBurst trigger={particleBurst} />
          </View>
        </View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, taglineStyle]}>
          MATCH FAST. TAP FASTER.
        </Animated.Text>
      </View>

      {/* Loading dots at bottom */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, styles.dotActive, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>

      {/* Flash overlay (on bolt impact) */}
      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />
    </Animated.View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  titleBlitz: {
    fontSize: 58,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleTap: {
    fontSize: 58,
    fontWeight: '900',
    color: COLORS.cyan,
    letterSpacing: 3,
    marginLeft: 8,
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  shapesContainer: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeGrid: {
    gap: 15,
  },
  shapeRow: {
    flexDirection: 'row',
    gap: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boltContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 4,
    marginTop: 40,
    textShadowColor: 'rgba(0, 212, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.cyan,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  },
});
