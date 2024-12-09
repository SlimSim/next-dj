'use client'

import { useState } from 'react'
import { Playlist } from '@/components/playlist'
import { AudioPlayer } from '@/components/audio-player'
import { SettingsDialog } from '@/components/settings-dialog'
import { PrelistenAudioPlayer } from '@/components/prelisten-audio-player'
import { Input } from '@/components/ui/input'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <main className="flex h-dvh flex-col bg-white dark:bg-neutral-950">
      <header className="flex-none border-b z-20 bg-white/95 dark:bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-red-500">Music Player</h1>
          </div>
          <div className="flex-1 mx-4">
            <Input
              type="search"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm mx-auto"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <SettingsDialog />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <Playlist searchQuery={searchQuery} />
        <PrelistenAudioPlayer />
      </div>

      <footer className="flex-none border-t bg-white/95 dark:bg-neutral-950/95 w-full">
        <AudioPlayer />
      </footer>
    </main>
  )
}
