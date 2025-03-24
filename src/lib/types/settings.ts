export type StandardMetadataField = {
  id: string;
  name: string;
  key: 'title' | 'artist' | 'album' | 'genre' | 'track' | 'year' | 'comment';
  showInFilter: boolean;
  showInList: boolean;
  showInSearch: boolean;
  showInFooter: boolean;
};

export interface SettingsState {
  recentPlayHours: number;
  monthlyPlayDays: number;
  standardMetadataFields: StandardMetadataField[];
  practiceMode: boolean;
}

export interface SettingsActions {
  setRecentPlayHours: (hours: number) => void;
  setMonthlyPlayDays: (days: number) => void;
  toggleStandardMetadataFilter: (fieldId: string) => void;
  toggleStandardMetadataVisibility: (fieldId: string) => void;
  toggleStandardMetadataSearch: (fieldId: string) => void;
  toggleStandardMetadataFooter: (fieldId: string) => void;
  reorderStandardMetadataFields: (oldIndex: number, newIndex: number) => void;
  setPracticeMode: (enabled: boolean) => void;
}

export type SettingsSlice = SettingsState & SettingsActions;
