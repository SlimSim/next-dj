import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, SettingsStore } from './types/settings';

const initialState: Settings = {
  recentPlayHours: 24,
  monthlyPlayDays: 30,
  standardMetadataFields: [
    { id: 'artist', name: 'Artist', key: 'artist', showInFilter: true, showInList: true },
    { id: 'album', name: 'Album', key: 'album', showInFilter: true, showInList: true },
    { id: 'genre', name: 'Genre', key: 'genre', showInFilter: true, showInList: true },
  ],
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setRecentPlayHours: (hours: number) => set({ recentPlayHours: hours }),
      setMonthlyPlayDays: (days: number) => set({ monthlyPlayDays: days }),
      toggleStandardMetadataFilter: (fieldId: string) =>
        set((state) => ({
          standardMetadataFields: state.standardMetadataFields.map((field) =>
            field.id === fieldId
              ? { ...field, showInFilter: !field.showInFilter }
              : field
          ),
        })),
      toggleStandardMetadataVisibility: (fieldId: string) =>
        set((state) => ({
          standardMetadataFields: state.standardMetadataFields.map((field) =>
            field.id === fieldId
              ? { ...field, showInList: !field.showInList }
              : field
          ),
        })),
      reorderStandardMetadataFields: (oldIndex: number, newIndex: number) =>
        set((state) => {
          const fields = [...state.standardMetadataFields];
          const [movedField] = fields.splice(oldIndex, 1);
          fields.splice(newIndex, 0, movedField);
          return { standardMetadataFields: fields };
        }),
    }),
    {
      name: 'settings',
    }
  )
);
