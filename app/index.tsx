import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useGame } from '../contexts/GameContext';
import { usePurchase } from '../contexts/PurchaseContext';
import { useShop } from '../contexts/ShopContext';
import { useFeedback } from '../hooks/useFeedback';
import { CoinDisplay } from '../components/ui/CoinDisplay';
import { Colors } from '../utils/colors';
import { AD_UNIT_IDS } from '../utils/adConfig';
import { SPRING_CONFIG } from '../hooks/useGameAnimations';
import OnboardingScreen from '../components/OnboardingScreen';
import { getOnboardingComplete, setOnboardingComplete, getModeHighScores } from '../utils/storage';
import { getTodayResult, getTodayDateString } from '../utils/dailyChallenge';
import type { GameMode } from '../contexts/GameContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.60;
const CARD_GAP = 16;

interface ModeCardData {
  mode: GameMode;
  label: string;
  icon: string;
  tagline: string;
  color: string;
}

const MODE_CARDS: ModeCardData[] = [
  {
    mode: 'classic',
    label: 'Classic',
    icon: '⚡',
    tagline: 'One mistake and you\'re done',
    color: Colors.accent,
  },
  {
    mode: 'timeAttack',
    label: 'Time Attack',
    icon: '⏱',
    tagline: '60 seconds. Score as high as you can.',
    color: '#FF8844',
  },
  {
    mode: 'zen',
    label: 'Zen',
    icon: '🧘',
    tagline: 'No rush. No pressure. Just tap.',
    color: '#44DDAA',
  },
];

