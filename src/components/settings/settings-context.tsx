"use client";

import React, { createContext, useContext, useState } from "react";

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
  const [showPreListenButtons, setShowPreListenButtons] = useState(false);
  const [recentPlayHours, setRecentPlayHours] = useState(18); // Default to 18 hours
  const [monthlyPlayDays, setMonthlyPlayDays] = useState(42); // Default to 42 days

  return (
    <SettingsContext.Provider
      value={{ 
        showPreListenButtons, 
        setShowPreListenButtons,
        recentPlayHours,
        setRecentPlayHours,
        monthlyPlayDays,
        setMonthlyPlayDays
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
