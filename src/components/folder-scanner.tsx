'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { usePlayerStore } from '@/lib/store'
import { isAudioFile } from '@/lib/utils'
import { addAudioFile, markFileAsRemoved, initDB } from '@/lib/db'

// Helper function to get handle from IndexedDB
const getHandle = async (folderName: string): Promise<FileSystemDirectoryHandle | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('next-dj', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(['handles'], 'readonly')
      const store = transaction.objectStore('handles')
      const getRequest = store.get(folderName)
      getRequest.onsuccess = () => resolve(getRequest.result)
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}


export function FolderScanner() {
  const triggerRefresh = usePlayerStore(state => state.triggerRefresh)
  const selectedFolderNames = usePlayerStore(state => state.selectedFolderNames)

  const processDirectory = async (dirHandle: FileSystemDirectoryHandle, path = '', isCancelled: () => boolean) => {
    try {
      const entries = dirHandle.values()
      const existingFiles = new Set<string>()
      for await (const entry of entries) {
        if (isCancelled()) {
          return
        }

        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          
          if (isAudioFile(file)) {
            const newPath = path ? `${path}/${file.name}` : file.name
            existingFiles.add(newPath)
            const metadata = {
              title: file.name.replace(/\.[^/.]+$/, ''),
              artist: path ? path.split('/')[0] : 'Unknown Artist',
              album: path ? path.split('/')[1] || 'Unknown Album' : 'Unknown Album',
              duration: 0,
              playCount: 0,
              path: newPath,
            }
            await addAudioFile(fileHandle, metadata, true)
          }
        } else if (entry.kind === 'directory') {
          const dirEntry = entry as FileSystemDirectoryHandle
          const newPath = path ? `${path}/${entry.name}` : entry.name
          await processDirectory(dirEntry, newPath, isCancelled)
        }
      }

      // Mark files as removed if they are no longer in the directory
      const db = await initDB()
      const tx = db.transaction('metadata', 'readonly')
      const allFiles = await tx.store.getAll()
      for (const file of allFiles) {
        if (!existingFiles.has(file.path)) {
          await markFileAsRemoved(file.path)
        }
      }
    } catch (error) {
      console.error('Error processing directory:', error)
      throw error
    }
  }

  useEffect(() => {
    if (selectedFolderNames.length === 0) {
      return
    }

    let isCancelled = false

    const scanFolders = async () => {
      try {
        for (const folderName of selectedFolderNames) {
          if (isCancelled) {
            return
          }

          try {
            const handle = await getHandle(folderName)
            if (!handle) {
              continue
            }

            const permissionStatus = await handle.queryPermission({ mode: 'read' })
            if (permissionStatus === 'granted') {
              await processDirectory(handle, '', () => isCancelled)
            }
          } catch (error) {
            console.error(`Error accessing folder ${folderName}:`, error)
            toast.error(`Failed to access folder: ${folderName}`)
          }
        }
        if (!isCancelled) {
          triggerRefresh()
        }
      } catch (error) {
        console.error('Error scanning folders:', error)
        toast.error('Failed to scan folders')
      }
    }

    // Run the scan on mount
    scanFolders()

    // Cleanup function to cancel any in-progress scan
    return () => {
      isCancelled = true
    }
  }, [selectedFolderNames, triggerRefresh])

  return null
}
