"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

// Define the shape of your state
interface MainStoreState {
  volumeSliderEnabled: boolean;
  addTrackToPlaylistDialogOpen: { trackId: string } | null; // Add this state
  createNewPlaylistDialogOpen: boolean; // Add this state
}

// Define the context type
interface MainStoreContextType {
  removePlaylistDialogOpen: boolean | null; // Add this line if it's missing
  setRemovePlaylistDialogOpen: (value: boolean | null) => void; // Add this line if it's missing
  editPlaylistDialogOpen: { id: number; name: string } | null; // Add this line if it's missing
  setEditPlaylistDialogOpen: (id: number, name: string) => void; // Add this line if it's missing
  createNewPlaylistDialogOpen: boolean; // Add this line if it's missing
  state: MainStoreState;
  setVolumeSliderEnabled: (enabled: boolean) => void;
  setAddTrackToPlaylistDialogOpen: (
    dialogState: { trackId: string } | null
  ) => void; // Add this setter
  setCreateNewPlaylistDialogOpen: (open: boolean) => void; // Add this setter
}

// Define the props for the MainStoreProvider
interface MainStoreProviderProps {
  children: ReactNode;
}

// Create the context
const MainStoreContext = createContext<MainStoreContextType | undefined>(
  undefined
);

// Provider component
export const MainStoreProvider: React.FC<MainStoreProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<MainStoreState>({
    volumeSliderEnabled: true, // Default value
    addTrackToPlaylistDialogOpen: null, // Initialize this state
    createNewPlaylistDialogOpen: false, // Initialize this state
  });

  const setVolumeSliderEnabled = (enabled: boolean) => {
    setState((prevState) => ({ ...prevState, volumeSliderEnabled: enabled }));
  };

  const setAddTrackToPlaylistDialogOpen = (
    dialogState: { trackId: string } | null
  ) => {
    setState((prevState) => ({
      ...prevState,
      addTrackToPlaylistDialogOpen: dialogState,
    }));
  };

  const setCreateNewPlaylistDialogOpen = (open: boolean) => {
    setState((prevState) => ({
      ...prevState,
      createNewPlaylistDialogOpen: open,
    }));
  };

  return (
    <MainStoreContext.Provider
      value={{
        state,
        setVolumeSliderEnabled,
        setAddTrackToPlaylistDialogOpen,
        setCreateNewPlaylistDialogOpen,
      }}
    >
      {children}
    </MainStoreContext.Provider>
  );
};

// Custom hook to use the context
export const useMainStore = () => {
  const context = useContext(MainStoreContext);
  if (!context) {
    throw new Error("useMainStore must be used within a MainStoreProvider");
  }
  return context;
};

export { MainStoreContext };
