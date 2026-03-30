// Share card component for BlitzTap - Update 2
// Rendered off-screen, captured via ViewShot

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../utils/colors';

export type ShareCardVariant = 'score' | 'highscore' | 'daily' | 'achievement' | 'levelup';

export interface ShareCardData {
  variant: ShareCardVariant;
  score: number;
  mode: string;
  modeBadge: string;
  tier: number;
  tierLabel: string;
  maxStreak: number;
  multiplier: number;
  correctTaps: number;
  isNewHighScore: boolean;
  previousBest?: number;
  // Daily specific
  dailyCorrect?: number;
  dailyTotal?: number;
  dailyComplete?: boolean;
  // Achievement specific
  achievementTitle?: string;
  achievementIcon?: string;
  achievementTier?: string;
  achievementCount?: number;
  achievementTotal?: number;
  // Level specific
  level?: number;
  // Player info
  playerLevel?: number;
}

const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;

const TIER_LABELS: Record<number, string> = {
  1: 'BEGINNER',
  2: 'INTERMEDIATE',
  3: 'ADVANCED',
  4: 'CHAOS MODE',
};

const TIER_COLORS_MAP: Record<number, string> = {
  1: Colors.success,
  2: Colors.accent,
  3: Colors.warning,
  4: Colors.error,
};

function getChallengeText(score: number, variant: ShareCardVariant): string {
  if (variant === 'daily') return '';
  if (score < 25) return 'Can you beat this?';
  if (score < 50) return 'Think you\'re faster?';
  if (score < 100) return 'I dare you to try.';
  return 'Come get me.';
}

export default function ShareCard({ data }: { data: ShareCardData }) {
  const tierColor = TIER_COLORS_MAP[data.tier] ?? Colors.accent;

  if (data.variant === 'achievement') {
    return (
      <View style={[styles.card, { borderColor: data.achievementTier === 'gold' ? '#FFD700' : data.achievementTier === 'platinum' ? '#E5E4E2' : Colors.accent }]}>
        <View style={styles.cardInner}>
          <Text style={styles.brandSmall}>BLITZTAP</Text>

          <View style={styles.achievementSection}>
            <Text style={styles.achievementIcon}>{data.achievementIcon}</Text>
            <Text style={styles.achievementLabel}>ACHIEVEMENT UNLOCKED</Text>
            <Text style={styles.achievementTitle}>{data.achievementTitle}</Text>
          </View>

          {data.achievementCount !== undefined && (
            <Text style={styles.achievementProgress}>
              {data.achievementCount}/{data.achievementTotal} Achievements Unlocked
            </Text>
          )}

          {data.playerLevel && (
            <Text style={styles.levelBadge}>Level {data.playerLevel}</Text>
          )}

          <Text style={styles.cta}>BlitzTap — Free on the App Store</Text>
        </View>
      </View>
    );
  }

  if (data.variant === 'levelup') {
    return (
      <View style={[styles.card, { borderColor: Colors.warning }]}>
        <View style={styles.cardInner}>
          <Text style={styles.brandSmall}>BLITZTAP</Text>

          <Text style={styles.levelUpLabel}>LEVEL UP!</Text>
          <Text style={[styles.heroScore, { color: Colors.warning }]}>
            Level {data.level}
          </Text>

          <Text style={styles.cta}>BlitzTap — Free on the App Store</Text>
        </View>
      </View>
    );
  }

  if (data.variant === 'daily') {
    return (
      <View style={[styles.card, { borderColor: Colors.accent }]}>
        <View style={styles.cardInner}>
          <Text style={styles.brandSmall}>BLITZTAP</Text>

          <View style={styles.modeBadgeContainer}>
            <Text style={styles.modeBadge}>DAILY CHALLENGE</Text>
          </View>

          <Text style={[styles.heroScore, { color: Colors.textPrimary }]}>
            {data.dailyCorrect}/{data.dailyTotal}
          </Text>

          {data.dailyComplete && (
            <Text style={[styles.stampText, { color: Colors.success }]}>CHALLENGE COMPLETE</Text>
          )}

          <Text style={styles.challengeText}>
            Today's Daily Challenge: {data.dailyCorrect}/{data.dailyTotal}. Your turn.
          </Text>

          {data.playerLevel && (
            <Text style={styles.levelBadge}>Level {data.playerLevel}</Text>
          )}

          <Text style={styles.cta}>BlitzTap — Free on the App Store</Text>
        </View>
      </View>
    );
  }

  // Default: score/highscore variant
  const isHighScore = data.variant === 'highscore' || data.isNewHighScore;

  return (
    <View style={[styles.card, isHighScore && { borderColor: '#FFD700' }]}>
      <View style={styles.cardInner}>
        <Text style={styles.brandSmall}>BLITZTAP</Text>

        {isHighScore && (
          <Text style={styles.highScoreBanner}>NEW PERSONAL BEST</Text>
        )}

        <View style={styles.modeBadgeContainer}>
          <Text style={styles.modeBadge}>{data.modeBadge}</Text>
        </View>

        <Text style={[
          styles.heroScore,
          { color: Colors.textPrimary },
          isHighScore && { color: '#FFD700' },
        ]}>
          {data.score}
        </Text>

        {isHighScore && data.previousBest !== undefined && data.previousBest > 0 && (
          <Text style={styles.previousBest}>Previous: {data.previousBest}</Text>
        )}

        <View style={[styles.tierBadge, { borderColor: tierColor }]}>
          <Text style={[styles.tierBadgeText, { color: tierColor }]}>
            TIER {data.tier}: {TIER_LABELS[data.tier] ?? 'UNKNOWN'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.maxStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.multiplier}x</Text>
            <Text style={styles.statLabel}>Multiplier</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{data.correctTaps}</Text>
            <Text style={styles.statLabel}>Taps</Text>
          </View>
        </View>

        <Text style={styles.challengeText}>
          {getChallengeText(data.score, data.variant)}
        </Text>

        {data.playerLevel && (
          <Text style={styles.levelBadge}>Level {data.playerLevel}</Text>
        )}

        <Text style={styles.cta}>BlitzTap — Free on the App Store</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSmall: {
    position: 'absolute',
    top: 20,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 4,
    opacity: 0.5,
  },
  highScoreBanner: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modeBadgeContainer: {
    backgroundColor: Colors.accent + '33',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  modeBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 2,
  },
  heroScore: {
    fontSize: 96,
    fontWeight: '900',
    marginBottom: 8,
  },
  previousBest: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 20,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  challengeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  stampText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  levelBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 8,
  },
  cta: {
    position: 'absolute',
    bottom: 20,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  achievementSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  achievementIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  achievementLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  achievementProgress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  levelUpLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 8,
  },
});
