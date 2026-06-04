// Local notification scheduling for BlitzTap
// All notifications are scheduled on-device (no backend / push tokens needed).
// We use a single "inactivity reminder" that is rescheduled every time the app
// opens, so it only ever fires after a full day of not playing.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_IDENTIFIER = 'blitztap_daily_reminder';
const INACTIVITY_SECONDS = 24 * 60 * 60; // 24 hours

// How the app reacts to a notification while in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Returns true if we have (or were just granted) permission to post notifications.
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  if (!settings.canAskAgain) return false;

  const request = await Notifications.requestPermissionsAsync();
  return (
    request.granted ||
    request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

// Cancels any pending reminder and schedules a fresh one 24h out. Call on every
// app open so returning players keep pushing the reminder forward; it only fires
// once a full day of inactivity has elapsed.
export async function scheduleInactivityReminder(): Promise<void> {
  await ensureAndroidChannel();
  await cancelReminders();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: '🪙 Your coins are waiting!',
      body: 'Tap to claim your daily streak bonus and beat your high score.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: INACTIVITY_SECONDS,
      channelId: 'reminders',
    },
  });
}

export async function cancelReminders(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch {
    // No pending reminder to cancel — safe to ignore.
  }
}

// Requests permission (if needed) and schedules the reminder. Returns whether
// reminders are now active, so callers can reflect denied permission in the UI.
export async function enableReminders(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await scheduleInactivityReminder();
  return true;
}
