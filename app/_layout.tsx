import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { GameProvider } from '../contexts/GameContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { PurchaseProvider } from '../contexts/PurchaseContext';
import { Colors } from '../utils/colors';
import AnimatedSplash from '../components/AnimatedSplash';

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
        // Request ATT consent on iOS 14+
        if (Platform.OS === 'ios') {
          const consentInfo = await AdsConsent.requestInfoUpdate();

          if (
            consentInfo.status === AdsConsentStatus.REQUIRED ||
            consentInfo.status === AdsConsentStatus.UNKNOWN
          ) {
            await AdsConsent.showForm();
          }
        }

        // Initialize AdMob SDK
        await mobileAds().initialize();

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing ads:', error);
        // Don't block app launch on ad initialization failure
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
