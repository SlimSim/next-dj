"use client";

import { useRef, useState } from "react";
import { Playlist } from "@/components/player/playlist";
import { AudioPlayer } from "@/components/player/audio-player";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import {
  PrelistenAudioPlayer,
  PrelistenAudioRef,
} from "@/components/player/prelisten-audio-player";
import { Input } from "@/components/ui/input";
import { FolderScanner } from "@/components/common/folder-scanner"; // Added import
import { cn } from "@/lib/utils/common";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const prelistenRef = useRef<PrelistenAudioRef>(null);

  return (
    <main className="flex h-dvh flex-col bg-white dark:bg-neutral-950">
      <header className="flex-none border-b z-20 bg-white/95 dark:bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60">
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
                isSearchFocused ? "w-full" : "max-w-sm mx-auto"
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
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          <div className="flex-1 container mx-auto p-0">
            <FolderScanner />
            <Playlist searchQuery={searchQuery} prelistenRef={prelistenRef} />
          </div>
        </div>
        <PrelistenAudioPlayer ref={prelistenRef} />
      </div>

      <footer className="flex-none border-t bg-white/95 dark:bg-neutral-950/95 w-full">
        <AudioPlayer />
      </footer>
    </main>
  );
}
