import '@testing-library/jest-dom'

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.load = () => {}
window.HTMLMediaElement.prototype.play = jest.fn()
window.HTMLMediaElement.prototype.pause = jest.fn()

// Mock URL methods
global.URL.createObjectURL = jest.fn()
global.URL.revokeObjectURL = jest.fn()
