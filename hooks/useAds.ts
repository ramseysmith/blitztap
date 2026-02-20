// Ads hook for BlitzTap
// Handles interstitial and rewarded ads via Google AdMob

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { usePurchase } from '../contexts/PurchaseContext';
import { AD_UNIT_IDS, AD_CONFIG } from '../utils/adConfig';

// Create ad instances outside component to persist across renders
const interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
  requestNonPersonalizedAdsOnly: true,
});

const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED, {
  requestNonPersonalizedAdsOnly: true,
});

export function useAds() {
  const { isProUser } = usePurchase();

  // Ad load states
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);
  const [rewardedLoaded, setRewardedLoaded] = useState(false);

  // Tracking for frequency capping
  const lastAdShownTimestamp = useRef<number>(0);
  const roundsSinceLastAd = useRef<number>(0);

  // Retry tracking with exponential backoff
  const interstitialRetryCount = useRef<number>(0);
  const rewardedRetryCount = useRef<number>(0);
  const interstitialRetryTimeout = useRef<NodeJS.Timeout | null>(null);
  const rewardedRetryTimeout = useRef<NodeJS.Timeout | null>(null);

  // Promise resolvers for showing ads
  const interstitialResolve = useRef<(() => void) | null>(null);
  const rewardedResolve = useRef<((rewarded: boolean) => void) | null>(null);

  // Calculate retry delay with exponential backoff
  const getRetryDelay = (retryCount: number): number => {
    const delay = AD_CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    return Math.min(delay, AD_CONFIG.MAX_RETRY_DELAY);
  };

  // Load interstitial ad
  const loadInterstitial = useCallback(() => {
    if (isProUser) return;

    try {
      interstitialAd.load();
    } catch (error) {
      console.error('Error loading interstitial:', error);
    }
  }, [isProUser]);

  // Load rewarded ad
  const loadRewarded = useCallback(() => {
    try {
      rewardedAd.load();
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
    }
  }, []);

  // Set up ad event listeners
  useEffect(() => {
    // Interstitial event listeners
    const interstitialLoadedListener = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setInterstitialLoaded(true);
        interstitialRetryCount.current = 0;
      }
    );

    const interstitialErrorListener = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        console.error('Interstitial ad error:', error);
        setInterstitialLoaded(false);

        // Retry with exponential backoff
        if (!isProUser) {
          const delay = getRetryDelay(interstitialRetryCount.current);
          interstitialRetryCount.current++;

          if (interstitialRetryTimeout.current) {
            clearTimeout(interstitialRetryTimeout.current);
          }

          interstitialRetryTimeout.current = setTimeout(() => {
            loadInterstitial();
          }, delay);
        }
      }
    );

    const interstitialClosedListener = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setInterstitialLoaded(false);
        lastAdShownTimestamp.current = Date.now();
        roundsSinceLastAd.current = 0;

        // Resolve the promise
        if (interstitialResolve.current) {
          interstitialResolve.current();
          interstitialResolve.current = null;
        }

        // Preload next ad
        loadInterstitial();
      }
    );

    // Rewarded ad event listeners
    const rewardedLoadedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setRewardedLoaded(true);
        rewardedRetryCount.current = 0;
      }
    );

    const rewardedErrorListener = rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        console.error('Rewarded ad error:', error);
        setRewardedLoaded(false);

        // Resolve with false if we're waiting
        if (rewardedResolve.current) {
          rewardedResolve.current(false);
          rewardedResolve.current = null;
        }

        // Retry with exponential backoff
        const delay = getRetryDelay(rewardedRetryCount.current);
        rewardedRetryCount.current++;

        if (rewardedRetryTimeout.current) {
          clearTimeout(rewardedRetryTimeout.current);
        }

        rewardedRetryTimeout.current = setTimeout(() => {
          loadRewarded();
        }, delay);
      }
    );

    const rewardedEarnedListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        // User earned the reward by watching the ad
        if (rewardedResolve.current) {
          rewardedResolve.current(true);
          rewardedResolve.current = null;
        }
      }
    );

    const rewardedClosedListener = rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setRewardedLoaded(false);

        // If promise hasn't been resolved yet (user closed early), resolve with false
        if (rewardedResolve.current) {
          rewardedResolve.current(false);
          rewardedResolve.current = null;
        }

        // Preload next ad
        loadRewarded();
      }
    );

    // Initial load
    loadInterstitial();
    loadRewarded();

    // Cleanup
    return () => {
      interstitialLoadedListener();
      interstitialErrorListener();
      interstitialClosedListener();
      rewardedLoadedListener();
      rewardedErrorListener();
      rewardedEarnedListener();
      rewardedClosedListener();

      if (interstitialRetryTimeout.current) {
        clearTimeout(interstitialRetryTimeout.current);
      }
      if (rewardedRetryTimeout.current) {
        clearTimeout(rewardedRetryTimeout.current);
      }
    };
  }, [isProUser, loadInterstitial, loadRewarded]);

  // Check if we should show an interstitial ad
  const shouldShowInterstitial = useCallback(
    (roundsPlayedThisSession: number): boolean => {
      // Pro users never see interstitials
      if (isProUser) return false;

      // Ad must be loaded
      if (!interstitialLoaded) return false;

      // Skip first MIN_ROUNDS_BEFORE_AD rounds of each session
      if (roundsPlayedThisSession <= AD_CONFIG.MIN_ROUNDS_BEFORE_AD) return false;

      // Check minimum time between ads
      const timeSinceLastAd = Date.now() - lastAdShownTimestamp.current;
      if (
        lastAdShownTimestamp.current > 0 &&
        timeSinceLastAd < AD_CONFIG.MIN_SECONDS_BETWEEN_ADS * 1000
      ) {
        return false;
      }

      return true;
    },
    [isProUser, interstitialLoaded]
  );

  // Show interstitial ad
  const showInterstitial = useCallback(async (): Promise<void> => {
    if (!interstitialLoaded) {
      return;
    }

    return new Promise((resolve) => {
      interstitialResolve.current = resolve;

      try {
        interstitialAd.show();
      } catch (error) {
        console.error('Error showing interstitial:', error);
        interstitialResolve.current = null;
        resolve();
      }
    });
  }, [interstitialLoaded]);

  // Show rewarded ad
  const showRewarded = useCallback(async (): Promise<boolean> => {
    if (!rewardedLoaded) {
      return false;
    }

    return new Promise((resolve) => {
      rewardedResolve.current = resolve;

      try {
        rewardedAd.show();
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        rewardedResolve.current = null;
        resolve(false);
      }
    });
  }, [rewardedLoaded]);

  // Preload all ads
  const preloadAll = useCallback(() => {
    if (!interstitialLoaded && !isProUser) {
      loadInterstitial();
    }
    if (!rewardedLoaded) {
      loadRewarded();
    }
  }, [interstitialLoaded, rewardedLoaded, isProUser, loadInterstitial, loadRewarded]);

  return {
    showInterstitial,
    showRewarded,
    shouldShowInterstitial,
    preloadAll,
    isInterstitialReady: interstitialLoaded && !isProUser,
    isRewardedReady: rewardedLoaded,
  };
}
