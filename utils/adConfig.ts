// Ad and Purchase Configuration for BlitzTap
// Replace test IDs with production IDs before release

import { Platform } from 'react-native';

// Google AdMob Test Ad Unit IDs
// These are Google's official test IDs for development
// Replace with your actual ad unit IDs before publishing
export const AD_UNIT_IDS = {
  // Interstitial ads (shown between game rounds)
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-8327362355420246/1076218724',
    android: 'ca-app-pub-3940256099942544/1033173712', // Replace with Android ad unit ID
  }) as string,

  // Rewarded ads (shown for "Continue" functionality)
  REWARDED: Platform.select({
    ios: 'ca-app-pub-8327362355420246/8683246006',
    android: 'ca-app-pub-3940256099942544/5224354917', // Replace with Android ad unit ID
  }) as string,

  // Banner ads (shown on home screen)
  BANNER: Platform.select({
    ios: 'ca-app-pub-8327362355420246/3534861103',
    android: 'ca-app-pub-3940256099942544/6300978111', // Replace with Android ad unit ID
  }) as string,
};

// RevenueCat Configuration
// Replace the test key with production keys before publishing
export const REVENUECAT_CONFIG = {
  // RevenueCat API Key (iOS)
  API_KEY: 'appl_nnxSzOZehJLQOVQQTeHgOraPrUm',

  // Entitlement identifier for "Remove Ads" purchase
  REMOVE_ADS_ENTITLEMENT: 'remove_ads',

  // Product identifier for "Remove Ads" in-app purchase
  REMOVE_ADS_PRODUCT: Platform.select({
    ios: 'com.ramseysmith.blitztap.removeads',
    android: 'com.ramseysmith.blitztap.removeads',
  }) as string,
};

// Ad display rules
export const AD_CONFIG = {
  // Minimum number of rounds before showing first interstitial
  MIN_ROUNDS_BEFORE_AD: 2,

  // Minimum seconds between interstitial ads
  MIN_SECONDS_BETWEEN_ADS: 60,

  // Retry delay for failed ad loads (in ms)
  INITIAL_RETRY_DELAY: 30000,

  // Maximum retry delay (in ms)
  MAX_RETRY_DELAY: 300000,
};
