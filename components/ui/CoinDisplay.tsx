import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../utils/colors';

interface CoinDisplayProps {
  coins: number;
  size?: 'small' | 'large';
}

export function CoinDisplay({ coins, size = 'small' }: CoinDisplayProps) {
  const isLarge = size === 'large';

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <Text style={[styles.coinIcon, isLarge && styles.coinIconLarge]}>🪙</Text>
      <Text style={[styles.coinValue, isLarge && styles.coinValueLarge]}>
        {coins.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  containerLarge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 10,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinIconLarge: {
    fontSize: 28,
  },
  coinValue: {
    color: Colors.warning,
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  coinValueLarge: {
    fontSize: 28,
  },
});
