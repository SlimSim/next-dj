import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, SettingsStore } from './types/settings';

const initialState: Settings = {
  recentPlayHours: 18,
  monthlyPlayDays: 42,
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setRecentPlayHours: (hours: number) => set({ recentPlayHours: hours }),
      setMonthlyPlayDays: (days: number) => set({ monthlyPlayDays: days }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
