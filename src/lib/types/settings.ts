export type StandardMetadataField = {
  id: string;
  name: string;
  key: 'title' | 'artist' | 'album' | 'genre' | 'track' | 'year' | 'comment';
  showInFilter: boolean;
  showInList: boolean;
  showInSearch: boolean;
};

export interface SettingsState {
  recentPlayHours: number;
  monthlyPlayDays: number;
  standardMetadataFields: StandardMetadataField[];
}

export interface SettingsActions {
  setRecentPlayHours: (hours: number) => void;
  setMonthlyPlayDays: (days: number) => void;
  toggleStandardMetadataFilter: (fieldId: string) => void;
  toggleStandardMetadataVisibility: (fieldId: string) => void;
  toggleStandardMetadataSearch: (fieldId: string) => void;
  reorderStandardMetadataFields: (oldIndex: number, newIndex: number) => void;
}

export type Settings = SettingsState & SettingsActions;
export type SettingsStore = Settings;
