'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Upload, Folder } from 'lucide-react'
import { isAudioFile } from '@/lib/utils'
import { addAudioFile } from '@/lib/db'

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
    } catch (error) {
      toast.error('Failed to add files')
      console.error('Error adding files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFolderSelect = useCallback(async () => {
    try {
      const dirHandle = await window.showDirectoryPicker()
      await processDirectory(dirHandle)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to access folder')
        console.error(error)
      }
    }
  }, [])

  const processDirectory = async (dirHandle: FileSystemDirectoryHandle, path = '') => {
    setIsLoading(true)
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          if (isAudioFile(file)) {
            const newPath = path ? `${path}/${file.name}` : file.name
            const metadata = {
              title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              playCount: 0,
              path: newPath,
              file: file,
            }
            await addAudioFile(file, metadata)
            toast.success(`Added ${newPath}`)
          }
        } else if (entry.kind === 'directory') {
          const subDirHandle = entry as FileSystemDirectoryHandle
          await processDirectory(subDirHandle, path ? `${path}/${entry.name}` : entry.name)
        }
      }
    } catch (error) {
      toast.error('Failed to process directory')
      console.error(error)
    } finally {
      setIsLoading(false)
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
