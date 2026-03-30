// Referral screen for BlitzTap - Update 2

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../utils/colors';
import {
  getReferralCode,
  getReferredBy,
  hasRedeemedReferral,
  redeemReferralCode,
  recordReferralShare,
  getShareCount,
  getShareCoinsEarned,
  MAX_SHARE_BONUS_COUNT,
  SHARE_BONUS_COINS,
  REFERRAL_BONUS_COINS,
} from '../utils/referral';
import { addCoins } from '../utils/storage';
import { useShop } from '../contexts/ShopContext';
import { useAchievementContext } from '../contexts/AchievementContext';
import { useFeedback } from '../hooks/useFeedback';

const APP_STORE_URL = 'https://apps.apple.com/app/id6759490849';

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const feedback = useFeedback();
  const { refreshCoins } = useShop();
  const { checkAfterAction } = useAchievementContext();

  const [referralCode, setReferralCode] = useState('');
  const [redeemed, setRedeemed] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [shareCount, setShareCount] = useState(0);
  const [shareCoinsEarned, setShareCoinsEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState('');

  const codeScale = useSharedValue(1);

  useEffect(() => {
    async function load() {
      const [code, already, referred, shares, shareCoins] = await Promise.all([
        getReferralCode(),
        hasRedeemedReferral(),
        getReferredBy(),
        getShareCount(),
        getShareCoinsEarned(),
      ]);
      setReferralCode(code);
      setRedeemed(already);
      setReferredBy(referred);
      setShareCount(shares);
      setShareCoinsEarned(shareCoins);
    }
    load();
  }, []);

  const handleCopy = useCallback(async () => {
    feedback.onButtonPress();
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    codeScale.value = withSequence(
      withSpring(1.1, { damping: 6 }),
      withSpring(1, { damping: 8 }),
    );
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode, feedback]);

  const handleShare = useCallback(async () => {
    feedback.onButtonPress();
    try {
      await Share.share({
        message: `I've been playing BlitzTap and it's super addicting! Use my code ${referralCode} when you sign up and we both get ${REFERRAL_BONUS_COINS} bonus coins. Download free: ${APP_STORE_URL}`,
      });

      const result = await recordReferralShare();
      setShareCount(result.totalShares);
      if (result.coins > 0) {
        await addCoins(result.coins);
        setShareCoinsEarned(prev => prev + result.coins);
        await refreshCoins();
        feedback.onStreakMilestone();
      }
      await checkAfterAction('referral');
    } catch {}
  }, [referralCode, feedback, refreshCoins, checkAfterAction]);

  const handleRedeem = useCallback(async () => {
    feedback.onButtonPress();
    if (!inputCode.trim()) return;

    const result = await redeemReferralCode(inputCode.trim().toUpperCase());
    setRedeemMessage(result.message);

    if (result.success) {
      await addCoins(result.coins);
      await refreshCoins();
      setRedeemed(true);
      setReferredBy(inputCode.trim().toUpperCase());
      feedback.onNewHighScore();
    } else {
      feedback.onWrongTap();
    }
  }, [inputCode, feedback, refreshCoins]);

  const codeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: codeScale.value }],
  }));

  const sharesRemaining = Math.max(0, MAX_SHARE_BONUS_COUNT - shareCount);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.backButton} />
      </View>

      {/* Your Code Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Referral Code</Text>

        <Pressable onPress={handleCopy}>
          <Animated.View style={[styles.codeCard, codeStyle]}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <Text style={styles.copyHint}>
              {copied ? 'Copied!' : 'Tap to copy'}
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Code</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{shareCount}</Text>
            <Text style={styles.statLabel}>Times Shared</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>
              {shareCoinsEarned}
            </Text>
            <Text style={styles.statLabel}>Coins Earned</Text>
          </View>
        </View>

        {sharesRemaining > 0 && (
          <Text style={styles.hint}>
            Share {sharesRemaining} more time{sharesRemaining !== 1 ? 's' : ''} to earn {SHARE_BONUS_COINS} coins each!
          </Text>
        )}
      </View>

      {/* Redeem Section */}
      <View style={styles.section}>
        {!redeemed ? (
          <>
            <Text style={styles.sectionTitle}>Have a referral code?</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor={Colors.textSecondary}
                value={inputCode}
                onChangeText={setInputCode}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.redeemButton, !inputCode.trim() && styles.redeemButtonDisabled]}
                onPress={handleRedeem}
                disabled={!inputCode.trim()}
              >
                <Text style={styles.redeemButtonText}>Redeem</Text>
              </Pressable>
            </View>
            {redeemMessage !== '' && (
              <Text style={[
                styles.redeemMessage,
                redeemed ? styles.redeemSuccess : styles.redeemError,
              ]}>
                {redeemMessage}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.referredSection}>
            <Text style={styles.sectionTitle}>Referral Redeemed</Text>
            <Text style={styles.referredBy}>Referred by: {referredBy}</Text>
            <Text style={styles.hint}>+{REFERRAL_BONUS_COINS} bonus coins received</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Share your code with friends. When they enter it, they get {REFERRAL_BONUS_COINS} bonus coins instantly.
          You earn {SHARE_BONUS_COINS} coins each time you share (up to {MAX_SHARE_BONUS_COUNT} times).
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },

  codeCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.accent,
    letterSpacing: 8,
  },
  copyHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },

  shareButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  redeemButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  redeemButtonDisabled: {
    opacity: 0.4,
  },
  redeemButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  redeemMessage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  redeemSuccess: {
    color: Colors.success,
  },
  redeemError: {
    color: Colors.error,
  },
  referredSection: {
    alignItems: 'center',
  },
  referredBy: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
