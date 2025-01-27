export interface StandardMetadataField {
  id: string;
  name: string;
  key: 'artist' | 'album' | 'genre' | 'track' | 'year' | 'comment';
  showInFilter: boolean;
  showInList: boolean;
  showInSearch: boolean;
}

export interface Settings {
  recentPlayHours: number;
  monthlyPlayDays: number;
  standardMetadataFields: StandardMetadataField[];
}

export interface SettingsStore extends Settings {
  setRecentPlayHours: (hours: number) => void;
  setMonthlyPlayDays: (days: number) => void;
  toggleStandardMetadataFilter: (fieldId: string) => void;
  toggleStandardMetadataVisibility: (fieldId: string) => void;
  reorderStandardMetadataFields: (oldIndex: number, newIndex: number) => void;
}
