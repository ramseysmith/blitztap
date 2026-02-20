// Game Context for BlitzTap

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Target, Option } from '../utils/levelGenerator';
import { getHighScore, getTotalCoins } from '../utils/storage';

// Game State Interface
export interface GameState {
  status: 'idle' | 'countdown' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  streak: number;
  maxStreak: number;
  multiplier: number;
  tier: 1 | 2 | 3 | 4;
  timeRemaining: number;
  timePerTap: number;
  target: Target | null;
  options: Option[];
  gridColumns: number;
  totalCoins: number;
  roundCoins: number;
  roundsPlayedThisSession: number;
  isNewHighScore: boolean;
  hasUsedContinue: boolean;
}

// Initial State
const initialState: GameState = {
  status: 'idle',
  score: 0,
  highScore: 0,
  streak: 0,
  maxStreak: 0,
  multiplier: 1,
  tier: 1,
  timeRemaining: 3000,
  timePerTap: 3000,
  target: null,
  options: [],
  gridColumns: 2,
  totalCoins: 0,
  roundCoins: 0,
  roundsPlayedThisSession: 0,
  isNewHighScore: false,
  hasUsedContinue: false,
};

// Action Types
type GameAction =
  | { type: 'START_COUNTDOWN' }
  | { type: 'START_GAME'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4 } }
  | { type: 'CORRECT_TAP'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4; multiplier: number } }
  | { type: 'WRONG_TAP'; payload: { roundCoins: number; isNewHighScore: boolean } }
  | { type: 'TIMEOUT'; payload: { roundCoins: number; isNewHighScore: boolean } }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_SAVED_DATA'; payload: { highScore: number; totalCoins: number } }
  | { type: 'UPDATE_COINS'; payload: { totalCoins: number } }
  | { type: 'UPDATE_TIME'; payload: { timeRemaining: number } }
  | { type: 'CONTINUE_GAME'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4 } };

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_COUNTDOWN':
      return {
        ...state,
        status: 'countdown',
        score: 0,
        streak: 0,
        maxStreak: 0,
        multiplier: 1,
        roundCoins: 0,
        isNewHighScore: false,
        hasUsedContinue: false,
      };

    case 'START_GAME':
      return {
        ...state,
        status: 'playing',
        target: action.payload.target,
        options: action.payload.options,
        gridColumns: action.payload.gridColumns,
        timePerTap: action.payload.timePerTap * 1000,
        timeRemaining: action.payload.timePerTap * 1000,
        tier: action.payload.tier,
      };

    case 'CORRECT_TAP':
      const newStreak = state.streak + 1;
      return {
        ...state,
        score: state.score + 1,
        streak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        multiplier: action.payload.multiplier,
        target: action.payload.target,
        options: action.payload.options,
        gridColumns: action.payload.gridColumns,
        timePerTap: action.payload.timePerTap * 1000,
        timeRemaining: action.payload.timePerTap * 1000,
        tier: action.payload.tier,
      };

    case 'WRONG_TAP':
    case 'TIMEOUT':
      return {
        ...state,
        status: 'gameover',
        roundCoins: action.payload.roundCoins,
        isNewHighScore: action.payload.isNewHighScore,
        roundsPlayedThisSession: state.roundsPlayedThisSession + 1,
        highScore: action.payload.isNewHighScore ? state.score : state.highScore,
      };

    case 'RESET_GAME':
      return {
        ...state,
        status: 'idle',
        score: 0,
        streak: 0,
        maxStreak: 0,
        multiplier: 1,
        tier: 1,
        target: null,
        options: [],
        roundCoins: 0,
        isNewHighScore: false,
      };

    case 'LOAD_SAVED_DATA':
      return {
        ...state,
        highScore: action.payload.highScore,
        totalCoins: action.payload.totalCoins,
      };

    case 'UPDATE_COINS':
      return {
        ...state,
        totalCoins: action.payload.totalCoins,
      };

    case 'UPDATE_TIME':
      return {
        ...state,
        timeRemaining: action.payload.timeRemaining,
      };

    case 'CONTINUE_GAME':
      return {
        ...state,
        status: 'playing',
        hasUsedContinue: true,
        target: action.payload.target,
        options: action.payload.options,
        gridColumns: action.payload.gridColumns,
        timePerTap: action.payload.timePerTap * 1000,
        timeRemaining: action.payload.timePerTap * 1000,
        tier: action.payload.tier,
        // Keep score, streak, and multiplier intact
      };

    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load saved data on mount
  useEffect(() => {
    async function loadSavedData() {
      const [highScore, totalCoins] = await Promise.all([
        getHighScore(),
        getTotalCoins(),
      ]);
      dispatch({ type: 'LOAD_SAVED_DATA', payload: { highScore, totalCoins } });
    }
    loadSavedData();
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
