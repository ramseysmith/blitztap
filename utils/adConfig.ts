// Ad and Purchase Configuration for BlitzTap

import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

// Production ad unit IDs
const PRODUCTION_AD_UNIT_IDS = {
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-8327362355420246/1076218724',
    android: 'ca-app-pub-8327362355420246/REPLACE_ANDROID_INTERSTITIAL',
  }) as string,
  REWARDED: Platform.select({
    ios: 'ca-app-pub-8327362355420246/8683246006',
    android: 'ca-app-pub-8327362355420246/REPLACE_ANDROID_REWARDED',
  }) as string,
  BANNER: Platform.select({
    ios: 'ca-app-pub-8327362355420246/3534861103',
    android: 'ca-app-pub-8327362355420246/REPLACE_ANDROID_BANNER',
  }) as string,
};

// Use test ads in dev builds AND TestFlight/internal preview builds
const isTestBuild =
  __DEV__ ||
  process.env.APP_VARIANT === 'development' ||
  process.env.APP_VARIANT === 'preview';

export const AD_UNIT_IDS = isTestBuild
  ? {
      INTERSTITIAL: TestIds.INTERSTITIAL,
      REWARDED: TestIds.REWARDED,
      BANNER: TestIds.BANNER,
    }
  : PRODUCTION_AD_UNIT_IDS;

// RevenueCat Configuration
// Replace the test key with production keys before publishing
export const REVENUECAT_CONFIG = {
  // RevenueCat API Key (iOS)
  API_KEY: 'appl_nnxSzOZehJLQOVQQTeHgOraPrUm',

  // Entitlement identifier for "Remove Ads" purchase
  REMOVE_ADS_ENTITLEMENT: 'blitztap_no_ads',

  // Product identifier for "Remove Ads" in-app purchase
  REMOVE_ADS_PRODUCT: Platform.select({
    ios: 'blitztap_premium',
    android: 'blitztap_premium',
  }) as string,
};

// Registered test devices — always receive test ads regardless of environment
export const TEST_DEVICE_IDS = [
  'ACE862E9-099A-4B0B-A553-7D075641C3CF', // Ramsey's test device
];

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
