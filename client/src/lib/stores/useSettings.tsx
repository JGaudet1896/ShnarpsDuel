import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameSettings {
  // Money & Stakes
  moneyPerPoint: number;
  moneyPerPunt: number;

  // Game Rules
  startingScore: number;
  winningScore: number;
  eliminationScore: number;

  // Multiplayer
  turnTimeLimit: number; // in seconds, 0 = no limit
  autoPlayDisconnected: boolean;

  // Audio
  soundEnabled: boolean;
  musicEnabled: boolean;
}

interface SettingsState extends GameSettings {
  resetToDefaults: () => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
}

const defaultSettings: GameSettings = {
  moneyPerPoint: 0.25,
  moneyPerPunt: 1.00,
  startingScore: 16,
  winningScore: 0,
  eliminationScore: 32,
  turnTimeLimit: 30, // 30 seconds per turn
  autoPlayDisconnected: true,
  soundEnabled: true,
  musicEnabled: true
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      resetToDefaults: () => set(defaultSettings),

      updateSettings: (newSettings: Partial<GameSettings>) =>
        set((state) => ({ ...state, ...newSettings }))
    }),
    {
      name: 'shnarps-settings'
    }
  )
);
