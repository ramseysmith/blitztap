// Achievement definitions for BlitzTap - Update 2

export type AchievementCategory = 'skill' | 'dedication' | 'exploration' | 'social';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface AchievementRequirement {
  type:
    | 'score'
    | 'streak'
    | 'tier'
    | 'games_played'
    | 'total_taps'
    | 'daily_challenge_streak'
    | 'daily_challenge_complete'
    | 'cosmetics_owned'
    | 'mode_played'
    | 'coins_earned'
    | 'perfect_daily'
    | 'time_attack_score'
    | 'zen_score'
    | 'specific_action';
  value: number;
  mode?: 'classic' | 'timeAttack' | 'zen' | 'daily' | 'any';
  actionId?: string; // For specific_action type
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: AchievementRequirement;
  reward: number;
  tier: AchievementTier;
  hidden?: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  completed: boolean;
  completedAt?: string;
  claimed: boolean;
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  skill: 'Skill',
  dedication: 'Dedication',
  exploration: 'Exploration',
  social: 'Social',
};

// ─── 40 Achievements ─────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ─── SKILL (12) ─────────────────────────────────────────────────────────────
  {
    id: 'skill_score_25',
    title: 'Getting Warmed Up',
    description: 'Score 25 in Classic',
    icon: '🔥',
    category: 'skill',
    requirement: { type: 'score', value: 25, mode: 'classic' },
    reward: 50,
    tier: 'bronze',
  },
  {
    id: 'skill_score_50',
    title: 'Half Century',
    description: 'Score 50 in Classic',
    icon: '💪',
    category: 'skill',
    requirement: { type: 'score', value: 50, mode: 'classic' },
    reward: 100,
    tier: 'silver',
  },
  {
    id: 'skill_score_100',
    title: 'Triple Digits',
    description: 'Score 100 in Classic',
    icon: '💯',
    category: 'skill',
    requirement: { type: 'score', value: 100, mode: 'classic' },
    reward: 250,
    tier: 'gold',
  },
  {
    id: 'skill_score_200',
    title: 'Untouchable',
    description: 'Score 200 in Classic',
    icon: '👑',
    category: 'skill',
    requirement: { type: 'score', value: 200, mode: 'classic' },
    reward: 500,
    tier: 'platinum',
  },
  {
    id: 'skill_streak_10',
    title: 'On A Roll',
    description: 'Build a 10 streak in any mode',
    icon: '🎯',
    category: 'skill',
    requirement: { type: 'streak', value: 10, mode: 'any' },
    reward: 75,
    tier: 'bronze',
  },
  {
    id: 'skill_streak_20',
    title: 'Legendary Streak',
    description: 'Build a 20 streak in any mode',
    icon: '⚡',
    category: 'skill',
    requirement: { type: 'streak', value: 20, mode: 'any' },
    reward: 150,
    tier: 'silver',
  },
  {
    id: 'skill_streak_50',
    title: 'Are You Human?',
    description: 'Build a 50 streak in any mode',
    icon: '🤖',
    category: 'skill',
    requirement: { type: 'streak', value: 50, mode: 'any' },
    reward: 500,
    tier: 'platinum',
    hidden: true,
  },
  {
    id: 'skill_tier3',
    title: 'Rising Star',
    description: 'Reach Tier 3 in Classic',
    icon: '⭐',
    category: 'skill',
    requirement: { type: 'tier', value: 3, mode: 'classic' },
    reward: 75,
    tier: 'bronze',
  },
  {
    id: 'skill_tier4',
    title: 'Chaos Controller',
    description: 'Reach Tier 4 in Classic',
    icon: '🌀',
    category: 'skill',
    requirement: { type: 'tier', value: 4, mode: 'classic' },
    reward: 200,
    tier: 'silver',
  },
  {
    id: 'skill_ta_100',
    title: 'Time Lord',
    description: 'Score 100 in Time Attack',
    icon: '⏰',
    category: 'skill',
    requirement: { type: 'time_attack_score', value: 100, mode: 'timeAttack' },
    reward: 200,
    tier: 'silver',
  },
  {
    id: 'skill_ta_200',
    title: 'Clock Breaker',
    description: 'Score 200 in Time Attack',
    icon: '💥',
    category: 'skill',
    requirement: { type: 'time_attack_score', value: 200, mode: 'timeAttack' },
    reward: 400,
    tier: 'gold',
  },
  {
    id: 'skill_zen_500',
    title: 'Inner Peace',
    description: 'Score 500 in Zen Mode',
    icon: '🧘',
    category: 'skill',
    requirement: { type: 'zen_score', value: 500, mode: 'zen' },
    reward: 300,
    tier: 'gold',
  },

  // ─── DEDICATION (12) ───────────────────────────────────────────────────────
  {
    id: 'ded_games_10',
    title: 'First Steps',
    description: 'Play 10 games total',
    icon: '👣',
    category: 'dedication',
    requirement: { type: 'games_played', value: 10, mode: 'any' },
    reward: 50,
    tier: 'bronze',
  },
  {
    id: 'ded_games_50',
    title: 'Regular',
    description: 'Play 50 games total',
    icon: '📅',
    category: 'dedication',
    requirement: { type: 'games_played', value: 50, mode: 'any' },
    reward: 100,
    tier: 'bronze',
  },
  {
    id: 'ded_games_100',
    title: 'Dedicated',
    description: 'Play 100 games total',
    icon: '🏅',
    category: 'dedication',
    requirement: { type: 'games_played', value: 100, mode: 'any' },
    reward: 200,
    tier: 'silver',
  },
  {
    id: 'ded_games_500',
    title: 'Obsessed',
    description: 'Play 500 games total',
    icon: '🎮',
    category: 'dedication',
    requirement: { type: 'games_played', value: 500, mode: 'any' },
    reward: 500,
    tier: 'gold',
  },
  {
    id: 'ded_games_1000',
    title: 'No Life (Compliment)',
    description: 'Play 1000 games total',
    icon: '🏆',
    category: 'dedication',
    requirement: { type: 'games_played', value: 1000, mode: 'any' },
    reward: 1000,
    tier: 'platinum',
  },
  {
    id: 'ded_taps_1000',
    title: 'Thousand Taps',
    description: '1000 correct taps total',
    icon: '👆',
    category: 'dedication',
    requirement: { type: 'total_taps', value: 1000, mode: 'any' },
    reward: 100,
    tier: 'bronze',
  },
  {
    id: 'ded_taps_10000',
    title: 'Ten Thousand Taps',
    description: '10000 correct taps total',
    icon: '✌️',
    category: 'dedication',
    requirement: { type: 'total_taps', value: 10000, mode: 'any' },
    reward: 300,
    tier: 'silver',
  },
  {
    id: 'ded_taps_50000',
    title: 'Fifty Thousand Taps',
    description: '50000 correct taps total',
    icon: '🖐',
    category: 'dedication',
    requirement: { type: 'total_taps', value: 50000, mode: 'any' },
    reward: 750,
    tier: 'gold',
  },
  {
    id: 'ded_daily_3',
    title: 'Three Day Streak',
    description: 'Complete daily challenges 3 days in a row',
    icon: '📆',
    category: 'dedication',
    requirement: { type: 'daily_challenge_streak', value: 3, mode: 'daily' },
    reward: 100,
    tier: 'bronze',
  },
  {
    id: 'ded_daily_7',
    title: 'Weekly Warrior',
    description: 'Complete daily challenges 7 days in a row',
    icon: '🗓',
    category: 'dedication',
    requirement: { type: 'daily_challenge_streak', value: 7, mode: 'daily' },
    reward: 250,
    tier: 'silver',
  },
  {
    id: 'ded_daily_30',
    title: 'Monthly Master',
    description: 'Complete daily challenges 30 days in a row',
    icon: '📊',
    category: 'dedication',
    requirement: { type: 'daily_challenge_streak', value: 30, mode: 'daily' },
    reward: 1000,
    tier: 'platinum',
  },
  {
    id: 'ded_coins_5000',
    title: 'Coin Collector',
    description: 'Earn 5000 coins total (lifetime)',
    icon: '🪙',
    category: 'dedication',
    requirement: { type: 'coins_earned', value: 5000, mode: 'any' },
    reward: 200,
    tier: 'silver',
  },

  // ─── EXPLORATION (10) ──────────────────────────────────────────────────────
  {
    id: 'exp_first_classic',
    title: 'Classic Debut',
    description: 'Play your first Classic game',
    icon: '🎬',
    category: 'exploration',
    requirement: { type: 'games_played', value: 1, mode: 'classic' },
    reward: 25,
    tier: 'bronze',
  },
  {
    id: 'exp_first_ta',
    title: 'Time Traveler',
    description: 'Play your first Time Attack game',
    icon: '⏱',
    category: 'exploration',
    requirement: { type: 'mode_played', value: 1, mode: 'timeAttack' },
    reward: 25,
    tier: 'bronze',
  },
  {
    id: 'exp_first_zen',
    title: 'Finding Zen',
    description: 'Play your first Zen Mode game',
    icon: '🕊',
    category: 'exploration',
    requirement: { type: 'mode_played', value: 1, mode: 'zen' },
    reward: 25,
    tier: 'bronze',
  },
  {
    id: 'exp_first_daily',
    title: 'Daily Driver',
    description: 'Complete your first Daily Challenge',
    icon: '📅',
    category: 'exploration',
    requirement: { type: 'daily_challenge_complete', value: 1, mode: 'daily' },
    reward: 50,
    tier: 'bronze',
  },
  {
    id: 'exp_perfect_daily',
    title: 'Flawless',
    description: 'Complete a Daily Challenge with all 30 targets',
    icon: '💎',
    category: 'exploration',
    requirement: { type: 'perfect_daily', value: 1, mode: 'daily' },
    reward: 300,
    tier: 'gold',
  },
  {
    id: 'exp_first_purchase',
    title: 'Window Shopper',
    description: 'Buy your first cosmetic',
    icon: '🛍',
    category: 'exploration',
    requirement: { type: 'cosmetics_owned', value: 1, mode: 'any' },
    reward: 50,
    tier: 'bronze',
  },
  {
    id: 'exp_cosmetics_5',
    title: 'Collector',
    description: 'Own 5 cosmetics',
    icon: '🎨',
    category: 'exploration',
    requirement: { type: 'cosmetics_owned', value: 5, mode: 'any' },
    reward: 150,
    tier: 'silver',
  },
  {
    id: 'exp_cosmetics_10',
    title: 'Fashionista',
    description: 'Own 10 cosmetics',
    icon: '👗',
    category: 'exploration',
    requirement: { type: 'cosmetics_owned', value: 10, mode: 'any' },
    reward: 300,
    tier: 'gold',
  },
  {
    id: 'exp_cosmetics_20',
    title: 'Completionist',
    description: 'Own all 20 cosmetics',
    icon: '🌟',
    category: 'exploration',
    requirement: { type: 'cosmetics_owned', value: 20, mode: 'any' },
    reward: 750,
    tier: 'platinum',
  },
  {
    id: 'exp_all_modes',
    title: 'Well Rounded',
    description: 'Play all three game modes in one day',
    icon: '🎲',
    category: 'exploration',
    requirement: { type: 'specific_action', value: 1, mode: 'any', actionId: 'all_modes_one_day' },
    reward: 100,
    tier: 'silver',
  },

  // ─── SOCIAL (6) ─────────────────────────────────────────────────────────────
  {
    id: 'soc_first_share',
    title: 'Showing Off',
    description: 'Share your score for the first time',
    icon: '📤',
    category: 'social',
    requirement: { type: 'specific_action', value: 1, mode: 'any', actionId: 'share' },
    reward: 50,
    tier: 'bronze',
  },
  {
    id: 'soc_share_5',
    title: 'Influencer',
    description: 'Share your score 5 times',
    icon: '📣',
    category: 'social',
    requirement: { type: 'specific_action', value: 5, mode: 'any', actionId: 'share' },
    reward: 100,
    tier: 'silver',
  },
  {
    id: 'soc_first_referral',
    title: 'Recruiter',
    description: 'Have a friend install BlitzTap with your code',
    icon: '🤝',
    category: 'social',
    requirement: { type: 'specific_action', value: 1, mode: 'any', actionId: 'referral' },
    reward: 200,
    tier: 'silver',
  },
  {
    id: 'soc_referral_3',
    title: 'Squad Leader',
    description: 'Refer 3 friends',
    icon: '👥',
    category: 'social',
    requirement: { type: 'specific_action', value: 3, mode: 'any', actionId: 'referral' },
    reward: 500,
    tier: 'gold',
  },
  {
    id: 'soc_referral_10',
    title: 'Ambassador',
    description: 'Refer 10 friends',
    icon: '🌍',
    category: 'social',
    requirement: { type: 'specific_action', value: 10, mode: 'any', actionId: 'referral' },
    reward: 1500,
    tier: 'platinum',
  },
  {
    id: 'soc_rate_app',
    title: 'True Fan',
    description: 'Rate BlitzTap on the App Store',
    icon: '⭐',
    category: 'social',
    requirement: { type: 'specific_action', value: 1, mode: 'any', actionId: 'rate_app' },
    reward: 100,
    tier: 'bronze',
  },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}
