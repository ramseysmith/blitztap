import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedback } from '../hooks/useFeedback';
import { useGameAnimations } from '../hooks/useGameAnimations';
import { GameBoard } from '../components/game/GameBoard';
import { CountdownReady } from '../components/game/CountdownReady';
import { TimerBar } from '../components/game/TimerBar';
import { TargetDisplay } from '../components/game/TargetDisplay';
import { ScoreDisplay } from '../components/game/ScoreDisplay';
import { ScreenShakeContainer, ScreenGlow } from '../components/game/ScreenEffects';
import { useShop } from '../contexts/ShopContext';
import { Colors, PieceColor } from '../utils/colors';
import {
  generateDailyRounds,
  getTodayDateString,
  getTodayResult,
  saveDailyChallengeResult,
  calculateDailyChallengeCoins,
  calculateTimeBonus,
  DAILY_TARGET_COUNT_EXPORT as DAILY_TARGET_COUNT,
  DailyRound,
} from '../utils/dailyChallenge';
import { addCoins } from '../utils/storage';

// Grace period ms
const TIMEOUT_GRACE_MS = 50;

type DailyStatus = 'loading' | 'already_played' | 'countdown' | 'playing' | 'complete' | 'failed';

function DailyHistoryView({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    import('../utils/dailyChallenge').then(m => m.getDailyChallengeHistory()).then(setHistory);
  }, []);

  return (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent Results</Text>
        <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.historyClose}>✕</Text>
        </Pressable>
      </View>
      <ScrollView>
        {history.length === 0 ? (
          <Text style={styles.historyEmpty}>No challenges yet</Text>
        ) : (
          history.map((r, i) => (
            <View key={r.date} style={styles.historyRow}>
              <Text style={styles.historyDate}>{r.date}</Text>
              <View style={styles.historyRight}>
                <Text style={styles.historyScore}>{r.score}</Text>
                {r.completed && <Text style={styles.historyStar}>⭐</Text>}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function DailyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inventory } = useShop();
  const feedback = useFeedback();
  const animations = useGameAnimations();

  const [status, setStatus] = useState<DailyStatus>('loading');
  const [rounds] = useState<DailyRound[]>(() => generateDailyRounds());
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctTaps, setCorrectTaps] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [wrongOptionId, setWrongOptionId] = useState<string | null>(null);
  const [showCorrectReveal, setShowCorrectReveal] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const gameStartTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutHandledRef = useRef(false);
  const lastTapTimeRef = useRef(0);
  const statusRef = useRef<DailyStatus>('loading');
  const currentRoundRef = useRef<DailyRound | null>(null);
  const correctTapsRef = useRef(0);
  const currentRoundIndexRef = useRef(0);

  const timeProgress = useSharedValue(1);
  const todayDate = getTodayDateString();

  // Check if already played today
  useEffect(() => {
    getTodayResult().then((result) => {
      if (result) {
        setScore(result.score);
        setCorrectTaps(result.correctTaps);
        setTimeBonus(result.timeBonus);
        setStatus('already_played');
      } else {
        setStatus('countdown');
      }
    });
  }, []);

  const currentRound = rounds[currentRoundIndex] ?? null;

  // Keep refs in sync
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { correctTapsRef.current = correctTaps; }, [correctTaps]);
  useEffect(() => { currentRoundIndexRef.current = currentRoundIndex; }, [currentRoundIndex]);

  // ─── Timer loop ────────────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    setIsTimedOut(true);
    setShowCorrectReveal(true);
    animations.animateTimeout();
    feedback.onTimeout();

    // Game over after showing answer
    setTimeout(() => {
      endChallenge(false);
    }, 1100);
  }, [animations, feedback]);

  const updateTimer = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    const elapsed = Date.now() - startTimeRef.current;
    const timePerTap = (currentRoundRef.current?.timePerTap ?? 1.8) * 1000;
    const remaining = timePerTap - elapsed;

    if (remaining <= -TIMEOUT_GRACE_MS) {
      timeProgress.value = 0;
      handleTimeout();
      return;
    }

    timeProgress.value = Math.max(0, remaining / timePerTap);
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [handleTimeout, timeProgress]);

  const startTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    startTimeRef.current = Date.now();
    timeoutHandledRef.current = false;
    timeProgress.value = 1;
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [updateTimer, timeProgress]);

  // Start timer when playing and round changes
  useEffect(() => {
    if (status === 'playing' && currentRound) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, currentRoundIndex]);

  // Track game start time
  useEffect(() => {
    if (status === 'playing' && gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
    }
  }, [status]);

  const endChallenge = useCallback(async (completed: boolean) => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    const timeTaken = gameStartTimeRef.current > 0
      ? Date.now() - gameStartTimeRef.current
      : 0;

    const finalCorrectTaps = completed ? DAILY_TARGET_COUNT : correctTapsRef.current;
    const bonus = completed ? calculateTimeBonus(finalCorrectTaps, timeTaken) : 0;
    const finalScore = finalCorrectTaps + bonus;
    const coins = calculateDailyChallengeCoins(finalCorrectTaps, completed);

    setTimeBonus(bonus);
    setScore(finalScore);
    setCoinsEarned(coins);

    await saveDailyChallengeResult({
      date: todayDate,
      score: finalScore,
      completed,
      correctTaps: finalCorrectTaps,
      timeBonus: bonus,
    });

    await addCoins(coins);

    setStatus(completed ? 'complete' : 'failed');
  }, [todayDate]);

  const onTap = useCallback((optionId: string) => {
    if (isTimedOut || statusRef.current !== 'playing') return;

    const now = Date.now();
    if (now - lastTapTimeRef.current < 100) return;
    lastTapTimeRef.current = now;

    const currentRoundNow = currentRoundRef.current;
    if (!currentRoundNow) return;

    const tappedOption = currentRoundNow.options.find(opt => opt.id === optionId);
    if (!tappedOption) return;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    if (tappedOption.isCorrect) {
      setCorrectOptionId(optionId);
      feedback.onCorrectTap();
      animations.animateCorrectTap();

      const newCorrectTaps = correctTapsRef.current + 1;
      setCorrectTaps(newCorrectTaps);
      correctTapsRef.current = newCorrectTaps;

      setTimeout(() => setCorrectOptionId(null), 200);

      const nextIndex = currentRoundIndexRef.current + 1;
      if (nextIndex >= DAILY_TARGET_COUNT) {
        // All done!
        setTimeout(() => endChallenge(true), 300);
      } else {
        setCurrentRoundIndex(nextIndex);
        timeoutHandledRef.current = false;
      }
    } else {
      setWrongOptionId(optionId);
      feedback.onWrongTap();
      animations.animateWrongTap();

      setTimeout(() => setShowCorrectReveal(true), 300);
      setTimeout(() => endChallenge(false), 1100);
    }
  }, [isTimedOut, feedback, animations, endChallenge]);

  const handleStart = useCallback(() => {
    setStatus('playing');
    gameStartTimeRef.current = 0;
    setScore(0);
    setCorrectTaps(0);
    setCurrentRoundIndex(0);
    setIsTimedOut(false);
    setShowCorrectReveal(false);
  }, []);

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      );
    }

    if (status === 'already_played') {
      return (
        <View style={styles.centered}>
          <Text style={styles.resultEmoji}>✅</Text>
          <Text style={styles.resultTitle}>Already Played Today</Text>
          <Text style={styles.resultDate}>{todayDate}</Text>
          <View style={styles.resultScoreBox}>
            <Text style={styles.resultScoreLabel}>Your Score</Text>
            <Text style={styles.resultScore}>{score}</Text>
            {correctTaps >= DAILY_TARGET_COUNT && (
              <Text style={styles.resultCompleted}>Challenge Complete! ⭐</Text>
            )}
          </View>
          <Text style={styles.comeBackText}>Come back tomorrow for a new challenge!</Text>
          <Pressable style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <Text style={styles.historyButtonText}>View History</Text>
          </Pressable>
          <Pressable style={styles.homeButton} onPress={() => router.back()}>
            <Text style={styles.homeButtonText}>← Back</Text>
          </Pressable>
        </View>
      );
    }

    if (status === 'countdown') {
      return <CountdownReady onComplete={handleStart} />;
    }

    if (status === 'complete') {
      return (
        <View style={styles.centered}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>CHALLENGE{'\n'}COMPLETE!</Text>
          <View style={styles.resultScoreBox}>
            <Text style={styles.resultScoreLabel}>Total Score</Text>
            <Text style={styles.resultScore}>{score}</Text>
            {timeBonus > 0 && (
              <Text style={styles.timeBonusText}>+{timeBonus} time bonus</Text>
            )}
          </View>
          <View style={styles.coinsEarned}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinsText}>+{coinsEarned} coins</Text>
          </View>
          <Pressable style={styles.homeButton} onPress={() => router.back()}>
            <Text style={styles.homeButtonText}>← Back to Home</Text>
          </Pressable>
        </View>
      );
    }

    if (status === 'failed') {
      return (
        <View style={styles.centered}>
          <Text style={styles.failedEmoji}>💔</Text>
          <Text style={styles.failedTitle}>Challenge Over</Text>
          <View style={styles.resultScoreBox}>
            <Text style={styles.resultScoreLabel}>Score</Text>
            <Text style={styles.resultScore}>{correctTaps}</Text>
            <Text style={styles.progressText}>{correctTaps}/{DAILY_TARGET_COUNT} targets</Text>
          </View>
          <View style={styles.coinsEarned}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinsText}>+{coinsEarned} coins</Text>
          </View>
          <Text style={styles.comeBackText}>Come back tomorrow for a new challenge!</Text>
          <Pressable style={styles.homeButton} onPress={() => router.back()}>
            <Text style={styles.homeButtonText}>← Back to Home</Text>
          </Pressable>
        </View>
      );
    }

    // Playing
    if (status === 'playing' && currentRound) {
      return (
        <ScreenShakeContainer shakeX={animations.screenShakeX}>
          <View style={styles.gameContainer}>
            {/* Daily challenge header */}
            <View style={styles.dailyHeader}>
              <Text style={styles.dailyBanner}>DAILY CHALLENGE</Text>
              <Text style={styles.progressText}>{correctTaps}/{DAILY_TARGET_COUNT}</Text>
            </View>

            <TimerBar timeProgress={timeProgress} />

            <ScoreDisplay
              score={correctTaps}
              streak={0}
              multiplier={1}
              scoreScale={animations.scoreScale}
              scoreBump={animations.scoreBump}
              multiplierScale={animations.multiplierScale}
              multiplierGlow={animations.multiplierGlow}
            />

            <TargetDisplay
              color={currentRound.target.color as PieceColor}
              shape={currentRound.target.shape}
              skinId={inventory.equippedShape}
            />

            <GameBoard
              options={currentRound.options}
              gridColumns={currentRound.gridColumns}
              onTap={onTap}
              gridDimOpacity={animations.gridDimOpacity}
              correctOptionId={correctOptionId}
              wrongOptionId={wrongOptionId}
              showCorrectReveal={showCorrectReveal}
              disabled={wrongOptionId !== null || isTimedOut}
              equippedSkinId={inventory.equippedShape}
            />

            <ScreenGlow
              opacity={animations.screenGlowOpacity}
              colorValue={animations.screenGlowColor}
            />
          </View>
        </ScreenShakeContainer>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {showHistory && (
        <DailyHistoryView onClose={() => setShowHistory(false)} />
      )}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  gameContainer: { flex: 1 },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dailyBanner: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  // Results
  resultEmoji: { fontSize: 56, marginBottom: 16 },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  resultScoreBox: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  resultScoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFD700',
    fontVariant: ['tabular-nums'],
  },
  resultCompleted: {
    fontSize: 14,
    color: Colors.success,
    marginTop: 8,
    fontWeight: '600',
  },
  timeBonusText: {
    fontSize: 14,
    color: Colors.accent,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  comeBackText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  historyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  historyButtonText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
  },
  homeButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  homeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  // Complete / Failed
  completeEmoji: { fontSize: 64, marginBottom: 12 },
  completeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.success,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 24,
  },
  failedEmoji: { fontSize: 56, marginBottom: 12 },
  failedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 24,
  },
  coinsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  coinIcon: { fontSize: 20 },
  coinsText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  // History overlay
  historyContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    zIndex: 100,
    padding: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  historyClose: {
    fontSize: 20,
    color: Colors.textSecondary,
    padding: 4,
  },
  historyEmpty: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  historyDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  historyStar: { fontSize: 16 },
});
