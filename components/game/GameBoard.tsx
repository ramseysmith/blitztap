import React from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ShapeRenderer } from './ShapeRenderer';
import { Colors, PieceColor } from '../../utils/colors';
import { ShapeType, Option } from '../../utils/levelGenerator';

interface GameBoardProps {
  options: Option[];
  gridColumns: number;
  onTap: (optionId: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 20;
const ITEM_GAP = 12;

export function GameBoard({ options, gridColumns, onTap }: GameBoardProps) {
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
          <Pressable
            key={option.id}
            onPress={() => onTap(option.id)}
            style={({ pressed }) => [
              styles.option,
              {
                width: itemSize,
                height: itemSize,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <ShapeRenderer
              shape={option.shape as ShapeType}
              color={option.color as PieceColor}
              size={shapeSize}
            />
          </Pressable>
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
  },
});
