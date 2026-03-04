import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Dev-only FPS counter. Remove or disable before production build.
// To disable: set SHOW_FPS = false or wrap with __DEV__ guard.

export function FpsCounter() {
  const [fps, setFps] = useState(60);
  const frameTimesRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      frameTimesRef.current.push(delta);
      // Keep last 30 frames
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift();
      }

      const avgDelta =
        frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;

      const currentFps = Math.round(1000 / avgDelta);
      setFps(currentFps);

      if (currentFps < 50) {
        console.warn(`[FPS] Low frame rate detected: ${currentFps}fps (avg delta ${avgDelta.toFixed(1)}ms)`);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const color = fps >= 55 ? '#00FF88' : fps >= 40 ? '#FFB800' : '#FF3366';

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>{fps} fps</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
});
