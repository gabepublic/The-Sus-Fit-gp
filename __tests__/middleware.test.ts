/**
 * Simple middleware test to verify core functionality
 */
import { NextRequest, NextResponse } from 'next/server'

// Mock the device detection utility first
jest.mock('../src/mobile/utils/deviceDetection', () => ({
  shouldRedirectToMobile: jest.fn()
}))

// Import after mocking
const { middleware } = require('../src/middleware')
const { shouldRedirectToMobile } = require('../src/mobile/utils/deviceDetection')

describe('Middleware Core Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect phone devices to mobile home', async () => {
    shouldRedirectToMobile.mockReturnValue(true)
    
    const request = new NextRequest('https://example.com/', {
      headers: { 'user-agent': 'iPhone' }
    })
    
    const response = await middleware(request)
    
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/m/home')
    expect(shouldRedirectToMobile).toHaveBeenCalledWith('iPhone')
  })

  it('should not redirect non-phone devices', async () => {
    shouldRedirectToMobile.mockReturnValue(false)
    
    const request = new NextRequest('https://example.com/', {
      headers: { 'user-agent': 'iPad' }
    })
    
    const response = await middleware(request)
    
    expect(response.headers.get('location')).toBeNull()
    expect(shouldRedirectToMobile).toHaveBeenCalledWith('iPad')
  })

  it('should skip API routes', async () => {
    const request = new NextRequest('https://example.com/api/test')
    
    const response = await middleware(request)
    
    expect(shouldRedirectToMobile).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBeNull()
  })

  it('should skip mobile routes', async () => {
    const request = new NextRequest('https://example.com/m/home')
    
    const response = await middleware(request)
    
    expect(shouldRedirectToMobile).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBeNull()
  })
})