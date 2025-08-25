// Polyfill Web APIs for MSW v2 in Node.js environment
const { TextEncoder, TextDecoder } = require('util')
const { ReadableStream, WritableStream, TransformStream } = require('stream/web')

// Set globals before requiring undici
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.WritableStream = WritableStream
global.TransformStream = TransformStream

// Mock MessagePort for undici
global.MessagePort = class MessagePort {
  constructor() {}
  postMessage() {}
  start() {}
  close() {}
}

// Mock BroadcastChannel for MSW
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

// Now require undici after globals are set
const { fetch, Request, Response, Headers } = require('undici')
global.fetch = jest.fn(fetch)
global.Request = Request
global.Response = Response
global.Headers = Headers

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
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

// Next.js response is now part of next/server, so we don't need a separate mock for next/response

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock browser APIs that are not available in Node.js
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock matchMedia (only if window exists)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
  })
}

// Mock localStorage for business layer services (only for non-jsdom environments)
// Tests with @jest-environment jsdom should use their own localStorage mock
if (typeof window === 'undefined') {
  const localStorageMock = {
    getItem: jest.fn((key) => null),
    setItem: jest.fn((key, value) => undefined),
    removeItem: jest.fn((key) => undefined),
    clear: jest.fn(() => undefined),
    length: 0,
    key: jest.fn((index) => null)
  }

  // Make localStorage available globally for Node.js environment
  global.localStorage = localStorageMock
  
  // Ensure window object exists in test environment
  global.window = {
    localStorage: localStorageMock,
    // Add other window properties as needed
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    }
  }
}

// Mock localStorage globally for all tests
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(() => null)
  },
  writable: true
});

// Suppress console.error for expected test errors
const originalError = console.error
console.error = (...args) => {
  // Suppress environment validation errors in tests
  if (typeof args[0] === 'string' && args[0].includes('Environment validation failed:')) {
    return
  }
  // Suppress expected API errors in tests
  if (typeof args[0] === 'string' && args[0].includes('Try-on API error:')) {
    return
  }
  originalError.call(console, ...args)
}