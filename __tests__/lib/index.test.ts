import { generateTryOn } from '@/lib/index'
import * as libExports from '@/lib/index'

// Mock the dependencies
jest.mock('@/lib/openaiClient', () => ({
  generateTryOn: jest.fn()
}))

jest.mock('@/lib/tryOnSchema', () => ({
  tryOnSchema: { type: 'object' },
  TryOnRequest: { type: 'object' },
  TryOnResponse: { type: 'object' }
}))

describe('lib/index exports', () => {
  it('exports generateTryOn function', () => {
    expect(typeof generateTryOn).toBe('function')
  })

  it('exports all expected functions and types', () => {
    expect(libExports).toHaveProperty('generateTryOn')
    expect(libExports).toHaveProperty('tryOnSchema')
    expect(libExports).toHaveProperty('TryOnRequest')
    expect(libExports).toHaveProperty('TryOnResponse')
  })

  it('generateTryOn is callable', () => {
    expect(typeof libExports.generateTryOn).toBe('function')
  })

  it('exports are not undefined', () => {
    expect(libExports.generateTryOn).toBeDefined()
    expect(libExports.tryOnSchema).toBeDefined()
    expect(libExports.TryOnRequest).toBeDefined()
    expect(libExports.TryOnResponse).toBeDefined()
  })

  it('maintains function signature', () => {
    // Test that the function can be called (even if mocked)
    expect(() => {
      generateTryOn({} as any)
    }).not.toThrow()
  })
}) 