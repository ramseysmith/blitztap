import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../contexts/GameContext';
import { useGameEngine } from '../hooks/useGameEngine';
import { useHaptics } from '../hooks/useHaptics';
import { TimerBar } from '../components/game/TimerBar';
import { TargetDisplay } from '../components/game/TargetDisplay';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { GameBoard } from '../components/game/GameBoard';
import { CountdownReady } from '../components/game/CountdownReady';
import { GameOverOverlay } from '../components/game/GameOverOverlay';
import { Colors, PieceColor } from '../utils/colors';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useGame();
  const { startGame, startCountdown, handleTap, playAgain, timeProgress } = useGameEngine();
  const haptics = useHaptics();

  // Start countdown when screen mounts
  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  // Handle tap with haptic feedback
  const onTap = async (optionId: string) => {
    const tappedOption = state.options.find(opt => opt.id === optionId);
    if (tappedOption?.isCorrect) {
      await haptics.correctTap();
    } else {
      await haptics.wrongTap();
    }
    handleTap(optionId);
  };

  // Handle play again with haptic
  const onPlayAgain = async () => {
    if (state.isNewHighScore) {
      await haptics.newHighScore();
    }
    playAgain();
  };

  const renderContent = () => {
    switch (state.status) {
      case 'countdown':
        return <CountdownReady onComplete={startGame} />;

      case 'playing':
        return (
          <View style={styles.gameContainer}>
            <TimerBar timeProgress={timeProgress} />

            <ScoreDisplay
              score={state.score}
              streak={state.streak}
              multiplier={state.multiplier}
            />

            {state.target && (
              <TargetDisplay
                color={state.target.color as PieceColor}
                shape={state.target.shape}
              />
            )}

            <GameBoard
              options={state.options}
              gridColumns={state.gridColumns}
              onTap={onTap}
            />
          </View>
        );

      case 'gameover':
        return (
          <View style={styles.gameContainer}>
            <TimerBar timeProgress={timeProgress} />

            <ScoreDisplay
              score={state.score}
              streak={state.streak}
              multiplier={state.multiplier}
            />

            {state.target && (
              <TargetDisplay
                color={state.target.color as PieceColor}
                shape={state.target.shape}
              />
            )}

            <GameBoard
              options={state.options}
              gridColumns={state.gridColumns}
              onTap={() => {}}
            />

            <GameOverOverlay
              score={state.score}
              isNewHighScore={state.isNewHighScore}
              roundCoins={state.roundCoins}
              onPlayAgain={onPlayAgain}
            />
          </View>
        );

      default:
        return <CountdownReady onComplete={startGame} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gameContainer: {
    flex: 1,
  },
});
