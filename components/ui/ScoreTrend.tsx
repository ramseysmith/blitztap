import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Colors } from '../../utils/colors';

const CHART_HEIGHT = 96;
const BAR_GAP = 4;
const MIN_GAMES_FOR_TREND = 6;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Compares the newer half of the history against the older half (max 10 games each).
function getTrend(scores: number[]): { recentAvg: number; change: number; window: number } | null {
  if (scores.length < MIN_GAMES_FOR_TREND) return null;
  const window = Math.min(10, Math.floor(scores.length / 2));
  const recent = scores.slice(-window);
  const previous = scores.slice(-window * 2, -window);
  const recentAvg = average(recent);
  const previousAvg = average(previous);
  const change = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
  return { recentAvg, change, window };
}

export function ScoreTrend({ scores }: { scores: number[] }) {
  const [width, setWidth] = useState(0);

  if (scores.length === 0) return null;

  const max = Math.max(...scores, 1);
  const best = Math.max(...scores);
  const avg = average(scores);
  const trend = getTrend(scores);

  const barWidth = width > 0 ? Math.max(2, (width - BAR_GAP * (scores.length - 1)) / scores.length) : 0;
  const avgY = CHART_HEIGHT - (avg / max) * CHART_HEIGHT;

  let trendText = `Play ${MIN_GAMES_FOR_TREND - scores.length} more to see your trend`;
  let trendColor: string = Colors.textSecondary;
  if (trend) {
    const pct = Math.round(Math.abs(trend.change) * 100);
    if (pct < 3) {
      trendText = `Holding steady over your last ${trend.window} games`;
    } else if (trend.change > 0) {
      trendText = `Up ${pct}% over your last ${trend.window} games`;
      trendColor = Colors.success;
    } else {
      trendText = `Down ${pct}% over your last ${trend.window} games`;
      trendColor = Colors.warning;
    }
  }

  const accessibilitySummary =
    `Last ${scores.length} games. Latest score ${scores[scores.length - 1]}, ` +
    `best ${best}, average ${Math.round(avg)}. ${trendText}.`;

  return (
    <View style={styles.container} accessible accessibilityLabel={accessibilitySummary}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>RECENT GAMES</Text>
        <Text style={styles.meta}>last {scores.length}</Text>
      </View>

      <View
        style={styles.chart}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {scores.map((score, i) => {
              const h = Math.max(3, (score / max) * CHART_HEIGHT);
              const isLatest = i === scores.length - 1;
              const fill = score === best ? '#FFD700' : isLatest ? Colors.accent : Colors.accent + '55';
              return (
                <Rect
                  key={i}
                  x={i * (barWidth + BAR_GAP)}
                  y={CHART_HEIGHT - h}
                  width={barWidth}
                  height={h}
                  rx={Math.min(3, barWidth / 2)}
                  fill={fill}
                />
              );
            })}
            <Line
              x1={0}
              x2={width}
              y1={avgY}
              y2={avgY}
              stroke={Colors.textSecondary}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.6}
            />
          </Svg>
        )}
      </View>

      <Text style={[styles.trend, { color: trendColor }]}>{trendText}</Text>
      <Text style={styles.legend}>Gold is your best, dashed line is your average</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  meta: {
    fontSize: 11,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  chart: {
    height: CHART_HEIGHT,
    width: '100%',
  },
  trend: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
});
