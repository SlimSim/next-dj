import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SettingsSlice, StandardMetadataField, SettingsState } from './types/settings';

export const defaultStandardMetadataFields: StandardMetadataField[] = [
  { id: 'title', name: 'Title', key: 'title', showInFilter: true, showInList: true, showInSearch: true, showInFooter: true },
  { id: 'artist', name: 'Artist', key: 'artist', showInFilter: true, showInList: true, showInSearch: true, showInFooter: true },
  { id: 'album', name: 'Album', key: 'album', showInFilter: true, showInList: true, showInSearch: true, showInFooter: false },
  { id: 'genre', name: 'Genre', key: 'genre', showInFilter: true, showInList: true, showInSearch: true, showInFooter: false },
  { id: 'track', name: 'Track', key: 'track', showInFilter: true, showInList: true, showInSearch: true, showInFooter: false },
  { id: 'year', name: 'Year', key: 'year', showInFilter: true, showInList: true, showInSearch: true, showInFooter: false },
  { id: 'comment', name: 'Comment', key: 'comment', showInFilter: true, showInList: true, showInSearch: true, showInFooter: false },
];

const initialState: SettingsState = {
  recentPlayHours: 18,
  monthlyPlayDays: 42,
  practiceMode: false,
  standardMetadataFields: defaultStandardMetadataFields,
};

export const useSettings = create<SettingsSlice>()(
  persist(
    (set) => ({
      ...initialState,
      setRecentPlayHours: (hours: number) => set({ recentPlayHours: hours }),
      setMonthlyPlayDays: (days: number) => set({ monthlyPlayDays: days }),
      setPracticeMode: (enabled: boolean) => set({ practiceMode: enabled }),
      toggleStandardMetadataFilter: (fieldId: string) =>
        set((state: SettingsState) => ({
          standardMetadataFields: state.standardMetadataFields.map((field: StandardMetadataField) =>
            field.id === fieldId
              ? { ...field, showInFilter: !field.showInFilter }
              : field
          ),
        })),
      toggleStandardMetadataVisibility: (fieldId: string) =>
        set((state: SettingsState) => ({
          standardMetadataFields: state.standardMetadataFields.map((field: StandardMetadataField) =>
            field.id === fieldId
              ? { ...field, showInList: !field.showInList }
              : field
          ),
        })),
      toggleStandardMetadataSearch: (fieldId: string) =>
        set((state: SettingsState) => ({
          standardMetadataFields: state.standardMetadataFields.map((field: StandardMetadataField) =>
            field.id === fieldId
              ? { ...field, showInSearch: !field.showInSearch }
              : field
          ),
        })),
      toggleStandardMetadataFooter: (fieldId: string) =>
        set((state: SettingsState) => ({
          standardMetadataFields: state.standardMetadataFields.map((field: StandardMetadataField) =>
            field.id === fieldId
              ? { ...field, showInFooter: !field.showInFooter }
              : field
          ),
        })),
      reorderStandardMetadataFields: (oldIndex: number, newIndex: number) =>
        set((state: SettingsState) => {
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
