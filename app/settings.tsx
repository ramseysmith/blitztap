import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../contexts/SettingsContext';
import { usePurchase } from '../contexts/PurchaseContext';
import { Colors } from '../utils/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, setSoundEnabled, setHapticsEnabled } = useSettings();
  const { isProUser, restorePurchases } = usePurchase();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSoundToggle = async (value: boolean) => {
    await setSoundEnabled(value);
  };

  const handleHapticsToggle = async (value: boolean) => {
    await setHapticsEnabled(value);
    // Play sample haptic when turning ON
    if (value) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available
      }
    }
  };

  const handleRestorePurchases = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {}

    setIsRestoring(true);
    const result = await restorePurchases();
    setIsRestoring(false);

    Alert.alert(
      result.success ? 'Success' : 'Restore Purchases',
      result.message
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Settings List */}
      <View style={styles.settingsList}>
        {/* Sound Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingDescription}>
              Play sounds for taps and game events
            </Text>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: Colors.backgroundLight, true: Colors.accent }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={Colors.backgroundLight}
          />
        </View>

        {/* Haptics Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>
              Vibration feedback for taps and events
            </Text>
          </View>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={handleHapticsToggle}
            trackColor={{ false: Colors.backgroundLight, true: Colors.accent }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={Colors.backgroundLight}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Pro Status */}
        {isProUser && (
          <View style={styles.proStatusRow}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.proStatusText}>Ads removed</Text>
          </View>
        )}

        {/* Restore Purchases */}
        <Pressable
          style={({ pressed }) => [
            styles.restoreButton,
            pressed && styles.restoreButtonPressed,
          ]}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <View style={styles.restoreLoadingContainer}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.restoreLoadingText}>Restoring...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              <Text style={styles.restoreDescription}>
                Restore previous in-app purchases
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.versionText}>BlitzTap v1.0.0</Text>
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
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: Colors.accent,
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  settingsList: {
    paddingHorizontal: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  divider: {
    height: 20,
  },
  proStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  proBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.background,
    letterSpacing: 1,
  },
  proStatusText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  restoreButton: {
    paddingVertical: 16,
  },
  restoreButtonPressed: {
    opacity: 0.7,
  },
  restoreButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 4,
  },
  restoreDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  restoreLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restoreLoadingText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.accent,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    opacity: 0.5,
  },
});
