"use client";

import React, { createContext, useContext } from "react";
import { usePersistedState } from "@/hooks/use-persisted-state";

interface SettingsContextType {
  showPreListenButtons: boolean;
  setShowPreListenButtons: (show: boolean) => void;
  recentPlayHours: number;
  setRecentPlayHours: (hours: number) => void;
  monthlyPlayDays: number;
  setMonthlyPlayDays: (days: number) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [showPreListenButtons, setShowPreListenButtons] = usePersistedState(
    "settings.preListenEnabled",
    true
  );

  const [recentPlayHours, setRecentPlayHours] = usePersistedState(
    "settings.recentPlayHours",
    18
  );

  const [monthlyPlayDays, setMonthlyPlayDays] = usePersistedState(
    "settings.monthlyPlayDays",
    42
  );

  return (
    <SettingsContext.Provider
      value={{
        showPreListenButtons,
        setShowPreListenButtons,
        recentPlayHours,
        setRecentPlayHours,
        monthlyPlayDays,
        setMonthlyPlayDays,
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
