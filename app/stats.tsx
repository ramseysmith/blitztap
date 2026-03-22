import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/colors';
import { getStats, GameStats, getFavoriteShape, GameMode, ModeStats } from '../utils/stats';

type TabId = 'overall' | GameMode;

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overall', label: 'Overall', icon: '🌐' },
  { id: 'classic', label: 'Classic', icon: '⚡' },
  { id: 'timeAttack', label: 'Time Attack', icon: '⏱' },
  { id: 'zen', label: 'Zen', icon: '🧘' },
];

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, accent && styles.cardValueAccent]}>{value}</Text>
    </View>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

const TIER_NAMES: Record<number, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Chaos Mode',
};

function OverallStats({ stats }: { stats: GameStats }) {
  const avgScore =
    stats.totalGamesPlayed > 0
      ? Math.round(stats.totalScoreSum / stats.totalGamesPlayed)
      : 0;

  return (
    <>
      <View style={styles.highlightsRow}>
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.cardLabel}>HIGH SCORE</Text>
          <Text style={[styles.cardValue, styles.goldValue]}>{stats.highScore}</Text>
        </View>
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.cardLabel}>BEST STREAK</Text>
          <Text style={[styles.cardValue, styles.accentValue]}>{stats.highStreak}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard label="Games Played" value={stats.totalGamesPlayed} />
        <StatCard label="Avg Score" value={avgScore} />
        <StatCard label="Correct Taps" value={stats.totalCorrectTaps} />
        <StatCard label="Time Played" value={formatTime(Math.round(stats.totalTimePlayed))} />
        <StatCard label="Highest Tier" value={TIER_NAMES[stats.highTier] ?? '—'} />
        <StatCard label="Coins Earned" value={stats.totalCoinsEarned} accent />
        <StatCard label="Fav Shape" value={getFavoriteShape(stats.shapeTapCounts)} />
      </View>

      {stats.totalGamesPlayed > 0 && (
        <Text style={styles.since}>
          Playing since {formatDate(stats.firstPlayDate)}
        </Text>
      )}
    </>
  );
}

function ModeStatsView({ modeStats, modeName }: { modeStats: ModeStats; modeName: string }) {
  const avgScore =
    modeStats.gamesPlayed > 0
      ? Math.round(modeStats.totalScore / modeStats.gamesPlayed)
      : 0;

  if (modeStats.gamesPlayed === 0) {
    return (
      <View style={styles.emptyMode}>
        <Text style={styles.emptyModeIcon}>
          {modeName === 'Classic' ? '⚡' : modeName === 'Time Attack' ? '⏱' : '🧘'}
        </Text>
        <Text style={styles.emptyModeText}>No {modeName} games yet</Text>
        <Text style={styles.emptyModeSub}>Start playing to see your stats here</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.highlightsRow}>
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.cardLabel}>HIGH SCORE</Text>
          <Text style={[styles.cardValue, styles.goldValue]}>{modeStats.highScore}</Text>
        </View>
        <View style={[styles.card, styles.highlightCard]}>
          <Text style={styles.cardLabel}>BEST STREAK</Text>
          <Text style={[styles.cardValue, styles.accentValue]}>{modeStats.highStreak}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <StatCard label="Games Played" value={modeStats.gamesPlayed} />
        <StatCard label="Avg Score" value={avgScore} />
        <StatCard label="Time Played" value={formatTime(Math.round(modeStats.totalTimePlayed))} />
        <StatCard label="Highest Tier" value={TIER_NAMES[modeStats.highTier] ?? '—'} />
      </View>
    </>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overall');

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const MODE_NAMES: Record<GameMode, string> = {
    classic: 'Classic',
    timeAttack: 'Time Attack',
    zen: 'Zen',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Stats</Text>
      </View>

      {/* Mode tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScroll}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {stats === null ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : activeTab === 'overall' ? (
          <OverallStats stats={stats} />
        ) : (
          <ModeStatsView
            modeStats={stats[activeTab]}
            modeName={MODE_NAMES[activeTab]}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: Colors.accent,
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  tabsScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
  },
  tabActive: {
    backgroundColor: Colors.accent + '22',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelActive: { color: Colors.accent },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loading: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  highlightCard: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  cardValueAccent: {
    color: Colors.warning,
  },
  goldValue: {
    color: '#FFD700',
  },
  accentValue: {
    color: Colors.accent,
  },
  since: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  emptyMode: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyModeIcon: { fontSize: 48, marginBottom: 16 },
  emptyModeText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptyModeSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
});
