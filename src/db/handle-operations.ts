import { initMusicDB } from './schema'

export async function storeHandle(
  folderName: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await initMusicDB()
  const tx = db.transaction('handles', 'readwrite')
  const store = tx.objectStore('handles')
  await store.put(handle, folderName)
}

export async function clearHandles(): Promise<void> {
  const db = await initMusicDB()
  const tx = db.transaction('handles', 'readwrite')
  const store = tx.objectStore('handles')
  await store.clear()
}