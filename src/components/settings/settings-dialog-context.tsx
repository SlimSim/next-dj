"use client";

import React, { createContext, useContext, useState } from "react";
import { SettingsDialog } from "./settings-dialog";

interface SettingsDialogContextType {
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  isOpen: boolean;
  activeTab: string | undefined;
}

const SettingsDialogContext = createContext<SettingsDialogContextType | null>(null);

export const SettingsDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | undefined>("general");

  const openSettings = (tab?: string) => {
    if (tab) {
      setActiveTab(tab);
    }
    setIsOpen(true);
  };

  const closeSettings = () => {
    setIsOpen(false);
  };

  return (
    <SettingsDialogContext.Provider
      value={{
        openSettings,
        closeSettings,
        isOpen,
        activeTab,
      }}
    >
      {children}
      <SettingsDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        defaultTab={activeTab}
        triggerButton={false}
      />
    </SettingsDialogContext.Provider>
  );
};

export const useSettingsDialog = () => {
  const context = useContext(SettingsDialogContext);
  if (!context) {
    throw new Error("useSettingsDialog must be used within a SettingsDialogProvider");
  }
  return context;
};
