import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import { GameProvider } from '../contexts/GameContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { PurchaseProvider } from '../contexts/PurchaseContext';
import { Colors } from '../utils/colors';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

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

        setIsReady(true);
      } catch (error) {
        console.error('Error initializing ads:', error);
        // Don't block app launch on ad initialization failure
        setIsReady(true);
      }
    }

    initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
});
