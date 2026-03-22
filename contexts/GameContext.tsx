// Game Context for BlitzTap - Update 1 (multi-mode)

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Target, Option } from '../utils/levelGenerator';
import { getHighScore, getTotalCoins } from '../utils/storage';

export type GameMode = 'classic' | 'timeAttack' | 'zen';

// Game State Interface
export interface GameState {
  status: 'idle' | 'countdown' | 'playing' | 'gameover';
  mode: GameMode;
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
  // Time Attack fields
  masterTimeRemaining: number; // ms, 0 means N/A or expired
  masterTimePenalty: number;   // total ms penalized this round
  // Zen fields
  zenStartTime: number; // timestamp when Zen session started (0 = not started)
}

// Initial State
const initialState: GameState = {
  status: 'idle',
  mode: 'classic',
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
  masterTimeRemaining: 60000,
  masterTimePenalty: 0,
  zenStartTime: 0,
};

// Action Types
type GameAction =
  | { type: 'SET_MODE'; payload: { mode: GameMode } }
  | { type: 'START_COUNTDOWN' }
  | { type: 'START_GAME'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4 } }
  | { type: 'CORRECT_TAP'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4; multiplier: number } }
  | { type: 'WRONG_TAP'; payload: { roundCoins: number; isNewHighScore: boolean } }
  | { type: 'WRONG_TAP_CONTINUE'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4; masterTimeRemaining?: number; masterTimePenalty?: number } }
  | { type: 'TIMEOUT'; payload: { roundCoins: number; isNewHighScore: boolean } }
  | { type: 'TIMEOUT_CONTINUE'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4 } }
  | { type: 'MASTER_TIMER_EXPIRED'; payload: { roundCoins: number; isNewHighScore: boolean } }
  | { type: 'UPDATE_MASTER_TIMER'; payload: { masterTimeRemaining: number } }
  | { type: 'ZEN_QUIT'; payload: { roundCoins: number } }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_SAVED_DATA'; payload: { highScore: number; totalCoins: number } }
  | { type: 'UPDATE_COINS'; payload: { totalCoins: number } }
  | { type: 'UPDATE_TIME'; payload: { timeRemaining: number } }
  | { type: 'CONTINUE_GAME'; payload: { target: Target; options: Option[]; gridColumns: number; timePerTap: number; tier: 1 | 2 | 3 | 4 } };

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload.mode };

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
        masterTimeRemaining: 60000,
        masterTimePenalty: 0,
        zenStartTime: 0,
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
        zenStartTime: state.mode === 'zen' ? Date.now() : 0,
      };

    case 'CORRECT_TAP': {
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
    }

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

    case 'WRONG_TAP_CONTINUE': {
      // Flash and continue — streak resets, masterTimer penalized (Time Attack)
      return {
        ...state,
        streak: 0,
        multiplier: 1,
        target: action.payload.target,
        options: action.payload.options,
        gridColumns: action.payload.gridColumns,
        timePerTap: action.payload.timePerTap * 1000,
        timeRemaining: action.payload.timePerTap * 1000,
        tier: action.payload.tier,
        masterTimeRemaining: action.payload.masterTimeRemaining ?? state.masterTimeRemaining,
        masterTimePenalty: action.payload.masterTimePenalty ?? state.masterTimePenalty,
      };
    }

    case 'TIMEOUT_CONTINUE': {
      // Time Attack: individual tap timed out, just refresh round (no streak reset)
      return {
        ...state,
        target: action.payload.target,
        options: action.payload.options,
        gridColumns: action.payload.gridColumns,
        timePerTap: action.payload.timePerTap * 1000,
        timeRemaining: action.payload.timePerTap * 1000,
        tier: action.payload.tier,
      };
    }

    case 'MASTER_TIMER_EXPIRED':
      return {
        ...state,
        status: 'gameover',
        roundCoins: action.payload.roundCoins,
        isNewHighScore: action.payload.isNewHighScore,
        masterTimeRemaining: 0,
        roundsPlayedThisSession: state.roundsPlayedThisSession + 1,
        highScore: action.payload.isNewHighScore ? state.score : state.highScore,
      };

    case 'UPDATE_MASTER_TIMER':
      return {
        ...state,
        masterTimeRemaining: action.payload.masterTimeRemaining,
      };

    case 'ZEN_QUIT':
      return {
        ...state,
        status: 'gameover',
        roundCoins: action.payload.roundCoins,
        roundsPlayedThisSession: state.roundsPlayedThisSession + 1,
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
        masterTimeRemaining: 60000,
        masterTimePenalty: 0,
        zenStartTime: 0,
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
