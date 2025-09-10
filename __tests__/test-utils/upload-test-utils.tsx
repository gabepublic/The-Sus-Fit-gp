/**
 * @fileoverview Test utilities specifically for UploadAngle components
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock file creation utility
export const createMockFile = (
  name: string = 'test.jpg',
  type: string = 'image/jpeg',
  size: number = 1024 * 1024
) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Mock image dimensions utility
export const createMockImageFile = (
  name: string = 'test.jpg',
  width: number = 800,
  height: number = 600
) => {
  const file = createMockFile(name, 'image/jpeg')
  
  // Mock the image loading to return specific dimensions
  const originalImage = global.Image
  global.Image = class extends originalImage {
    constructor() {
      super()
      this.width = width
      this.height = height
      // Use defineProperty for read-only properties
      Object.defineProperty(this, 'naturalWidth', { value: width, writable: false })
      Object.defineProperty(this, 'naturalHeight', { value: height, writable: false })
    }
  } as any

  return { file, cleanup: () => { global.Image = originalImage } }
}

// Test file upload event utility
export const createFileUploadEvent = (files: File[]) => ({
  target: {
    files: {
      0: files[0],
      length: files.length,
      item: (index: number) => files[index] || null,
      [Symbol.iterator]: function* () {
        for (const file of files) {
          yield file
        }
      }
    }
  }
})

// Custom render with React Query provider
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
})

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Accessibility testing utility
export const runA11yTests = async (container: HTMLElement) => {
  const { axe } = await import('jest-axe')
  const results = await axe(container)
  return results
}

// Performance measurement utility
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Memory leak detection utility
export const createMemoryLeakDetector = () => {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
  
  return {
    check: () => {
      const currentMemory = (performance as any).memory?.usedJSHeapSize || 0
      return currentMemory - initialMemory
    }
  }
}

// Mock canvas context for image processing tests
export const mockCanvasContext = () => {
  const canvas = document.createElement('canvas')
  const context = {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 100,
      height: 100,
      colorSpace: 'srgb' as PredefinedColorSpace
    } as ImageData)),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    clearRect: jest.fn(),
    canvas,
    measureText: jest.fn(() => ({
      width: 100,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 10,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 100,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 4
    } as TextMetrics)),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
  } as unknown as CanvasRenderingContext2D
  
  canvas.getContext = jest.fn(() => context)
  canvas.toBlob = jest.fn((callback) => {
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    callback(blob)
  })
  
  return { canvas, context }
}

// Wait for async operations utility
export const waitForAsyncOperations = async (timeout: number = 100) => {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

// Custom matchers for UploadAngle testing
export const uploadMatchers = {
  toHaveValidImageDimensions: (received: { width: number; height: number }, min = 400) => {
    const pass = received.width >= min && received.height >= min
    return {
      message: () => 
        `expected image dimensions ${received.width}x${received.height} to ${pass ? 'not ' : ''}meet minimum ${min}px requirement`,
      pass,
    }
  },
  
  toHaveValidFileSize: (received: File, maxSize = 10 * 1024 * 1024) => {
    const pass = received.size <= maxSize
    return {
      message: () =>
        `expected file size ${received.size} bytes to ${pass ? 'not ' : ''}be under ${maxSize} bytes limit`,
      pass,
    }
  },
  
  toBeValidImageType: (received: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    const pass = validTypes.includes(received.type)
    return {
      message: () =>
        `expected file type "${received.type}" to ${pass ? 'not ' : ''}be a valid image type (${validTypes.join(', ')})`,
      pass,
    }
  }
}

// Add custom matchers to Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidImageDimensions(min?: number): R
      toHaveValidFileSize(maxSize?: number): R
      toBeValidImageType(): R
    }
  }
}

// Initialize custom matchers
expect.extend(uploadMatchers)