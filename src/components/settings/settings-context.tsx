"use client";

import React, { createContext, useContext } from "react";
import { usePlayerStore } from "@/lib/store";

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
  const showPreListenButtons = usePlayerStore((state) => state.showPreListenButtons);
  const setShowPreListenButtons = usePlayerStore((state) => state.setShowPreListenButtons);
  const recentPlayHours = usePlayerStore((state) => state.recentPlayHours);
  const setRecentPlayHours = usePlayerStore((state) => state.setRecentPlayHours);
  const monthlyPlayDays = usePlayerStore((state) => state.monthlyPlayDays);
  const setMonthlyPlayDays = usePlayerStore((state) => state.setMonthlyPlayDays);

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
