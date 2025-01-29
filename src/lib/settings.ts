import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, SettingsStore, StandardMetadataField, SettingsState } from './types/settings';

export const defaultStandardMetadataFields: StandardMetadataField[] = [
  { id: 'title', name: 'Title', key: 'title', showInFilter: true, showInList: true, showInSearch: true },
  { id: 'artist', name: 'Artist', key: 'artist', showInFilter: true, showInList: true, showInSearch: true },
  { id: 'album', name: 'Album', key: 'album', showInFilter: true, showInList: true, showInSearch: true },
  { id: 'genre', name: 'Genre', key: 'genre', showInFilter: true, showInList: true, showInSearch: true },
  { id: 'track', name: 'Track', key: 'track', showInFilter: true, showInList: true, showInSearch: true },
  { id: 'year', name: 'Year', key: 'year', showInFilter: true, showInList: true, showInSearch: true },
  { id: 'comment', name: 'Comment', key: 'comment', showInFilter: true, showInList: true, showInSearch: true },
];

const initialState: SettingsState = {
  recentPlayHours: 24,
  monthlyPlayDays: 30,
  standardMetadataFields: defaultStandardMetadataFields,
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
      toggleStandardMetadataSearch: (fieldId: string) =>
        set((state) => ({
          standardMetadataFields: state.standardMetadataFields.map((field) =>
            field.id === fieldId
              ? { ...field, showInSearch: !field.showInSearch }
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
