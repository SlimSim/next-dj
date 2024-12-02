'use client'

import { FileUpload } from '@/components/file-upload'
import { Playlist } from '@/components/playlist'
import { AudioPlayer } from '@/components/audio-player'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <main className="fixed inset-0 flex flex-col bg-white dark:bg-neutral-950">
      <header className="flex-none border-b z-20 bg-white/95 dark:bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-red-500">Music Player</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <FileUpload />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Playlist />
      </div>

      <footer className="flex-none border-t bg-white/95 dark:bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-neutral-950/60 w-full z-20">
        <AudioPlayer />
      </footer>
    </main>
  )
}
