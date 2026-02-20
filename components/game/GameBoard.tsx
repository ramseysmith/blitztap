import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { ShapeRenderer } from './ShapeRenderer';
import { RippleEffect } from './RippleEffect';
import { Colors, PieceColor } from '../../utils/colors';
import { ShapeType, Option } from '../../utils/levelGenerator';
import { SPRING_CONFIG } from '../../hooks/useGameAnimations';

interface GameBoardProps {
  options: Option[];
  gridColumns: number;
  onTap: (optionId: string) => void;
  gridDimOpacity?: SharedValue<number>;
  correctOptionId?: string | null;
  wrongOptionId?: string | null;
  showCorrectReveal?: boolean;
  disabled?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 20;
const ITEM_GAP = 12;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GridOptionProps {
  option: Option;
  size: number;
  shapeSize: number;
  onTap: (id: string) => void;
  isCorrectTap: boolean;
  isWrongTap: boolean;
  showCorrectReveal: boolean;
  disabled: boolean;
  gridDimOpacity?: SharedValue<number>;
}

function GridOption({
  option,
  size,
  shapeSize,
  onTap,
  isCorrectTap,
  isWrongTap,
  showCorrectReveal,
  disabled,
  gridDimOpacity,
}: GridOptionProps) {
  const pressScale = useSharedValue(1);
  const optionScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const flashColor = useSharedValue(0); // 0 = white, 1 = red
  const shakeX = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const [rippleTrigger, setRippleTrigger] = useState(0);

  // Handle correct tap animation
  useEffect(() => {
    if (isCorrectTap) {
      // Pop animation
      optionScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, SPRING_CONFIG)
      );
      // White flash
      flashColor.value = 0;
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 50 }),
        withTiming(0, { duration: 150 })
      );
      // Ripple
      setRippleTrigger(prev => prev + 1);
    }
  }, [isCorrectTap, optionScale, flashOpacity, flashColor]);

  // Handle wrong tap animation
  useEffect(() => {
    if (isWrongTap) {
      // Red flash
      flashColor.value = 1;
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 75 }),
        withTiming(0.3, { duration: 75 }),
        withTiming(0.8, { duration: 75 }),
        withTiming(0, { duration: 150 })
      );
      // Shake
      shakeX.value = withSequence(
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isWrongTap, flashOpacity, flashColor, shakeX]);

  // Handle correct reveal (after wrong tap or timeout)
  useEffect(() => {
    if (showCorrectReveal && option.isCorrect) {
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.5, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(0.5, { duration: 200 })
      );
    } else {
      glowOpacity.value = 0;
    }
  }, [showCorrectReveal, option.isCorrect, glowOpacity]);

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      pressScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
    }
  }, [pressScale, disabled]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING_CONFIG);
  }, [pressScale]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onTap(option.id);
    }
  }, [disabled, onTap, option.id]);

  const containerStyle = useAnimatedStyle(() => {
    'worklet';
    const dimOpacity = gridDimOpacity?.value ?? 1;
    return {
      transform: [
        { scale: pressScale.value * optionScale.value },
        { translateX: shakeX.value },
      ],
      opacity: dimOpacity,
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: flashOpacity.value,
      backgroundColor: flashColor.value === 0 ? '#FFFFFF' : Colors.error,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: glowOpacity.value,
    };
  });

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.option,
        { width: size, height: size },
        containerStyle,
      ]}
    >
      <ShapeRenderer
        shape={option.shape as ShapeType}
        color={option.color as PieceColor}
        size={shapeSize}
      />

      {/* White/Red flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} />

      {/* Green glow for correct reveal */}
      {option.isCorrect && (
        <Animated.View style={[styles.correctGlow, glowStyle]} />
      )}

      {/* Ripple effect */}
      <RippleEffect trigger={rippleTrigger} size={size} />
    </AnimatedPressable>
  );
}

export function GameBoard({
  options,
  gridColumns,
  onTap,
  gridDimOpacity,
  correctOptionId,
  wrongOptionId,
  showCorrectReveal = false,
  disabled = false,
}: GameBoardProps) {
  const boardWidth = SCREEN_WIDTH - BOARD_PADDING * 2;
  const totalGapWidth = ITEM_GAP * (gridColumns - 1);
  const itemSize = (boardWidth - totalGapWidth) / gridColumns;
  const shapeSize = itemSize * 0.6;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.grid,
          {
            width: boardWidth,
            gap: ITEM_GAP,
          },
        ]}
      >
        {options.map((option) => (
          <GridOption
            key={option.id}
            option={option}
            size={itemSize}
            shapeSize={shapeSize}
            onTap={onTap}
            isCorrectTap={option.id === correctOptionId}
            isWrongTap={option.id === wrongOptionId}
            showCorrectReveal={showCorrectReveal}
            disabled={disabled}
            gridDimOpacity={gridDimOpacity}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: BOARD_PADDING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  option: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  correctGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.success,
    backgroundColor: 'transparent',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
});
