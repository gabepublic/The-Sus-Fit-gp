import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock Next.js server modules to prevent Request/Response issues
jest.mock('next/server', () => ({
  NextRequest: class {
    constructor(input: string | URL, init?: globalThis.RequestInit) {
      return {
        url: typeof input === 'string' ? input : input.toString(),
        method: init?.method || 'GET',
        headers: init?.headers || {},
        body: init?.body || null,
        json: async () => {
          if (typeof init?.body === 'string' && init.body.trim()) {
            try {
              return JSON.parse(init.body);
            } catch (error) {
              console.warn('Failed to parse JSON body:', error);
              throw new Error('Invalid JSON');
            }
          }
          return {};
        }
      } as unknown as { url: string; method: string; headers: Record<string, string>; body: string | null; json: () => Promise<unknown> };
    }
  },
  NextResponse: {
    json: (data: unknown, init?: globalThis.ResponseInit) => ({
      status: init?.status || 200,
      statusText: init?.statusText || 'OK',
      headers: init?.headers || {},
      body: JSON.stringify(data),
      json: async () => data
    })
  }
}))

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

// Mock environment variables for tests
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.PINECONE_API_KEY = 'test-pinecone-key'
process.env.PINECONE_ENVIRONMENT = 'test-environment'
process.env.PINECONE_INDEX_NAME = 'test-index'
// Use Object.defineProperty to set NODE_ENV instead of direct assignment
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
})

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