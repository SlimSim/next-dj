"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

// Define the shape of your state
interface MainStoreState {
  volumeSliderEnabled: boolean;
  addTrackToPlaylistDialogOpen: { trackId: string } | null;
  createNewPlaylistDialogOpen: boolean;
  removePlaylistDialogOpen: boolean | null;
  editPlaylistDialogOpen: { id: number; name: string } | null;
}

// Define the context type
interface MainStoreContextType {
  state: MainStoreState;
  setVolumeSliderEnabled: (enabled: boolean) => void;
  setAddTrackToPlaylistDialogOpen: (
    dialogState: { trackId: string } | null
  ) => void;
  setCreateNewPlaylistDialogOpen: (open: boolean) => void;
  setRemovePlaylistDialogOpen: (value: boolean | null) => void;
  setEditPlaylistDialogOpen: (
    value: { id: number; name: string } | null
  ) => void;
  removePlaylistDialogOpen: boolean | null;
  editPlaylistDialogOpen: { id: number; name: string } | null;
  createNewPlaylistDialogOpen: boolean;
  volumeSliderEnabled: boolean;
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
    volumeSliderEnabled: true,
    addTrackToPlaylistDialogOpen: null,
    createNewPlaylistDialogOpen: false,
    removePlaylistDialogOpen: null,
    editPlaylistDialogOpen: null,
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

  const setRemovePlaylistDialogOpen = (value: boolean | null) => {
    setState((prevState) => ({
      ...prevState,
      removePlaylistDialogOpen: value,
    }));
  };

  const setEditPlaylistDialogOpen = (
    value: { id: number; name: string } | null
  ) => {
    setState((prevState) => ({ ...prevState, editPlaylistDialogOpen: value }));
  };

  return (
    <MainStoreContext.Provider
      value={{
        state,
        setVolumeSliderEnabled,
        setAddTrackToPlaylistDialogOpen,
        setCreateNewPlaylistDialogOpen,
        setRemovePlaylistDialogOpen,
        setEditPlaylistDialogOpen,
        removePlaylistDialogOpen: state.removePlaylistDialogOpen,
        editPlaylistDialogOpen: state.editPlaylistDialogOpen,
        createNewPlaylistDialogOpen: state.createNewPlaylistDialogOpen,
        volumeSliderEnabled: state.volumeSliderEnabled,
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
