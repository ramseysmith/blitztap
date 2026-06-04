// Daily return reward for BlitzTap
// Grants an escalating coin bonus the first time the player opens the app each day.

import { addCoins, getLastClaimDate, getReturnStreak, setReturnReward } from './storage';
import { getTodayDateString } from './dailyChallenge';

// Reward grows with the consecutive-day streak, capped so it can't run away.
const COINS_PER_STREAK_DAY = 10;
const MAX_DAILY_REWARD = 100;

export function rewardForStreak(streak: number): number {
  return Math.min(COINS_PER_STREAK_DAY * streak, MAX_DAILY_REWARD);
}

function yesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DailyRewardResult {
  amount: number;
  streak: number;
}

// Returns the reward if one is available to claim today, otherwise null.
// Does NOT grant — call claimDailyReward to persist and add coins.
export async function getPendingDailyReward(): Promise<DailyRewardResult | null> {
  const today = getTodayDateString();
  const lastClaim = await getLastClaimDate();

  if (lastClaim === today) return null; // already claimed today

  const prevStreak = await getReturnStreak();
  const streak = lastClaim === yesterdayDateString() ? prevStreak + 1 : 1;

  return { amount: rewardForStreak(streak), streak };
}

// Grants the reward (if available), persists the new streak/date, and returns
// what was granted so the UI can celebrate it. Returns null if nothing to claim.
export async function claimDailyReward(): Promise<DailyRewardResult | null> {
  const pending = await getPendingDailyReward();
  if (!pending) return null;

  await addCoins(pending.amount);
  await setReturnReward(getTodayDateString(), pending.streak);

  return pending;
}
