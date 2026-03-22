import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export interface TapEvent {
  id: number;
  x: number;
  y: number;
}

interface TapEffectRendererProps {
  effectId: string;
  tapEvent: TapEvent | null;
}

// ─── Individual effect components ──────────────────────────────────────────────

function SparkleEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  const STAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 }),
    );
    const t = setTimeout(onDone, 450);
    return () => clearTimeout(t);
  }, []);

  const containerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.effectContainer, { left: x - 40, top: y - 40 }, containerStyle]}>
      {STAR_ANGLES.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * 35;
        const ty = Math.sin(rad) * 35;
        return (
          <View
            key={i}
            style={[
              styles.sparkle,
              {
                left: 40 + tx - 3,
                top: 40 + ty - 3,
                backgroundColor: i % 2 === 0 ? '#FFD700' : '#FFFFFF',
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

interface ConfettiPieceProps {
  tx: number;
  ty: number;
  color: string;
}

function ConfettiPiece({ tx, ty, color }: ConfettiPieceProps) {
  const pos = useSharedValue(0);
  const op = useSharedValue(1);
  useEffect(() => {
    pos.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    op.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 200 }));
  }, []);
  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: pos.value * tx },
        { translateY: pos.value * ty },
        { rotate: `${pos.value * 180}deg` },
      ],
      opacity: op.value,
    };
  });
  return (
    <Animated.View
      style={[styles.confettiPiece, { backgroundColor: color, left: 38, top: 38 }, style]}
    />
  );
}

const CONFETTI_PIECES = Array.from({ length: 8 }, (_, i) => ({
  angle: (i / 8) * Math.PI * 2,
  color: ['#FF3366', '#00D4FF', '#FFD700', '#00FF88', '#AA44FF', '#FF8844', '#FFFFFF', '#FF6699'][i],
  tx: Math.cos((i / 8) * Math.PI * 2) * 30,
  ty: Math.sin((i / 8) * Math.PI * 2) * 30,
}));

function ConfettiEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.effectContainer, { left: x - 40, top: y - 40 }]}>
      {CONFETTI_PIECES.map((piece, i) => (
        <ConfettiPiece key={i} tx={piece.tx} ty={piece.ty} color={piece.color} />
      ))}
    </View>
  );
}

function ShockwaveEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 400 });
    const t = setTimeout(onDone, 420);
    return () => clearTimeout(t);
  }, []);

  const ringStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.shockwaveRing, { left: x - 50, top: y - 50 }, ringStyle]} />
  );
}

interface BoltProps {
  angleDeg: number;
}

function Bolt({ angleDeg }: BoltProps) {
  const len = useSharedValue(0);
  const op = useSharedValue(1);
  useEffect(() => {
    len.value = withTiming(1, { duration: 200 });
    op.value = withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 200 }));
  }, []);
  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      width: len.value * 35,
      opacity: op.value,
    };
  });
  return (
    <Animated.View
      style={[
        styles.electricBolt,
        { left: 38, top: 40, transform: [{ rotate: `${angleDeg}deg` }] },
        style,
      ]}
    />
  );
}

const BOLT_ANGLES = Array.from({ length: 6 }, (_, i) => ((i / 6) * Math.PI * 2 * 180) / Math.PI);

function ElectricEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.effectContainer, { left: x - 40, top: y - 40 }]}>
      {BOLT_ANGLES.map((angleDeg, i) => (
        <Bolt key={i} angleDeg={angleDeg} />
      ))}
    </View>
  );
}

function SmokeRingEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0.6);
  const scale2 = useSharedValue(0.1);
  const opacity2 = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withTiming(1.2, { duration: 500, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 500 });
    scale2.value = withTiming(0.8, { duration: 400, easing: Easing.out(Easing.quad) });
    opacity2.value = withTiming(0, { duration: 400 });
    const t = setTimeout(onDone, 520);
    return () => clearTimeout(t);
  }, []);

  const ringStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scale.value }], opacity: opacity.value };
  });
  const ring2Style = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scale2.value }], opacity: opacity2.value };
  });

  return (
    <>
      <Animated.View style={[styles.smokeRing, { left: x - 40, top: y - 40 }, ringStyle]} />
      <Animated.View style={[styles.smokeRing, { left: x - 30, top: y - 30 }, ring2Style]} />
    </>
  );
}

interface SparkProps {
  tx: number;
  ty: number;
  color: string;
}

function Spark({ tx, ty, color }: SparkProps) {
  const dist = useSharedValue(0);
  const op = useSharedValue(1);
  useEffect(() => {
    dist.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    op.value = withSequence(withTiming(1, { duration: 250 }), withTiming(0, { duration: 250 }));
  }, []);
  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: dist.value * tx }, { translateY: dist.value * ty }],
      opacity: op.value,
    };
  });
  return (
    <Animated.View
      style={[styles.fireworkSpark, { backgroundColor: color, left: 48, top: 48 }, style]}
    />
  );
}

// Pre-compute sparks at module level so they're stable across re-renders
const FIREWORK_SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const dist = 25 + (i % 5) * 5; // deterministic distances, no Math.random
  return {
    tx: Math.cos(angle) * dist,
    ty: Math.sin(angle) * dist,
    color: ['#FFD700', '#FF3366', '#00D4FF', '#00FF88'][i % 4],
  };
});

function FireworksEffect({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[styles.effectContainer, { left: x - 50, top: y - 50 }]}>
      <View style={[styles.fireworkCenter, { left: 47, top: 47 }]} />
      {FIREWORK_SPARKS.map((spark, i) => (
        <Spark key={i} tx={spark.tx} ty={spark.ty} color={spark.color} />
      ))}
    </View>
  );
}

// ─── Main renderer ──────────────────────────────────────────────────────────────

export function TapEffectRenderer({ effectId, tapEvent }: TapEffectRendererProps) {
  const [activeEffects, setActiveEffects] = useState<TapEvent[]>([]);

  useEffect(() => {
    if (!tapEvent || effectId === 'default') return;
    setActiveEffects(prev => [...prev, tapEvent]);
  }, [tapEvent, effectId]);

  const removeEffect = useCallback((id: number) => {
    setActiveEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  if (effectId === 'default' || activeEffects.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {activeEffects.map(effect => {
        const key = effect.id;
        const onDone = () => removeEffect(effect.id);
        switch (effectId) {
          case 'fx_sparkle':
            return <SparkleEffect key={key} x={effect.x} y={effect.y} onDone={onDone} />;
          case 'fx_confetti':
            return <ConfettiEffect key={key} x={effect.x} y={effect.y} onDone={onDone} />;
          case 'fx_electric':
            return <ElectricEffect key={key} x={effect.x} y={effect.y} onDone={onDone} />;
          case 'fx_smoke':
            return <SmokeRingEffect key={key} x={effect.x} y={effect.y} onDone={onDone} />;
          case 'fx_shockwave':
            return <ShockwaveEffect key={key} x={effect.x} y={effect.y} onDone={onDone} />;
          case 'fx_fireworks':
            return <FireworksEffect key={key} x={effect.x} y={effect.y} onDone={onDone} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  effectContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  confettiPiece: {
    position: 'absolute',
    width: 6,
    height: 4,
    borderRadius: 1,
  },
  shockwaveRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#00D4FF',
    backgroundColor: 'transparent',
  },
  electricBolt: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#88DDFF',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  smokeRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(200,200,200,0.5)',
    backgroundColor: 'transparent',
  },
  fireworkCenter: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
  fireworkSpark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
