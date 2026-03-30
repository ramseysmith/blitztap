// Referral system for BlitzTap - Update 2 (Option A: serverless)

import AsyncStorage from '@react-native-async-storage/async-storage';

const REFERRAL_CODE_KEY = 'blitztap_referral_code';
const REFERRED_BY_KEY = 'blitztap_referred_by';
const SHARE_COUNT_KEY = 'blitztap_referral_share_count';
const SHARE_COINS_KEY = 'blitztap_referral_share_coins';

const MAX_SHARE_BONUS_COUNT = 10;
const SHARE_BONUS_COINS = 50;
const REFERRAL_BONUS_COINS = 250;

// ─── Code Generation ─────────────────────────────────────────────────────────

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/1/O/0
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return timestamp + random;
}

// ─── Get or create referral code ─────────────────────────────────────────────

export async function getReferralCode(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (existing) return existing;
    const code = generateReferralCode();
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
    return code;
  } catch {
    const code = generateReferralCode();
    try { await AsyncStorage.setItem(REFERRAL_CODE_KEY, code); } catch {}
    return code;
  }
}

// ─── Referral redemption ─────────────────────────────────────────────────────

export async function getReferredBy(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REFERRED_BY_KEY);
  } catch {
    return null;
  }
}

export async function hasRedeemedReferral(): Promise<boolean> {
  const referredBy = await getReferredBy();
  return referredBy !== null;
}

export async function redeemReferralCode(code: string): Promise<{ success: boolean; message: string; coins: number }> {
  // Validate
  if (!code || code.length !== 6) {
    return { success: false, message: 'Invalid code. Codes are 6 characters.', coins: 0 };
  }

  const myCode = await getReferralCode();
  if (code.toUpperCase() === myCode) {
    return { success: false, message: 'You cannot use your own referral code.', coins: 0 };
  }

  const already = await hasRedeemedReferral();
  if (already) {
    return { success: false, message: 'You have already redeemed a referral code.', coins: 0 };
  }

  try {
    await AsyncStorage.setItem(REFERRED_BY_KEY, code.toUpperCase());
    return { success: true, message: `Code redeemed! ${REFERRAL_BONUS_COINS} bonus coins added!`, coins: REFERRAL_BONUS_COINS };
  } catch {
    return { success: false, message: 'Failed to redeem code. Please try again.', coins: 0 };
  }
}

// ─── Share tracking (referrer gets coins for sharing) ────────────────────────

export async function getShareCount(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(SHARE_COUNT_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getShareCoinsEarned(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(SHARE_COINS_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export async function recordReferralShare(): Promise<{ coins: number; totalShares: number }> {
  const count = await getShareCount();
  const newCount = count + 1;
  await AsyncStorage.setItem(SHARE_COUNT_KEY, newCount.toString());

  let coins = 0;
  if (count < MAX_SHARE_BONUS_COUNT) {
    coins = SHARE_BONUS_COINS;
    const totalCoins = await getShareCoinsEarned();
    await AsyncStorage.setItem(SHARE_COINS_KEY, (totalCoins + coins).toString());
  }

  return { coins, totalShares: newCount };
}

export { REFERRAL_BONUS_COINS, SHARE_BONUS_COINS, MAX_SHARE_BONUS_COUNT };
