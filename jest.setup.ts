import '@testing-library/jest-dom';
import { MockFileSystemDirectoryHandle, MockFileSystemFileHandle, MockFile } from './__mocks__/file-system.mocks';

// Assign File System API mocks to global scope
Object.defineProperty(global, 'FileSystemDirectoryHandle', { value: MockFileSystemDirectoryHandle, configurable: true, writable: true });
Object.defineProperty(global, 'FileSystemFileHandle', { value: MockFileSystemFileHandle, configurable: true, writable: true });
Object.defineProperty(global, 'File', { value: MockFile, configurable: true, writable: true });

// Mock 'sonner' globally. Jest will find __mocks__/sonner.ts at the root.
jest.mock('sonner');

// Mock one DB module to test pathing from root/src
jest.mock('./src/db/schema');

// Mock other database operations globally
jest.mock('./src/db/audio-operations');
jest.mock('./src/db/metadata-operations');
jest.mock('./src/db/handle-operations');

// Mock file-utils globally
jest.mock('./src/features/audio/utils/file-utils');

// --- Global Browser API Mocks ---

// Mock for window.showOpenFilePicker and window.showDirectoryPicker
(global as any).showOpenFilePicker = jest.fn();
(global as any).showDirectoryPicker = jest.fn();

// Mock for localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number): string | null => Object.keys(store)[index] || null,
    get length(): number {
      return Object.keys(store).length;
    }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

// Mock for window.matchMedia
(global as any).matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // deprecated
  removeListener: jest.fn(), // deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock for ResizeObserver
(global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
if (!(global as any).URL) {
  // Define a simplistic URL class if it doesn't exist on global
  (global as any).URL = class URLMock {
    static createObjectURL = jest.fn().mockReturnValue('blob:mockblob');
    static revokeObjectURL = jest.fn();
    // Add other necessary URL properties or methods if tests require them
    href: string;
    constructor(url: string) { this.href = url; } // Basic constructor
  };
} else {
  // If URL exists, just mock its methods
  (global as any).URL.createObjectURL = jest.fn().mockReturnValue('blob:mockblob');
  (global as any).URL.revokeObjectURL = jest.fn();
}

// If JSDOM is active, it will create `window`. We can mirror global mocks to window for robustness.
// This is generally not strictly necessary if tests correctly use `global` or if JSDOM handles it.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: (global as any).localStorage, configurable: true, writable: true });
  Object.defineProperty(window, 'matchMedia', { value: (global as any).matchMedia, configurable: true, writable: true });
  (window as any).ResizeObserver = (global as any).ResizeObserver;
  if (!(window as any).URL) {
    (window as any).URL = (global as any).URL;
  } else {
    (window as any).URL.createObjectURL = (global as any).URL.createObjectURL;
    (window as any).URL.revokeObjectURL = (global as any).URL.revokeObjectURL;
  }
  (window as any).showOpenFilePicker = (global as any).showOpenFilePicker;
  (window as any).showDirectoryPicker = (global as any).showDirectoryPicker;
}
// console.log('jest.setup.ts loaded with core and browser API mocks.'); // Removed for cleaner test output