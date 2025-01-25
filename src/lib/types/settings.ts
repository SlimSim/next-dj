export interface Settings {
  recentPlayHours: number;
  monthlyPlayDays: number;
}

export interface SettingsStore extends Settings {
  setRecentPlayHours: (hours: number) => void;
  setMonthlyPlayDays: (days: number) => void;
}
