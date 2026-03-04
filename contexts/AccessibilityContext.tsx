import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

interface AccessibilityContextType {
  reduceMotion: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType>({ reduceMotion: false });

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return (
    <AccessibilityContext.Provider value={{ reduceMotion }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
