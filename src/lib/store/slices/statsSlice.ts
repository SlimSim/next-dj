import { StateCreator } from 'zustand';

export interface StatsState {
  recentPlayHours: number;
  monthlyPlayDays: number;
  hasShownPreListenWarning: boolean;
}

export interface StatsActions {
  setRecentPlayHours: (hours: number) => void;
  setMonthlyPlayDays: (days: number) => void;
  setHasShownPreListenWarning: (shown: boolean) => void;
}

export type StatsSlice = StatsState & StatsActions;

const initialStatsState: StatsState = {
  recentPlayHours: 18,
  monthlyPlayDays: 42,
  hasShownPreListenWarning: false,
};

export const createStatsSlice: StateCreator<StatsSlice> = (set) => ({
  ...initialStatsState,
  setRecentPlayHours: (hours) => set({ recentPlayHours: hours }),
  setMonthlyPlayDays: (days) => set({ monthlyPlayDays: days }),
  setHasShownPreListenWarning: (shown) => set({ hasShownPreListenWarning: shown }),
});
