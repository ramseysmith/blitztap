import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GameProvider } from '../contexts/GameContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { Colors } from '../utils/colors';

export default function RootLayout() {
  return (
    <SettingsProvider>
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
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
