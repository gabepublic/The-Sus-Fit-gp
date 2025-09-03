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
import { toHaveNoViolations } from 'jest-axe'
import 'jest-canvas-mock'

// Add jest-axe accessibility matchers
expect.extend(toHaveNoViolations)

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock URL.createObjectURL and revokeObjectURL for file uploads
global.URL.createObjectURL = jest.fn(() => 'mocked-object-url')
global.URL.revokeObjectURL = jest.fn()

// Mock File and FileReader for upload testing
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits
    this.name = name
    this.type = options.type || 'text/plain'
    this.size = bits.reduce((acc, bit) => acc + bit.length, 0)
    this.lastModified = Date.now()
  }
}

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.error = null
    this.onload = null
    this.onerror = null
    this.onabort = null
    this.onloadstart = null
    this.onloadend = null
    this.onprogress = null
  }
  
  readAsDataURL() {
    this.readyState = 2
    this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD'
    if (this.onload) this.onload({ target: this })
  }
  
  readAsArrayBuffer() {
    this.readyState = 2
    this.result = new ArrayBuffer(8)
    if (this.onload) this.onload({ target: this })
  }
  
  abort() {
    if (this.onabort) this.onabort({ target: this })
  }
}

// Mock Canvas for image processing tests
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
}))

// Mock Image constructor for image loading tests
global.Image = class MockImage {
  constructor() {
    this.onload = null
    this.onerror = null
    this.src = ''
    this.width = 800
    this.height = 600
    this.naturalWidth = 800
    this.naturalHeight = 600
  }
  
  set src(value) {
    this._src = value
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
  
  get src() {
    return this._src
  }
}

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

// Mock Next.js Image component to prevent performance API issues
jest.mock('next/image', () => {
  return function Image({ 
    src, 
    alt, 
    className, 
    width, 
    height, 
    priority, 
    fill,
    unoptimized,
    sizes,
    quality,
    placeholder,
    blurDataURL,
    loader,
    onLoad,
    onError,
    ...restProps 
  }) {
    // Filter out Next.js specific props that shouldn't go to DOM
    const domProps = {};
    Object.keys(restProps).forEach(key => {
      // Only pass through standard HTML attributes
      if (!key.startsWith('data-') && !['onLoadingComplete', 'loading'].includes(key)) {
        return;
      }
      domProps[key] = restProps[key];
    });

    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        width={width}
        height={height}
        data-priority={priority ? 'true' : 'false'}
        data-fill={fill ? 'true' : 'false'}
        data-unoptimized={unoptimized ? 'true' : 'false'}
        data-sizes={sizes}
        data-quality={quality}
        onLoad={onLoad}
        onError={onError}
        {...domProps}
      />
    );
  };
})

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

// Mock PerformanceObserver for performance monitoring tests
global.PerformanceObserver = class PerformanceObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe(options) {
    // Mock implementation - can trigger callback if needed for testing
    return;
  }
  
  disconnect() {
    return;
  }
  
  takeRecords() {
    return [];
  }
}

// Enhanced performance API mock
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  now: jest.fn(() => Date.now()),
  getEntries: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
}

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