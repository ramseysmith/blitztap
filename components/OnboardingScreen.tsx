import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Inline shape components ─────────────────────────────────────────────────

const ShapeCircle = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
);

const ShapeSquare = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, borderRadius: size * 0.15, backgroundColor: color }} />
);

const ShapeTriangle = ({ size, color }: { size: number; color: string }) => (
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

const ShapeDiamond = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size * 0.8,
      height: size * 0.8,
      borderRadius: size * 0.08,
      backgroundColor: color,
      transform: [{ rotate: '45deg' }],
    }}
  />
);

// ─── Slide 1: Spot the Match ──────────────────────────────────────────────────

const SpotTheMatchDemo = ({ visible }: { visible: boolean }) => {
  const tapScale = useSharedValue(1);
  const tapOpacity = useSharedValue(0);
  const arrowOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Fade in arrow
    arrowOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));

    // Pulsing tap indicator on the correct answer
    tapOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
    tapScale.value = withDelay(700, withRepeat(
      withSequence(
        withSpring(1.35, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 150 })
      ),
      -1,
      true
    ));

    return () => {
      tapScale.value = 1;
      tapOpacity.value = 0;
      arrowOpacity.value = 0;
    };
  }, [visible]);

  const tapRingStyle = useAnimatedStyle(() => ({
    opacity: tapOpacity.value * 0.6,
    transform: [{ scale: tapScale.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value,
    transform: [{ translateY: interpolate(arrowOpacity.value, [0, 1], [8, 0]) }],
  }));

  // Target: blue circle. Options: red circle, blue circle (correct), green square, yellow triangle
  const options = [
    { shape: 'circle', color: Colors.pieces.red, correct: false },
    { shape: 'circle', color: Colors.pieces.blue, correct: true },
    { shape: 'square', color: Colors.pieces.green, correct: false },
    { shape: 'triangle', color: Colors.pieces.yellow, correct: false },
  ];

  return (
    <View style={demoStyles.container}>
      {/* Target */}
      <View style={demoStyles.targetWrapper}>
        <Text style={demoStyles.label}>TARGET</Text>
        <View style={demoStyles.targetBox}>
          <ShapeCircle size={52} color={Colors.pieces.blue} />
        </View>
      </View>

      <Animated.Text style={[demoStyles.arrow, arrowStyle]}>▼</Animated.Text>

      {/* Grid */}
      <View style={demoStyles.gridWrapper}>
        <Text style={demoStyles.label}>FIND THE MATCH</Text>
        <View style={demoStyles.grid}>
          {options.map((opt, i) => (
            <View key={i} style={[demoStyles.optionBox, opt.correct && demoStyles.optionBoxCorrect]}>
              {opt.shape === 'circle' && <ShapeCircle size={36} color={opt.color} />}
              {opt.shape === 'square' && <ShapeSquare size={36} color={opt.color} />}
              {opt.shape === 'triangle' && <ShapeTriangle size={36} color={opt.color} />}
              {opt.correct && (
                <Animated.View style={[demoStyles.tapRing, tapRingStyle]} />
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Slide 2: Race the Clock ──────────────────────────────────────────────────

const RaceTheClockDemo = ({ visible }: { visible: boolean }) => {
  const barWidth = useSharedValue(1);
  const barColor = useSharedValue(0); // 0=green, 0.5=yellow, 1=red

  useEffect(() => {
    if (!visible) return;

    barWidth.value = 1;
    barColor.value = 0;

    barWidth.value = withDelay(300, withTiming(0, { duration: 2800, easing: Easing.linear }));
    barColor.value = withDelay(300, withTiming(1, { duration: 2800, easing: Easing.linear }));

    return () => {
      barWidth.value = 1;
      barColor.value = 0;
    };
  }, [visible]);

  const barStyle = useAnimatedStyle(() => {
    const r = Math.round(interpolate(barColor.value, [0, 0.5, 1], [0, 255, 255]));
    const g = Math.round(interpolate(barColor.value, [0, 0.5, 1], [255, 184, 51]));
    const b = Math.round(interpolate(barColor.value, [0, 0.5, 1], [136, 0, 102]));
    return {
      width: `${barWidth.value * 100}%` as any,
      backgroundColor: `rgb(${r},${g},${b})`,
    };
  });

  const rows = [
    { label: 'Score 0–9', time: '3.0s', grid: '4 options' },
    { label: 'Score 10–24', time: '2.2s', grid: '6 options' },
    { label: 'Score 25–49', time: '1.6s', grid: '9 options' },
    { label: 'Score 50+', time: '1.2s', grid: '12 options' },
  ];

  return (
    <View style={demoStyles.container}>
      {/* Timer bar */}
      <View style={demoStyles.timerTrack}>
        <Animated.View style={[demoStyles.timerBar, barStyle]} />
      </View>
      <Text style={demoStyles.timerHint}>Miss or time out = Game Over</Text>

      {/* Tier table */}
      <View style={demoStyles.table}>
        {rows.map((row, i) => (
          <View key={i} style={demoStyles.tableRow}>
            <Text style={demoStyles.tableLabel}>{row.label}</Text>
            <View style={demoStyles.tableBadges}>
              <View style={[demoStyles.badge, { backgroundColor: Colors.accent + '22' }]}>
                <Text style={[demoStyles.badgeText, { color: Colors.accent }]}>{row.time}</Text>
              </View>
              <View style={[demoStyles.badge, { backgroundColor: Colors.warning + '22' }]}>
                <Text style={[demoStyles.badgeText, { color: Colors.warning }]}>{row.grid}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Slide 3: Chain It Up ─────────────────────────────────────────────────────

const ChainItUpDemo = ({ visible }: { visible: boolean }) => {
  const fireScale = useSharedValue(1);
  const scoreScale = useSharedValue(1);
  const multiplierScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    fireScale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 6, stiffness: 180 }),
        withSpring(0.95, { damping: 8, stiffness: 150 })
      ),
      -1,
      true
    );

    scoreScale.value = withDelay(300, withSequence(
      withSpring(1.3, { damping: 5, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    ));

    multiplierScale.value = withDelay(500, withSpring(1, { damping: 8, stiffness: 180 }));

    return () => {
      fireScale.value = 1;
      scoreScale.value = 1;
      multiplierScale.value = 0;
    };
  }, [visible]);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const multiplierStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multiplierScale.value }],
    opacity: multiplierScale.value,
  }));

  const tiers = [
    { streak: '5×', mult: '2×', color: Colors.success },
    { streak: '10×', mult: '3×', color: Colors.accent },
    { streak: '20×', mult: '5×', color: '#AA44FF' },
  ];

  return (
    <View style={demoStyles.container}>
      <View style={demoStyles.scoreRow}>
        <Animated.Text style={[demoStyles.bigScore, scoreStyle]}>247</Animated.Text>
        <Animated.View style={[demoStyles.multiplierBadge, multiplierStyle]}>
          <Text style={demoStyles.multiplierText}>×5</Text>
        </Animated.View>
        <Animated.Text style={[demoStyles.fireEmoji, fireStyle]}>🔥</Animated.Text>
      </View>

      <View style={demoStyles.streakTable}>
        {tiers.map((t, i) => (
          <View key={i} style={demoStyles.streakRow}>
            <Text style={demoStyles.streakLabel}>Streak</Text>
            <View style={[demoStyles.streakBadge, { backgroundColor: t.color + '33', borderColor: t.color + '66' }]}>
              <Text style={[demoStyles.streakBadgeText, { color: t.color }]}>{t.streak}</Text>
            </View>
            <Text style={demoStyles.streakArrow}>→</Text>
            <View style={[demoStyles.multBadge, { backgroundColor: t.color }]}>
              <Text style={demoStyles.multText}>{t.mult} score</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Slide 4: Tiers of Chaos ──────────────────────────────────────────────────

const TiersDemo = ({ visible }: { visible: boolean }) => {
  const tier1Scale = useSharedValue(0);
  const tier2Scale = useSharedValue(0);
  const tier3Scale = useSharedValue(0);
  const tier4Scale = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    tier1Scale.value = withDelay(0, withSpring(1, { damping: 10, stiffness: 180 }));
    tier2Scale.value = withDelay(150, withSpring(1, { damping: 10, stiffness: 180 }));
    tier3Scale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 180 }));
    tier4Scale.value = withDelay(450, withSpring(1, { damping: 10, stiffness: 180 }));

    return () => {
      tier1Scale.value = 0;
      tier2Scale.value = 0;
      tier3Scale.value = 0;
      tier4Scale.value = 0;
    };
  }, [visible]);

  const makeStyle = (val: Animated.SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: val.value,
      transform: [{ scale: val.value }, { translateY: interpolate(val.value, [0, 1], [20, 0]) }],
    }));

  const tiers = [
    {
      title: 'TIER 1',
      subtitle: 'Color Match',
      score: '0–9',
      color: Colors.success,
      shapes: [
        <ShapeCircle size={18} color={Colors.pieces.red} />,
        <ShapeCircle size={18} color={Colors.pieces.blue} />,
        <ShapeCircle size={18} color={Colors.pieces.green} />,
        <ShapeCircle size={18} color={Colors.pieces.yellow} />,
      ],
      style: makeStyle(tier1Scale),
    },
    {
      title: 'TIER 2',
      subtitle: 'Shape Match',
      score: '10–24',
      color: Colors.accent,
      shapes: [
        <ShapeCircle size={16} color={Colors.pieces.blue} />,
        <ShapeSquare size={16} color={Colors.pieces.red} />,
        <ShapeTriangle size={16} color={Colors.pieces.green} />,
        <ShapeDiamond size={20} color={Colors.pieces.yellow} />,
      ],
      style: makeStyle(tier2Scale),
    },
    {
      title: 'TIER 3',
      subtitle: 'Pattern Match',
      score: '25–49',
      color: Colors.warning,
      shapes: [
        <ShapeCircle size={14} color={Colors.pieces.purple} />,
        <ShapeSquare size={14} color={Colors.pieces.blue} />,
        <ShapeTriangle size={14} color={Colors.pieces.red} />,
        <ShapeDiamond size={18} color={Colors.pieces.purple} />,
        <ShapeCircle size={14} color={Colors.pieces.green} />,
        <ShapeSquare size={14} color={Colors.pieces.yellow} />,
      ],
      style: makeStyle(tier3Scale),
    },
    {
      title: 'TIER 4',
      subtitle: '⚡ Chaos Mode',
      score: '50+',
      color: Colors.error,
      shapes: [
        <ShapeCircle size={12} color={Colors.pieces.orange} />,
        <ShapeSquare size={12} color={Colors.pieces.red} />,
        <ShapeTriangle size={12} color={Colors.pieces.blue} />,
        <ShapeDiamond size={16} color={Colors.pieces.yellow} />,
        <ShapeCircle size={12} color={Colors.pieces.purple} />,
        <ShapeSquare size={12} color={Colors.pieces.orange} />,
        <ShapeTriangle size={12} color={Colors.pieces.green} />,
        <ShapeCircle size={12} color={Colors.pieces.red} />,
      ],
      style: makeStyle(tier4Scale),
    },
  ];

  return (
    <View style={demoStyles.container}>
      {tiers.map((tier, i) => (
        <Animated.View key={i} style={[demoStyles.tierCard, { borderLeftColor: tier.color }, tier.style]}>
          <View style={demoStyles.tierInfo}>
            <Text style={[demoStyles.tierTitle, { color: tier.color }]}>{tier.title}</Text>
            <Text style={demoStyles.tierSubtitle}>{tier.subtitle}</Text>
            <Text style={demoStyles.tierScore}>Score {tier.score}</Text>
          </View>
          <View style={demoStyles.tierShapes}>
            {tier.shapes.map((shape, j) => (
              <View key={j} style={demoStyles.miniShapeWrapper}>{shape}</View>
            ))}
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// ─── Slide data ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'SPOT THE\nMATCH',
    subtitle: 'Tap the shape that matches the target',
    accentColor: Colors.accent,
    Demo: SpotTheMatchDemo,
  },
  {
    title: 'RACE THE\nCLOCK',
    subtitle: 'Every tap resets the timer. Time out = Game Over',
    accentColor: Colors.error,
    Demo: RaceTheClockDemo,
  },
  {
    title: 'CHAIN IT\nUP',
    subtitle: 'Build streaks to multiply your score',
    accentColor: Colors.warning,
    Demo: ChainItUpDemo,
  },
  {
    title: '4 TIERS\nOF CHAOS',
    subtitle: 'Unlock harder tiers as your score climbs',
    accentColor: Colors.success,
    Demo: TiersDemo,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Per-slide animation values
  const slideOpacity = useSharedValue(1);
  const slideTY = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  // Button animation
  const btnScale = useSharedValue(1);

  const animateIn = useCallback(() => {
    titleOpacity.value = 0;
    titleTY.value = 25;
    subtitleOpacity.value = 0;

    titleOpacity.value = withDelay(80, withTiming(1, { duration: 350 }));
    titleTY.value = withDelay(80, withSpring(0, { damping: 14, stiffness: 140 }));
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
  }, []);

  // Entrance animation for the whole screen
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 300 });
    animateIn();
  }, []);

  const goToSlide = useCallback((nextIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Fade out
    slideOpacity.value = withTiming(0, { duration: 180 });
    slideTY.value = withTiming(-15, { duration: 180 });

    setTimeout(() => {
      setCurrentSlide(nextIndex);
      slideOpacity.value = 0;
      slideTY.value = 20;
      // Fade in
      slideOpacity.value = withTiming(1, { duration: 220 });
      slideTY.value = withSpring(0, { damping: 14, stiffness: 140 });
      animateIn();
      setIsTransitioning(false);
    }, 200);
  }, [isTransitioning, animateIn]);

  const handleNext = useCallback(() => {
    btnScale.value = withSequence(
      withSpring(0.93, { damping: 12, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      containerOpacity.value = withTiming(0, { duration: 300 }, () => runOnJS(onComplete)());
    }
  }, [currentSlide, goToSlide, onComplete]);

  const handleSkip = useCallback(() => {
    containerOpacity.value = withTiming(0, { duration: 250 }, () => runOnJS(onComplete)());
  }, [onComplete]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const slideStyle = useAnimatedStyle(() => ({
    opacity: slideOpacity.value,
    transform: [{ translateY: slideTY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      {/* Background blobs */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      {/* Skip */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
        <View style={styles.slideCounter}>
          <Text style={styles.slideCounterText}>{currentSlide + 1} / {SLIDES.length}</Text>
        </View>
      </View>

      {/* Slide content */}
      <Animated.View style={[styles.slideContainer, slideStyle]}>
        {/* Title */}
        <Animated.Text style={[styles.slideTitle, { color: slide.accentColor }, titleStyle]}>
          {slide.title}
        </Animated.Text>
        <Animated.Text style={[styles.slideSubtitle, subtitleStyle]}>
          {slide.subtitle}
        </Animated.Text>

        {/* Demo visual */}
        <View style={styles.demoArea}>
          <slide.Demo visible={currentSlide === SLIDES.indexOf(slide)} />
        </View>
      </Animated.View>

      {/* Footer: dots + button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => !isTransitioning && goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  i === currentSlide
                    ? [styles.dotActive, { backgroundColor: slide.accentColor }]
                    : styles.dotInactive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Next / Play button */}
        <Pressable onPress={handleNext}>
          <Animated.View style={[styles.nextButton, { backgroundColor: slide.accentColor }, btnStyle]}>
            <Text style={styles.nextButtonText}>
              {isLast ? "LET'S PLAY! ⚡" : 'NEXT →'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Demo styles ──────────────────────────────────────────────────────────────

const demoStyles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  // Slide 1
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  targetWrapper: {
    alignItems: 'center',
  },
  targetBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: Colors.accent + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: Colors.accent,
  },
  gridWrapper: {
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 184,
    gap: 8,
  },
  optionBox: {
    width: 84,
    height: 64,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBoxCorrect: {
    borderColor: Colors.accent,
  },
  tapRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  // Slide 2
  timerTrack: {
    width: '90%',
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.backgroundLight,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 6,
  },
  timerHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  table: {
    width: '90%',
    gap: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 10,
  },
  tableLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  tableBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Slide 3
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bigScore: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
    textShadowColor: Colors.warning,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  multiplierBadge: {
    backgroundColor: '#AA44FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  multiplierText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  fireEmoji: {
    fontSize: 32,
  },
  streakTable: {
    width: '90%',
    gap: 8,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 10,
  },
  streakLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 40,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  streakArrow: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  multBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  multText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.background,
  },
  // Slide 4
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  tierInfo: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tierSubtitle: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  tierScore: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tierShapes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 80,
    gap: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniShapeWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 100,
  },
  bgBlob1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: Colors.accent,
    opacity: 0.04,
    top: -120,
    right: -120,
  },
  bgBlob2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#AA44FF',
    opacity: 0.04,
    bottom: -80,
    left: -80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  slideCounter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
  },
  slideCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  slideTitle: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 44,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  slideSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  demoArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: 5,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: Colors.backgroundLight,
  },
  nextButton: {
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.background,
    letterSpacing: 2,
  },
});
