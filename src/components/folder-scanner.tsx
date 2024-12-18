'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { usePlayerStore } from '@/lib/store'
import { isAudioFile } from '@/lib/utils'
import { addAudioFile, markFileAsRemoved, initDB } from '@/lib/db'

// Helper function to get handle from IndexedDB
const getHandle = async (folderName: string): Promise<FileSystemDirectoryHandle | null> => {
  console.log("get handle for:", folderName)
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

console.log("folder scanner module loaded")

export function FolderScanner() {
  console.log("FolderScanner rendered")
  const triggerRefresh = usePlayerStore(state => state.triggerRefresh)
  const selectedFolderNames = usePlayerStore(state => state.selectedFolderNames)
  console.log("Selected folders:", selectedFolderNames)

  const processDirectory = async (dirHandle: FileSystemDirectoryHandle, path = '', isCancelled: () => boolean) => {
    console.log("Processing directory:", path || dirHandle.name)
    try {
      const entries = dirHandle.values()
      const existingFiles = new Set<string>()
      for await (const entry of entries) {
        if (isCancelled()) {
          console.log("Processing cancelled")
          return
        }

        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          
          if (isAudioFile(file)) {
            const newPath = path ? `${path}/${file.name}` : file.name
            console.log("Found audio file:", newPath)
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
    console.log("useEffect running, selectedFolderNames:", selectedFolderNames)
    if (selectedFolderNames.length === 0) {
      console.log("No folders selected, skipping scan")
      return
    }

    let isCancelled = false

    const scanFolders = async () => {
      console.log("Starting folder scan")
      try {
        for (const folderName of selectedFolderNames) {
          if (isCancelled) {
            console.log("Scan cancelled")
            return
          }

          console.log("Scanning folder:", folderName)
          try {
            const handle = await getHandle(folderName)
            if (!handle) {
              console.log("No handle found for:", folderName)
              continue
            }

            const permissionStatus = await handle.queryPermission({ mode: 'read' })
            if (permissionStatus === 'granted') {
              console.log("Permission granted for:", folderName)
              await processDirectory(handle, '', () => isCancelled)
            }
          } catch (error) {
            console.error(`Error accessing folder ${folderName}:`, error)
            toast.error(`Failed to access folder: ${folderName}`)
          }
        }
        if (!isCancelled) {
          console.log("Scan complete, triggering refresh")
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
      console.log("Cleanup: cancelling scan")
      isCancelled = true
    }
  }, [selectedFolderNames, triggerRefresh])

  return null
}
