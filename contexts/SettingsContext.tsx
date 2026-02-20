// Settings Context for BlitzTap

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getSettings, updateSettings, Settings } from '../utils/storage';

interface SettingsContextType {
  settings: Settings;
  isLoaded: boolean;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    hapticsEnabled: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      const saved = await getSettings();
      setSettings(saved);
      setIsLoaded(true);
    }
    loadSettings();
  }, []);

  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    const updated = await updateSettings({ soundEnabled: enabled });
    setSettings(updated);
  }, []);

  const setHapticsEnabled = useCallback(async (enabled: boolean) => {
    const updated = await updateSettings({ hapticsEnabled: enabled });
    setSettings(updated);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        setSoundEnabled,
        setHapticsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
