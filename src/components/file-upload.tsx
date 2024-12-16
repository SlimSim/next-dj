'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Upload, Folder } from 'lucide-react'
import { isAudioFile } from '@/lib/utils'
import { addAudioFile } from '@/lib/db'
import { usePlayerStore } from '@/lib/store'

interface FileSystemHandle {
  kind: 'file' | 'directory'
  name: string
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file'
  getFile(): Promise<File>
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory'
  values(): AsyncIterableIterator<FileSystemHandle>
}

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>
  }
}

export function FileUpload() {
  const [isLoading, setIsLoading] = useState(false)
  const triggerRefresh = usePlayerStore(state => state.triggerRefresh)

  const handleFileSelect = useCallback(async (files: FileList) => {
    setIsLoading(true)
    try {
      for (const file of Array.from(files)) {
        console.log('Processing file:', file);
        if (isAudioFile(file)) {
          const metadata = {
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
            playCount: 0,
            file: file,
          }
          console.log('Adding file with metadata:', metadata);
          const id = await addAudioFile(file, metadata)
          console.log('File added with ID:', id);
          toast.success(`Added ${metadata.title}`)
        } else {
          toast.error(`${file.name} is not a supported audio file`)
        }
      }
      triggerRefresh()
    } catch (error) {
      toast.error('Failed to add files')
      console.error('Error adding files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [triggerRefresh])

  const handleFolderSelect = useCallback(async () => {
    setIsLoading(true)
    try {
      const dirHandle = await window.showDirectoryPicker()
      await processDirectory(dirHandle)
      triggerRefresh()
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to access folder')
        console.error(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [triggerRefresh])

  const processDirectory = async (dirHandle: FileSystemDirectoryHandle, path = '') => {
    try {
      const entries = dirHandle.values()
      for await (const entry of entries) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          if (isAudioFile(file)) {
            const newPath = path ? `${path}/${file.name}` : file.name
            const metadata = {
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              artist: path ? path.split('/')[0] : 'Unknown Artist', // Use first directory as artist
              album: path ? path.split('/')[1] || 'Unknown Album' : 'Unknown Album', // Use second directory as album
              duration: 0,
              playCount: 0,
              path: newPath,
            }
            // Pass the fileHandle instead of file, and set isReference to true
            await addAudioFile(fileHandle, metadata, true)
            toast.success(`Added ${metadata.title}`)
          }
        } else if (entry.kind === 'directory') {
          const newPath = path ? `${path}/${entry.name}` : entry.name
          await processDirectory(entry as FileSystemDirectoryHandle, newPath)
        }
      }
    } catch (error) {
      console.error('Error processing directory:', error)
      toast.error('Failed to process some files in the folder')
    }
  }

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={isLoading}
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Files
      </Button>
      <input
        id="file-upload"
        type="file"
        multiple
        accept="audio/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />
      <Button
        variant="outline"
        onClick={handleFolderSelect}
        disabled={isLoading || !('showDirectoryPicker' in window)}
      >
        <Folder className="w-4 h-4 mr-2" />
        Select Folder
      </Button>
    </div>
  )
}
