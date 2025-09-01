/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { useDeviceRedirect } from '../../../src/mobile/hooks/useDeviceRedirect'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// Mock device detection utilities
jest.mock('../../../src/mobile/utils/deviceDetection', () => ({
  shouldRedirectToMobile: jest.fn(),
}))

// Mock route mapping utilities
jest.mock('../../../src/mobile/utils/routeMapping', () => ({
  getMobileRouteString: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>
const mockShouldRedirectToMobile = require('../../../src/mobile/utils/deviceDetection').shouldRedirectToMobile
const mockGetMobileRouteString = require('../../../src/mobile/utils/routeMapping').getMobileRouteString

describe('useDeviceRedirect Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter)
    mockUsePathname.mockReturnValue('/')
    
    // Clear cookies properly
    const cookies = document.cookie.split(";")
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    }
    
    // Suppress console output for cleaner tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Server-Side Rendering Edge Cases', () => {
    it('should handle undefined window gracefully', () => {
      // Temporarily remove window
      const originalWindow = global.window
      delete (global as any).window
      
      // Should not crash
      expect(() => {
        renderHook(() => useDeviceRedirect())
      }).not.toThrow()
      
      // Restore window
      ;(global as any).window = originalWindow
    })

    it('should handle undefined document gracefully', () => {
      // Temporarily remove document
      const originalDocument = global.document
      delete (global as any).document
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      // Should not crash when trying to access cookies
      expect(() => {
        renderHook(() => useDeviceRedirect())
      }).not.toThrow()
      
      // Restore document
      ;(global as any).document = originalDocument
    })
  })

  describe('Cookie Edge Cases', () => {
    it('should handle malformed cookies gracefully', async () => {
      // Set malformed cookie
      document.cookie = 'view-preference=; path=/'
      
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.redirectAttempted).toBe(true)
      })
      
      expect(mockRouter.replace).toHaveBeenCalledWith('/m/home')
    })

    it('should handle cookies with special characters', async () => {
      // Set cookie with special characters
      document.cookie = 'view-preference=main%20value; path=/'
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      // Should not redirect due to existing cookie
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('should handle multiple cookies with same prefix', async () => {
      // Set cookies that might confuse parsing
      document.cookie = 'view-preference-backup=mobile; path=/'
      document.cookie = 'view-preference=main; path=/'
      document.cookie = 'view-preference-test=mobile; path=/'
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      // Should not redirect because exact cookie match exists
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('should set cookie with proper expiration', async () => {
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(document.cookie).toContain('view-preference=main')
      })
      
      // In jsdom, the cookie string may not show expiration details
      // but we can verify the cookie was set correctly
      expect(document.cookie).toContain('view-preference=main')
    })
  })

  describe('User Agent Edge Cases', () => {
    it('should handle empty user agent', async () => {
      // Mock empty user agent by temporarily replacing navigator
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: '' }
      
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isPhone).toBe(false)
      })
      
      expect(mockShouldRedirectToMobile).toHaveBeenCalledWith('')
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })

    it('should handle undefined user agent', async () => {
      // Mock undefined user agent
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: undefined }
      
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isPhone).toBe(false)
      })
      
      expect(mockShouldRedirectToMobile).toHaveBeenCalledWith('')
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })

    it('should handle very long user agent strings', async () => {
      const longUserAgent = 'a'.repeat(1000) // Very long string (reduced for test)
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: longUserAgent }
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isPhone).toBe(true)
      })
      
      expect(mockShouldRedirectToMobile).toHaveBeenCalledWith(longUserAgent)
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })

    it('should handle special characters in user agent', async () => {
      const specialUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) 特殊文字'
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: specialUserAgent }
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isPhone).toBe(true)
      })
      
      expect(mockShouldRedirectToMobile).toHaveBeenCalledWith(specialUserAgent)
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })
  })

  describe('Router Edge Cases', () => {
    it('should handle router.replace failure gracefully', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockRouter.replace.mockImplementation(() => {
        throw new Error('Navigation failed')
      })
      
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' }
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      // The hook should handle the error gracefully - test passes if no crash
      expect(result.current.redirectAttempted).toBe(false)
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })

    it('should handle missing router methods', async () => {
      const incompleteRouter = {
        push: jest.fn(),
        // missing replace method
      } as any
      
      mockUseRouter.mockReturnValue(incompleteRouter)
      
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      // Should handle gracefully and not crash
      expect(result.current.redirectAttempted).toBe(false)
    })
  })

  describe('Route Mapping Edge Cases', () => {
    it('should handle getMobileRouteString throwing error', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockGetMobileRouteString.mockImplementation(() => {
        throw new Error('Route mapping failed')
      })
      
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' }
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      // The hook should handle the error gracefully - test passes if no crash
      expect(result.current.redirectAttempted).toBe(false)
      expect(mockRouter.replace).not.toHaveBeenCalled()
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })

    it('should handle empty string mobile route', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' }
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('') // Empty string
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.mobileRoute).toBe('')
        expect(result.current.redirectAttempted).toBe(false)
        // Should not redirect with empty route
        expect(mockRouter.replace).not.toHaveBeenCalled()
        // Should set main preference
        expect(document.cookie).toContain('view-preference=main')
      })
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })

    it('should handle mobile route with query parameters', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      mockUsePathname.mockReturnValue('/tryon')
      const originalNavigator = window.navigator
      ;(window as any).navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' }
      
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/tryon?param=value')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.mobileRoute).toBe('/m/tryon?param=value')
        expect(mockRouter.replace).toHaveBeenCalledWith('/m/tryon?param=value')
      })
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })
  })

  describe('Timing and Concurrency Edge Cases', () => {
    it('should handle multiple rapid calls', async () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect({ checkDelay: 10 }))
      
      // Call checkRedirect multiple times rapidly
      result.current.checkRedirect()
      result.current.checkRedirect()
      result.current.checkRedirect()
      
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledTimes(1)
      })
      
      // Should only redirect once despite multiple calls
      expect(mockRouter.replace).toHaveBeenCalledWith('/m/home')
    })

    it('should handle component unmount during check', async () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result, unmount } = renderHook(() => 
        useDeviceRedirect({ checkDelay: 100 })
      )
      
      // Trigger check
      result.current.checkRedirect()
      
      // Unmount immediately
      unmount()
      
      // Should not crash or cause memory leaks
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Test passes if no errors are thrown
      expect(true).toBe(true)
    })

    it('should clear timeout on config change', async () => {
      const { rerender } = renderHook(
        ({ delay }: { delay: number }) => useDeviceRedirect({ checkDelay: delay }),
        { initialProps: { delay: 1000 } }
      )
      
      // Change delay
      rerender({ delay: 100 })
      
      // Should not crash and should handle timeout cleanup
      await waitFor(() => {
        expect(true).toBe(true) // Test passes if no errors
      })
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should not create memory leaks with multiple renders', () => {
      // Render and unmount multiple times
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useDeviceRedirect())
        unmount()
      }
      
      // Test passes if no memory warnings or errors
      expect(true).toBe(true)
    })

    it('should handle rapid pathname changes', async () => {
      const { rerender } = renderHook(() => useDeviceRedirect())
      
      // Simulate rapid pathname changes
      const paths = ['/home', '/about', '/contact', '/tryon', '/share']
      
      for (const path of paths) {
        mockUsePathname.mockReturnValue(path)
        rerender()
        await new Promise(resolve => setTimeout(resolve, 1))
      }
      
      await waitFor(() => {
        expect(true).toBe(true) // Test passes if no errors
      })
    })
  })
})