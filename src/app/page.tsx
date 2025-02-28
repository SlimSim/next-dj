"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Playlist } from "@/components/player/playlist";
import { AudioPlayer } from "@/components/player/audio-player";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import {
  PrelistenAudioPlayer,
  PrelistenAudioRef,
} from "@/components/player/prelisten-audio-player";
import { NavigationGuard } from "@/components/common/navigation-guard";
import { SearchInput } from "@/components/ui/search-input";
import { FolderScanner } from "@/components/common/folder-scanner";
import { cn } from "@/lib/utils/common";
import {
  PlaylistControls,
  SortField,
  SortOrder,
  FilterCriteria,
  FilterValue,
} from "@/components/player/playlist-controls";
import { getRemovedSongs } from "@/db/audio-operations";
import { usePlayerStore } from "@/lib/store";
import { FilterIcon, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListMusic } from "lucide-react";
import { ListsPanel } from "@/components/player/lists-panel";
import { MusicMetadata } from "@/lib/types/types";

export default function Home() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const prelistenRef = useRef<PrelistenAudioRef>(null);
  const playlistRef = useRef<{ handleSelectAll: () => void }>(null);
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);
  const searchQuery = usePlayerStore((state) => state.searchQuery);
  const setSearchQuery = usePlayerStore((state) => state.setSearchQuery);
  const sortField = usePlayerStore((state) => state.sortField);
  const setSortField = usePlayerStore((state) => state.setSortField);
  const sortOrder = usePlayerStore((state) => state.sortOrder);
  const setSortOrder = usePlayerStore((state) => state.setSortOrder);
  const filters = usePlayerStore((state) => state.filters);
  const setFilters = usePlayerStore((state) => state.setFilters);
  const toggleFilters = usePlayerStore((state) => state.toggleFilters);
  const showFilters = usePlayerStore((state) => state.showFilters);
  const toggleLists = usePlayerStore((state) => state.toggleLists);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const volume = usePlayerStore((state) => state.volume);
  const metadata = usePlayerStore((state) => state.metadata);
  const selectedListId = usePlayerStore((state) => state.selectedListId);
  const songLists = usePlayerStore((state) => state.songLists);

  const [playerCurrentVolume, setPlayerCurrentVolume] = useState<number>(0);

  const filteredAndSortedTracks = useMemo(() => {
    // First filter by selected song list
    let tracksToFilter = metadata || [];
    if (selectedListId) {
      const selectedList = songLists.find(list => list.id === selectedListId);
      if (selectedList) {
        tracksToFilter = tracksToFilter.filter((track: MusicMetadata) => track.path && selectedList.songs.includes(track.path));
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tracksToFilter = tracksToFilter.filter((track: MusicMetadata) => 
        (track.title?.toLowerCase() || '').includes(query) ||
        (track.artist?.toLowerCase() || '').includes(query) ||
        (track.album?.toLowerCase() || '').includes(query)
      );
    }

    return tracksToFilter;
  }, [metadata, selectedListId, songLists, searchQuery]);

  // Effect to update the current player volume
  useEffect(() => {
    const updateCurrentVolume = () => {
      const audioElement = document.getElementById('main-audio') as HTMLAudioElement;
      if (audioElement) {
        setPlayerCurrentVolume(audioElement.volume);
      }
    };

    // Update initially
    updateCurrentVolume();

    // Set up volume change listener
    const audioElement = document.getElementById('main-audio') as HTMLAudioElement;
    if (audioElement) {
      audioElement.addEventListener('volumechange', updateCurrentVolume);
      // Also listen for play events since volume might change when track starts
      audioElement.addEventListener('play', updateCurrentVolume);
      // And timeupdate for end fades
      audioElement.addEventListener('timeupdate', updateCurrentVolume);
    }

    // Update every 20ms to match the fade update interval
    const intervalId = setInterval(updateCurrentVolume, 20);

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('volumechange', updateCurrentVolume);
        audioElement.removeEventListener('play', updateCurrentVolume);
        audioElement.removeEventListener('timeupdate', updateCurrentVolume);
      }
      clearInterval(intervalId);
    };
  }, []);

  // Check for removed songs on initial load
  useEffect(() => {
    const checkRemovedSongs = async () => {
      console.log("Initial check for removed songs");
      const removedSongs = await getRemovedSongs();
      if (removedSongs.length > 0) {
        console.log("Found removed songs on initial load:", removedSongs);
        triggerRefresh();
      }
    };
    checkRemovedSongs();
  }, [triggerRefresh]);

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const hasActiveFilters = Object.values(filters).some(
    (filter) => {
      const filterValue = filter as FilterValue | undefined;
      return filterValue?.values && filterValue.values.length > 0
    }
  );

  const getNormalizedVolume = (globalVolume: number, songVolume: number) => {
    return globalVolume * songVolume;
  };

  return (
    <>
      <NavigationGuard />
      <main className="flex h-dvh flex-col bg-white dark:bg-neutral-950">
        <div className="flex flex-1 overflow-hidden">
          <ListsPanel />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="flex-none flex flex-col border-b z-20 bg-white/95 dark:bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60">
              <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center">
                <div
                  className={cn(
                    "transition-all duration-200 flex items-center gap-2",
                    isSearchFocused ? "hidden sm:flex" : "flex"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playlistRef.current?.handleSelectAll()}
                    title={`Select all`}
                    className="h-8 w-8 -ml-4"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  <h1 className="text-xl sm:text-2xl font-bold text-red-500">
                    Next DJ
                  </h1>
                </div>
                <div
                  className={cn(
                    "transition-all duration-200 px-0 sm:px-4",
                    isSearchFocused ? "flex-1" : "flex-1 mx-4"
                  )}
                >
                  <SearchInput
                    type="search"
                    placeholder="Search tracks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={cn(
                      "transition-all duration-200",
                      isSearchFocused ? "w-full" : "w-full"
                    )}
                  />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 sm:gap-4 transition-all duration-200",
                    isSearchFocused ? "hidden sm:flex" : "flex"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFilters}
                    className={cn(
                      "transition-colors relative",
                      showFilters && "bg-accent"
                    )}
                  >
                    <FilterIcon className="h-6 w-6" />
                    {hasActiveFilters && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleLists}
                    className="lg:hidden"
                  >
                    <ListMusic className="h-6 w-6" />
                  </Button>
                  <SettingsDialog />
                </div>
              </div>
              <PlaylistControls
                sortField={sortField}
                sortOrder={sortOrder}
                filters={filters}
                onSortChange={handleSortChange}
                onFilterChange={setFilters}
              />
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col">
                <div className="flex-1 container mx-auto p-0">
                  <FolderScanner />
                  <Playlist
                    ref={playlistRef}
                    data-testid="playlist-component"
                    searchQuery={searchQuery}
                    prelistenRef={prelistenRef}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    filters={filters}
                  />
                </div>
              </div>
              <PrelistenAudioPlayer ref={prelistenRef} />
            </div>

            <footer className="flex-none border-t bg-white/95 dark:bg-neutral-950/95 w-full">
              <AudioPlayer />
            </footer>
          </div>
        </div>
      </main>
    </>
  );
}
