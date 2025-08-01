import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock navigator.mediaDevices for camera access
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock HTMLVideoElement methods
const mockPlay = jest.fn();
const mockSetAttribute = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  value: mockPlay,
  writable: true,
});

Object.defineProperty(HTMLVideoElement.prototype, 'setAttribute', {
  value: mockSetAttribute,
  writable: true,
});

Object.defineProperty(HTMLVideoElement.prototype, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(HTMLVideoElement.prototype, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

// Default successful camera access mock
mockGetUserMedia.mockResolvedValue({
  getTracks: () => [{ stop: jest.fn() }]
});
mockPlay.mockResolvedValue(undefined); 