function ModeCard({
  card,
  highScore,
  onPlay,
}: {
  card: ModeCardData;
  highScore: number;
  onPlay: (mode: GameMode) => void;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: 0.15 + glow.value * 0.45,
      shadowRadius: 8 + glow.value * 16,
    };
  });

  return (
    <Pressable
      onPress={() => onPlay(card.mode)}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
        glow.value = withTiming(1, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
        glow.value = withTiming(0, { duration: 200 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Play ${card.label} mode`}
    >
      <Animated.View style={[styles.modeCard, { borderColor: card.color + '66', shadowColor: card.color }, cardStyle]}>
        {/* Best score badge — top left */}
        <View style={[styles.modeBestBadge, { borderColor: card.color + '55' }]}>
          <Text style={styles.modeBestLabel}>BEST</Text>
          <Text style={[styles.modeBestValue, { color: card.color }]}>{highScore}</Text>
        </View>

        {/* Title row: name + emoji */}
        <View style={styles.modeTitleRow}>
          <Text style={[styles.modeLabel, { color: card.color }]}>{card.label}</Text>
          <Text style={styles.modeIcon}>{card.icon}</Text>
        </View>

        <Text style={styles.modeTagline}>{card.tagline}</Text>

        {/* Tap hint */}
        <View style={[styles.modeTapHint, { borderColor: card.color + '33', backgroundColor: card.color + '18' }]}>
          <Text style={[styles.modeTapHintText, { color: card.color }]}>TAP TO PLAY</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const { isProUser, removeAdsPrice, purchaseRemoveAds } = usePurchase();
  const { coins } = useShop();
  const feedback = useFeedback();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [modeHighScores, setModeHighScores] = useState({ classic: 0, timeAttack: 0, zen: 0 });
  const [dailyStatus, setDailyStatus] = useState<{ attempted: boolean; score: number; completed: boolean } | null>(null);
  const [todayDate] = useState(getTodayDateString());

  useEffect(() => {
    getOnboardingComplete().then((done) => {
      if (!done) setShowOnboarding(true);
    });
  }, []);

  // Refresh data each time screen gains focus (after returning from game)
  useFocusEffect(
    useCallback(() => {
      getModeHighScores().then(setModeHighScores);

      getTodayResult().then((result) => {
        if (result) {
          setDailyStatus({ attempted: true, score: result.score, completed: result.completed });
        } else {
          setDailyStatus({ attempted: false, score: 0, completed: false });
        }
      });
    }, []),
  );

  const handleOnboardingComplete = useCallback(async () => {
    await setOnboardingComplete();
    setShowOnboarding(false);
  }, []);

  // Animation values
  const titleGlow = useSharedValue(0.5);
  const dailyPulse = useSharedValue(1);

  useEffect(() => {
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    if (dailyStatus && !dailyStatus.attempted) {
      dailyPulse.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );
    }
  }, [dailyStatus]);

  const titleGlowStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      textShadowRadius: 20 + titleGlow.value * 15,
      opacity: 0.8 + titleGlow.value * 0.2,
    };
  });

  const dailyCardStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: dailyPulse.value }] };
  });

  const handlePlay = (mode: GameMode) => {
    feedback.onButtonPress();
    router.push(`/game?mode=${mode}`);
  };

  const handleSettings = () => {
    feedback.onButtonPress();
    router.push('/settings');
  };

  const handleStats = () => {
    feedback.onButtonPress();
    router.push('/stats');
  };

  const handleShop = () => {
    feedback.onButtonPress();
    router.push('/shop');
  };

  const handleDailyChallenge = () => {
    feedback.onButtonPress();
    router.push('/daily');
  };

  const handleRemoveAds = async () => {
    feedback.onButtonPress();
    setIsPurchasing(true);
    const result = await purchaseRemoveAds();
    setIsPurchasing(false);
    if (result.message) {
      Alert.alert(result.success ? 'Success' : 'Purchase', result.message);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Background decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.bgShape, styles.bgShape1]} />
        <View style={[styles.bgShape, styles.bgShape2]} />
        <View style={[styles.bgShape, styles.bgShape3]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={handleSettings}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Text style={styles.headerIcon}>⚙️</Text>
          </Pressable>
          <Pressable
            onPress={handleStats}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="View stats"
          >
            <Text style={styles.headerIcon}>📊</Text>
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={handleShop}
            style={styles.iconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Open shop"
          >
            <Text style={styles.headerIcon}>🛍</Text>
          </Pressable>
          <CoinDisplay coins={state.totalCoins} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isProUser ? insets.bottom + 20 : insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.title, titleGlowStyle]}>BLITZ</Animated.Text>
          <Animated.Text style={[styles.titleAccent, titleGlowStyle]}>TAP</Animated.Text>
        </View>

        {/* Daily Challenge Card */}
        <Pressable onPress={handleDailyChallenge} style={styles.dailyChallengeWrapper}>
          <Animated.View
            style={[
              styles.dailyChallengeCard,
              dailyStatus?.attempted ? styles.dailyCardCompleted : styles.dailyCardReady,
              dailyCardStyle,
            ]}
          >
            <View style={styles.dailyLeft}>
              <Text style={styles.dailyIcon}>📅</Text>
              <View>
                <Text style={styles.dailyTitle}>Daily Challenge</Text>
                <Text style={styles.dailyDate}>{formatDate(todayDate)}</Text>
              </View>
            </View>
            <View style={styles.dailyRight}>
              {dailyStatus === null ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : dailyStatus.attempted ? (
                <View style={styles.dailyScoreContainer}>
                  <Text style={styles.dailyScore}>{dailyStatus.score}</Text>
                  {dailyStatus.completed && <Text style={styles.dailyStar}>⭐</Text>}
                  <Text style={styles.dailyDone}>Tomorrow →</Text>
                </View>
              ) : (
                <View style={styles.dailyReadyBadge}>
                  <Text style={styles.dailyReadyText}>Ready!</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </Pressable>

        {/* Mode Selection */}
        <Text style={styles.sectionLabel}>CHOOSE MODE</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeCardsContainer}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {MODE_CARDS.map((card) => (
            <ModeCard
              key={card.mode}
              card={card}
              highScore={modeHighScores[card.mode]}
              onPlay={handlePlay}
            />
          ))}
        </ScrollView>

        {/* Remove Ads button */}
        {!isProUser && (
          <Pressable onPress={handleRemoveAds} disabled={isPurchasing} style={styles.removeAdsButton}>
            {isPurchasing ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Text style={styles.removeAdsText}>Remove Ads — {removeAdsPrice}</Text>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Banner ad */}
      {!isProUser && (
        <View style={[styles.bannerContainer, { paddingBottom: insets.bottom }]}>
          <BannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdFailedToLoad={(error: Error) => {
              console.log('Banner ad failed to load:', error);
            }}
          />
        </View>
      )}

      {showOnboarding && <OnboardingScreen onComplete={handleOnboardingComplete} />}
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
  bgShape1: { width: 300, height: 300, backgroundColor: Colors.accent, top: -100, right: -100 },
  bgShape2: { width: 200, height: 200, backgroundColor: '#AA44FF', bottom: 100, left: -80 },
  bgShape3: { width: 150, height: 150, backgroundColor: Colors.success, bottom: -50, right: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    zIndex: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 8 },
  headerIcon: { fontSize: 22 },
  scrollContent: {
    paddingHorizontal: 0,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 10,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
  },
  titleAccent: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: 10,
    marginTop: -12,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
  },
  // Daily Challenge
  dailyChallengeWrapper: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  dailyChallengeCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dailyCardReady: {
    backgroundColor: '#0D1A2A',
    borderColor: Colors.accent + '55',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  dailyCardCompleted: {
    backgroundColor: Colors.backgroundLight,
    borderColor: Colors.textSecondary + '33',
  },
  dailyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyIcon: { fontSize: 28 },
  dailyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  dailyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dailyRight: {
    alignItems: 'flex-end',
  },
  dailyReadyBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dailyReadyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.background,
  },
  dailyScoreContainer: {
    alignItems: 'flex-end',
  },
  dailyScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    fontVariant: ['tabular-nums'],
  },
  dailyStar: { fontSize: 16, marginTop: 2 },
  dailyDone: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Mode Selection
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modeCardsContainer: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
    paddingRight: 40,
  },
  modeCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    padding: 16,
    paddingTop: 52,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeBestBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 44,
  },
  modeBestLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  modeBestValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    lineHeight: 20,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  modeIcon: { fontSize: 20 },
  modeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modeTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  modeTapHint: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    alignItems: 'center',
  },
  modeTapHintText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  removeAdsButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.warning,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  removeAdsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
    letterSpacing: 1,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
