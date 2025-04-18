"use client";

import React, { createContext, useContext } from "react";
import { usePlayerStore } from "@/lib/store";
import { useSettings as useSettingsStore } from "@/lib/settings";
import { StandardMetadataField } from "@/lib/types/settings";

interface SettingsContextType {
  showPreListenButtons: boolean;
  setShowPreListenButtons: (show: boolean) => void;
  recentPlayHours: number;
  setRecentPlayHours: (hours: number) => void;
  monthlyPlayDays: number;
  setMonthlyPlayDays: (days: number) => void;
  standardMetadataFields: StandardMetadataField[];
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const showPreListenButtons = usePlayerStore((state) => state.showPreListenButtons);
  const setShowPreListenButtons = usePlayerStore((state) => state.setShowPreListenButtons);
  const recentPlayHours = useSettingsStore((state) => state.recentPlayHours);
  const setRecentPlayHours = useSettingsStore((state) => state.setRecentPlayHours);
  const monthlyPlayDays = useSettingsStore((state) => state.monthlyPlayDays);
  const setMonthlyPlayDays = useSettingsStore((state) => state.setMonthlyPlayDays);
  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);

  return (
    <SettingsContext.Provider
      value={{
        showPreListenButtons,
        setShowPreListenButtons,
        recentPlayHours,
        setRecentPlayHours,
        monthlyPlayDays,
        setMonthlyPlayDays,
        standardMetadataFields,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
