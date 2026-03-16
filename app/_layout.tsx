import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import mobileAds from 'react-native-google-mobile-ads';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync, PermissionStatus } from 'expo-tracking-transparency';
import Purchases from 'react-native-purchases';
import { GameProvider } from '../contexts/GameContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { PurchaseProvider } from '../contexts/PurchaseContext';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { Colors } from '../utils/colors';
import AnimatedSplash from '../components/AnimatedSplash';
import { REVENUECAT_CONFIG } from '../utils/adConfig';

// Keep the native splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);

  // App is fully ready when both initialization and animation are done
  const isAppReady = isInitialized && animationComplete;

  useEffect(() => {
    async function initialize() {
      try {
        // Step A: RevenueCat (does not need ATT)
        try { Purchases.configure({ apiKey: REVENUECAT_CONFIG.API_KEY }); } catch (e) {
          console.warn('RevenueCat early configure failed:', e);
        }

        // Step B: Request ATT on iOS — delay 500ms so the app is fully in foreground
        // iOS silently ignores ATT requests that fire before the app is visible
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 500));
          const { status } = await getTrackingPermissionsAsync();
          if (status === PermissionStatus.UNDETERMINED) {
            await requestTrackingPermissionsAsync();
          }
        }

        // Step C: Initialize AdMob AFTER ATT resolves
        await mobileAds().initialize();

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing:', error);
        // Don't block app launch on initialization failure
        setIsInitialized(true);
      }
    }

    initialize();
  }, []);

  // Hide native splash screen once component mounts (animated splash takes over)
  useEffect(() => {
    async function hideNativeSplash() {
      await SplashScreen.hideAsync();
      setNativeSplashHidden(true);
    }
    hideNativeSplash();
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  // Show animated splash until both animation completes and app is initialized
  if (!isAppReady) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {nativeSplashHidden && (
          <AnimatedSplash onAnimationComplete={handleAnimationComplete} />
        )}
      </View>
    );
  }

  return (
    <AccessibilityProvider>
    <SettingsProvider>
      <PurchaseProvider>
        <GameProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: 'fade',
              }}
            />
          </View>
        </GameProvider>
      </PurchaseProvider>
    </SettingsProvider>
    </AccessibilityProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
