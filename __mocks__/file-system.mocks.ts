export class MockFile {
  constructor(
    public name: string,
    public type: string,
    public size: number,
    public lastModified: number = Date.now(),
    private content: ArrayBuffer = new ArrayBuffer(0)
  ) {}

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.content;
  }

  stream() {
    const content = this.content; // Capture content from MockFile's `this`
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(content)); // Use captured content
        controller.close();
      },
    });
    return readableStream;
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    const slicedContent = this.content.slice(start || 0, end || this.content.byteLength);
    return new MockFile(this.name, contentType || this.type, slicedContent.byteLength, this.lastModified, slicedContent) as unknown as Blob;
  }

  text(): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(this as unknown as Blob);
    });
  }
}

export class MockFileSystemFileHandle {
  kind: 'file' = 'file';
  constructor(public name: string, private file: MockFile = new MockFile(name, 'audio/mpeg', 1024)) {}

  async getFile(): Promise<MockFile> {
    return this.file;
  }

  async queryPermission(options?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(options?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  async createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream> {
    const mockStream = {
      write: jest.fn().mockResolvedValue(undefined),
      seek: jest.fn().mockResolvedValue(undefined),
      truncate: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as FileSystemWritableFileStream;
    return mockStream;
  }
}

export class MockFileSystemDirectoryHandle {
  kind: 'directory' = 'directory';
  constructor(public name: string, private entries: (MockFileSystemFileHandle | MockFileSystemDirectoryHandle)[] = []) {}

  async *values(): AsyncIterableIterator<MockFileSystemFileHandle | MockFileSystemDirectoryHandle> {
    for (const entry of this.entries) {
      yield entry;
    }
  }

  async queryPermission(options?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(options?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  async getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<MockFileSystemDirectoryHandle> {
    const entry = this.entries.find(e => e.name === name && e.kind === 'directory');
    if (entry) {
      return entry as MockFileSystemDirectoryHandle;
    }
    if (options?.create) {
      const newDir = new MockFileSystemDirectoryHandle(name);
      this.entries.push(newDir);
      return newDir;
    }
    throw new Error(`Directory not found: ${name}`);
  }

  async getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<MockFileSystemFileHandle> {
    const entry = this.entries.find(e => e.name === name && e.kind === 'file');
    if (entry) {
      return entry as MockFileSystemFileHandle;
    }
    if (options?.create) {
      const newFile = new MockFileSystemFileHandle(name);
      this.entries.push(newFile);
      return newFile;
    }
    throw new Error(`File not found: ${name}`);
  }

  async removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void> {
    const index = this.entries.findIndex(e => e.name === name);
    if (index !== -1) {
      if (options?.recursive && this.entries[index].kind === 'directory') {
        // In a real scenario, you'd recursively remove entries.
        // For this mock, we'll just remove the directory itself.
      }
      this.entries.splice(index, 1);
    } else {
      throw new Error(`Entry not found: ${name}`);
    }
  }
}

// Helper to create a mock directory structure
export const createMockDirectory = (name: string, entries: (MockFileSystemFileHandle | MockFileSystemDirectoryHandle)[]) => {
  return new MockFileSystemDirectoryHandle(name, entries);
};

export const createMockFile = (name: string, type: string = 'audio/mpeg', size: number = 1024) => {
  return new MockFile(name, type, size);
};

export const createMockFileHandle = (name: string, file?: MockFile) => {
  return new MockFileSystemFileHandle(name, file || createMockFile(name));
};

// Global assignment is handled in jest.setup.ts
