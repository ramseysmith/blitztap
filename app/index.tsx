import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { Button } from '../components/ui/Button';
import { CoinDisplay } from '../components/ui/CoinDisplay';
import { Colors } from '../utils/colors';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useGame();

  const handlePlay = () => {
    router.push('/game');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header with coins */}
      <View style={styles.header}>
        <CoinDisplay coins={state.totalCoins} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>BLITZ</Text>
        <Text style={styles.titleAccent}>TAP</Text>

        <View style={styles.highScoreContainer}>
          <Text style={styles.highScoreLabel}>HIGH SCORE</Text>
          <Text style={styles.highScoreValue}>{state.highScore}</Text>
        </View>
      </View>

      {/* Play button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <Button title="Play" onPress={handlePlay} size="large" />
      </View>

      {/* Shop teaser */}
      <View style={styles.shopTeaser}>
        <Text style={styles.shopTeaserText}>Shop Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    letterSpacing: 8,
  },
  titleAccent: {
    fontSize: 72,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: 8,
    marginTop: -10,
  },
  highScoreContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  highScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    alignItems: 'center',
  },
  shopTeaser: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shopTeaserText: {
    fontSize: 12,
    color: Colors.textSecondary,
    opacity: 0.5,
  },
});
