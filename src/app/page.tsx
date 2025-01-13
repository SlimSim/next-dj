"use client";

import { useRef, useState, useEffect } from "react";
import { Playlist } from "@/components/player/playlist";
import { AudioPlayer } from "@/components/player/audio-player";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import {
  PrelistenAudioPlayer,
  PrelistenAudioRef,
} from "@/components/player/prelisten-audio-player";
import { NavigationGuard } from "@/components/common/navigation-guard";
import { Input } from "@/components/ui/input";
import { FolderScanner } from "@/components/common/folder-scanner";
import { cn } from "@/lib/utils/common";
import {
  PlaylistControls,
  SortField,
  SortOrder,
  FilterCriteria,
} from "@/components/player/playlist-controls";
import { getRemovedSongs } from "@/db/audio-operations";
import { usePlayerStore } from "@/lib/store";

export default function Home() {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const prelistenRef = useRef<PrelistenAudioRef>(null);
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);
  const searchQuery = usePlayerStore((state) => state.searchQuery);
  const setSearchQuery = usePlayerStore((state) => state.setSearchQuery);
  const sortField = usePlayerStore((state) => state.sortField);
  const setSortField = usePlayerStore((state) => state.setSortField);
  const sortOrder = usePlayerStore((state) => state.sortOrder);
  const setSortOrder = usePlayerStore((state) => state.setSortOrder);
  const filters = usePlayerStore((state) => state.filters);
  const setFilters = usePlayerStore((state) => state.setFilters);

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

  return (
    <>
      <NavigationGuard />
      <main className="flex h-dvh flex-col bg-white dark:bg-neutral-950">
        <header className="flex-none flex flex-col border-b z-20 bg-white/95 dark:bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60">
          <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center">
            <div
              className={cn(
                "transition-all duration-200",
                isSearchFocused ? "hidden sm:block" : "block"
              )}
            >
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
              <Input
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
      </main>
    </>
  );
}
