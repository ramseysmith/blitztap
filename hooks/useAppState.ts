import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState(onChange: (state: AppStateStatus) => void) {
  const appState = useRef(AppState.currentState);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      onChangeRef.current(nextState);
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  return appState;
}
