/**
 * Integration tests for middleware with route mapping system
 */
import { NextRequest, NextResponse } from 'next/server'

// Mock the device detection utility first
jest.mock('../src/mobile/utils/deviceDetection', () => ({
  shouldRedirectToMobile: jest.fn()
}))

// Import after mocking
const { middleware } = require('../src/middleware')
const { shouldRedirectToMobile } = require('../src/mobile/utils/deviceDetection')

describe('Middleware Integration with Route Mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Route Mapping Integration', () => {
    it('should use route mapping for phone redirects', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/upload-angle', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/upload-angle')
      expect(shouldRedirectToMobile).toHaveBeenCalledWith('iPhone')
    })

    it('should map parameterized routes correctly', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/user/123', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/user/123')
    })

    it('should handle wildcard routes (admin stays on main)', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/admin/users', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      // Admin routes should stay on main version even for phones
      expect(response.headers.get('location')).toBeNull()
      expect(response.cookies.get('view-preference')?.value).toBe('main')
    })

    it('should handle unmapped routes by staying on main', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/some-random-page', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      // No mapping exists, should stay on main
      expect(response.headers.get('location')).toBeNull()
      expect(response.cookies.get('view-preference')?.value).toBe('main')
    })

    it('should preserve query strings in mapped redirects', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/tryon?id=123&mode=test', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/tryon?id=123&mode=test')
    })

    it('should use route mapping with view override parameter', async () => {
      // Device detection should not be called for view override
      const request = new NextRequest('https://example.com/upload-fit?view=mobile', {
        headers: { 'user-agent': 'Desktop' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/upload-fit?view=mobile')
      expect(shouldRedirectToMobile).not.toHaveBeenCalled()
    })

    it('should fallback to mobile home for view override on unmapped routes', async () => {
      const request = new NextRequest('https://example.com/unknown-page?view=mobile', {
        headers: { 'user-agent': 'Desktop' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/home?view=mobile')
    })
  })

  describe('Cookie Behavior with Route Mapping', () => {
    it('should set mobile cookie when redirecting to mapped route', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/share', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/share')
      expect(response.cookies.get('view-preference')?.value).toBe('mobile')
    })

    it('should set main cookie when no mapping exists for phone', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/unmapped-route', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBeNull()
      expect(response.cookies.get('view-preference')?.value).toBe('main')
    })

    it('should respect existing mobile preference cookie', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/tryon', {
        headers: { 
          'user-agent': 'iPhone',
          'cookie': 'view-preference=mobile'
        }
      })
      
      const response = await middleware(request)
      
      // Should not redirect because cookie indicates recent preference
      expect(response.headers.get('location')).toBeNull()
    })

    it('should respect existing main preference cookie', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/tryon', {
        headers: { 
          'user-agent': 'iPhone',
          'cookie': 'view-preference=main'
        }
      })
      
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Static Asset and Route Exclusions', () => {
    it('should skip route mapping for API routes', async () => {
      const request = new NextRequest('https://example.com/api/tryon')
      
      const response = await middleware(request)
      
      expect(shouldRedirectToMobile).not.toHaveBeenCalled()
      expect(response.headers.get('location')).toBeNull()
    })

    it('should skip route mapping for mobile routes', async () => {
      const request = new NextRequest('https://example.com/m/home')
      
      const response = await middleware(request)
      
      expect(shouldRedirectToMobile).not.toHaveBeenCalled()
      expect(response.headers.get('location')).toBeNull()
    })

    it('should skip route mapping for static assets', async () => {
      const request = new NextRequest('https://example.com/images/logo.png')
      
      const response = await middleware(request)
      
      expect(shouldRedirectToMobile).not.toHaveBeenCalled()
      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Non-Phone Devices', () => {
    it('should not redirect tablets even with mapped routes', async () => {
      shouldRedirectToMobile.mockReturnValue(false)
      
      const request = new NextRequest('https://example.com/tryon', {
        headers: { 'user-agent': 'iPad' }
      })
      
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBeNull()
      expect(response.cookies.get('view-preference')?.value).toBe('main')
    })

    it('should not redirect desktop even with mapped routes', async () => {
      shouldRedirectToMobile.mockReturnValue(false)
      
      const request = new NextRequest('https://example.com/upload-angle', {
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      })
      
      const response = await middleware(request)
      
      expect(response.headers.get('location')).toBeNull()
      expect(response.cookies.get('view-preference')?.value).toBe('main')
    })
  })

  describe('Complex Route Scenarios', () => {
    it('should handle root path correctly', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/home')
    })

    it('should handle complex query strings', async () => {
      shouldRedirectToMobile.mockReturnValue(true)
      
      const request = new NextRequest('https://example.com/share?utm_source=social&utm_medium=facebook&ref=campaign123', {
        headers: { 'user-agent': 'iPhone' }
      })
      
      const response = await middleware(request)
      
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.com/m/share?utm_source=social&utm_medium=facebook&ref=campaign123')
    })

    it('should handle empty user agent gracefully', async () => {
      shouldRedirectToMobile.mockReturnValue(false)
      
      const request = new NextRequest('https://example.com/tryon')
      
      const response = await middleware(request)
      
      expect(shouldRedirectToMobile).toHaveBeenCalledWith('')
      expect(response.headers.get('location')).toBeNull()
    })
  })
})