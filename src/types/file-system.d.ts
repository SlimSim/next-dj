// src/types/file-system.d.ts

interface FileSystemHandle {
    kind: 'file' | 'directory';
    name: string;
  }
  
  interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file';
    getFile(): Promise<File>;
  }
  
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    kind: 'directory';
  }