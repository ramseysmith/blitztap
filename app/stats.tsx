import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../utils/colors';
import { getStats, GameStats, getFavoriteShape } from '../utils/stats';

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
  if (seconds < 60) return `${seconds}s`;
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

const TIER_NAMES: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Chaos Mode' };

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<GameStats | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const avgScore =
    stats && stats.totalGamesPlayed > 0
      ? Math.round(stats.totalScoreSum / stats.totalGamesPlayed)
      : 0;

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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {stats === null ? (
          <Text style={styles.loading}>Loading…</Text>
        ) : (
          <>
            {/* Highlights row */}
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

            {/* Grid of stat cards */}
            <View style={styles.grid}>
              <StatCard label="Games Played" value={stats.totalGamesPlayed} />
              <StatCard label="Avg Score" value={avgScore} />
              <StatCard label="Correct Taps" value={stats.totalCorrectTaps} />
              <StatCard label="Time Played" value={formatTime(Math.round(stats.totalTimePlayed))} />
              <StatCard label="Highest Tier" value={TIER_NAMES[stats.highTier] ?? '—'} />
              <StatCard label="Coins Earned" value={stats.totalCoinsEarned} accent />
              <StatCard label="Fav Shape" value={getFavoriteShape(stats.shapeTapCounts)} />
            </View>

            {/* Footer */}
            {stats.totalGamesPlayed > 0 && (
              <Text style={styles.since}>
                Playing since {formatDate(stats.firstPlayDate)}
              </Text>
            )}
          </>
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
    marginBottom: 24,
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
});
