// Achievements screen for BlitzTap - Update 2

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../utils/colors';
import {
  Achievement,
  AchievementProgress,
  AchievementCategory,
  ACHIEVEMENTS,
  TIER_COLORS,
  CATEGORY_LABELS,
  getAchievementsByCategory,
} from '../utils/achievements';
import { useAchievementContext } from '../contexts/AchievementContext';
import { useShop } from '../contexts/ShopContext';
import { useFeedback } from '../hooks/useFeedback';

const CATEGORIES: AchievementCategory[] = ['skill', 'dedication', 'exploration', 'social'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const feedback = useFeedback();
  const { progress, claimReward, completedCount, unclaimedCount, refreshProgress } = useAchievementContext();
  const { refreshCoins } = useShop();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('skill');

  useFocusEffect(
    useCallback(() => {
      refreshProgress();
    }, [])
  );

  const totalAchievements = ACHIEVEMENTS.length;
  const completionPct = Math.round((completedCount / totalAchievements) * 100);
  const totalCoinsFromAchievements = progress
    .filter(p => p.claimed)
    .reduce((sum, p) => {
      const a = ACHIEVEMENTS.find(a => a.id === p.achievementId);
      return sum + (a?.reward ?? 0);
    }, 0);

  const categoryAchievements = getAchievementsByCategory(selectedCategory);

  const handleClaim = async (achievementId: string) => {
    feedback.onButtonPress();
    const coins = await claimReward(achievementId);
    if (coins > 0) {
      feedback.onStreakMilestone();
      await refreshCoins();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.backButton} />
      </View>

      {/* Progress Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>
          {completedCount}/{totalAchievements} Achievements
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completionPct}%` }]} />
        </View>
        <Text style={styles.summaryCoins}>
          {totalCoinsFromAchievements.toLocaleString()} coins earned from achievements
        </Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabRow}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat}
            style={[styles.tab, selectedCategory === cat && styles.tabActive]}
            onPress={() => {
              feedback.onButtonPress();
              setSelectedCategory(cat);
            }}
          >
            <Text style={[
              styles.tabText,
              selectedCategory === cat && styles.tabTextActive,
            ]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Achievement List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {categoryAchievements.map(achievement => {
          const p = progress.find(pr => pr.achievementId === achievement.id);
          return (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              progress={p}
              onClaim={() => handleClaim(achievement.id)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Achievement Card ────────────────────────────────────────────────────────

function AchievementCard({
  achievement,
  progress,
  onClaim,
}: {
  achievement: Achievement;
  progress?: AchievementProgress;
  onClaim: () => void;
}) {
  const completed = progress?.completed ?? false;
  const claimed = progress?.claimed ?? false;
  const currentValue = progress?.currentValue ?? 0;
  const tierColor = TIER_COLORS[achievement.tier];
  const isHidden = achievement.hidden && !completed;

  return (
    <View style={[
      styles.card,
      !completed && styles.cardLocked,
      completed && !claimed && { borderColor: tierColor, borderWidth: 1 },
    ]}>
      <View style={styles.cardLeft}>
        <Text style={[styles.cardIcon, !completed && styles.cardIconLocked]}>
          {achievement.icon}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, !completed && styles.cardTitleLocked]}>
            {achievement.title}
          </Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '33' }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>
              {achievement.tier.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardDesc, !completed && styles.cardDescLocked]}>
          {isHidden ? '???' : achievement.description}
        </Text>

        {/* Progress bar for incomplete */}
        {!completed && (
          <View style={styles.cardProgressContainer}>
            <View style={styles.cardProgressBg}>
              <View
                style={[
                  styles.cardProgressFill,
                  {
                    width: `${Math.min((currentValue / achievement.requirement.value) * 100, 100)}%`,
                    backgroundColor: tierColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.cardProgressText}>
              {currentValue}/{achievement.requirement.value}
            </Text>
          </View>
        )}

        {/* Claim button or completed badge */}
        {completed && !claimed && (
          <Pressable style={[styles.claimButton, { backgroundColor: tierColor }]} onPress={onClaim}>
            <Text style={styles.claimButtonText}>Claim +{achievement.reward}</Text>
          </Pressable>
        )}

        {completed && claimed && progress?.completedAt && (
          <View style={styles.completedRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.completedDate}>
              {new Date(progress.completedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  summaryCoins: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: {
    backgroundColor: Colors.accent + '33',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.accent,
  },

  list: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardIconLocked: {
    opacity: 0.5,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  cardTitleLocked: {
    color: Colors.textSecondary,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardDescLocked: {
    color: Colors.textSecondary,
    opacity: 0.7,
  },

  cardProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  cardProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },

  claimButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '700',
  },
  completedDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
