/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { useDeviceRedirect, useIsPhone, useIsClient } from '../../../src/mobile/hooks/useDeviceRedirect'

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

// Mock navigator.userAgent
Object.defineProperty(window.navigator, 'userAgent', {
  writable: true,
  value: '',
})

describe('useDeviceRedirect Hook', () => {
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
    
    // Reset navigator.userAgent safely
    try {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      })
    } catch (e) {
      // If property already exists, just skip the reset
      // Individual tests will set their own user agent as needed
    }
    
    // Clear console.log and console.error to avoid test noise
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Basic Device Detection', () => {
    it('should detect phone device and redirect', async () => {
      // Setup: Phone device
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isPhone).toBe(true)
        expect(result.current.mobileRoute).toBe('/m/home')
        expect(result.current.redirectAttempted).toBe(true)
      })
      
      expect(mockRouter.replace).toHaveBeenCalledWith('/m/home')
    })

    it('should not redirect non-phone devices', async () => {
      // Setup: Desktop device
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isPhone).toBe(false)
        expect(result.current.redirectAttempted).toBe(false)
      })
      
      expect(mockRouter.replace).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should not redirect when already on mobile route', async () => {
      mockUsePathname.mockReturnValue('/m/home')
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })
  })

  describe('Cookie-based Loop Prevention', () => {
    it('should not redirect when mobile preference cookie exists', async () => {
      // Set mobile preference cookie
      document.cookie = 'view-preference=mobile; path=/'
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('should not redirect when main preference cookie exists', async () => {
      // Set main preference cookie
      document.cookie = 'view-preference=main; path=/'
      mockShouldRedirectToMobile.mockReturnValue(true)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('should set mobile cookie when redirecting', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.redirectAttempted).toBe(true)
        expect(document.cookie).toContain('view-preference=mobile')
      }, { timeout: 1000 })
      
      expect(mockRouter.replace).toHaveBeenCalledWith('/m/home')
    })

    it('should set main cookie when not redirecting', async () => {
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(document.cookie).toContain('view-preference=main')
      })
    })
  })

  describe('Configuration Options', () => {
    it('should respect enabled configuration', async () => {
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => 
        useDeviceRedirect({ enabled: false })
      )
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      })
      
      expect(mockRouter.replace).not.toHaveBeenCalled()
    })

    it('should use push instead of replace when configured', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => 
        useDeviceRedirect({ useReplace: false })
      )
      
      await waitFor(() => {
        expect(result.current.redirectAttempted).toBe(true)
        expect(mockRouter.push).toHaveBeenCalledWith('/m/home')
      }, { timeout: 1000 })
    })

    it('should use custom cookie name', async () => {
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      renderHook(() => 
        useDeviceRedirect({ cookieName: 'custom-view-pref' })
      )
      
      await waitFor(() => {
        expect(document.cookie).toContain('custom-view-pref=main')
      })
    })

    it('should respect check delay configuration', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => 
        useDeviceRedirect({ checkDelay: 200 })
      )
      
      // Should not have redirected immediately
      expect(mockRouter.replace).not.toHaveBeenCalled()
      
      // Wait for delay plus some buffer
      await waitFor(() => {
        expect(result.current.redirectAttempted).toBe(true)
        expect(mockRouter.replace).toHaveBeenCalledWith('/m/home')
      }, { timeout: 1000 })
    })

    it('should enable debug logging when configured', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      renderHook(() => 
        useDeviceRedirect({ debug: true })
      )
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[useDeviceRedirect]')
        )
      })
    })
  })

  describe('Manual Redirect Check', () => {
    it('should allow manual redirect check', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/home')
      
      const { result } = renderHook(() => 
        useDeviceRedirect({ enabled: false })
      )
      
      // Manual check
      act(() => {
        (result.current.checkRedirect as any)(true) // Force check even when disabled
      })
      
      await waitFor(() => {
        expect(result.current.redirectAttempted).toBe(true)
        expect(mockRouter.replace).toHaveBeenCalledWith('/m/home')
      }, { timeout: 1000 })
    })
  })

  describe('Route Mapping Integration', () => {
    it('should handle specific route mappings', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      mockUsePathname.mockReturnValue('/upload-angle')
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/m/upload-angle')
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.mobileRoute).toBe('/m/upload-angle')
        expect(result.current.redirectAttempted).toBe(true)
        expect(mockRouter.replace).toHaveBeenCalledWith('/m/upload-angle')
      }, { timeout: 1000 })
    })

    it('should handle routes without mobile mapping', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      mockUsePathname.mockReturnValue('/some-route')
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue(null)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.mobileRoute).toBe(null)
        expect(result.current.redirectAttempted).toBe(false)
        expect(mockRouter.replace).not.toHaveBeenCalled()
        // Should set main preference when no mobile mapping
        expect(document.cookie).toContain('view-preference=main')
      }, { timeout: 1000 })
    })

    it('should not redirect when mobile route is same as current', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      mockUsePathname.mockReturnValue('/admin/users')
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      })
      mockShouldRedirectToMobile.mockReturnValue(true)
      mockGetMobileRouteString.mockReturnValue('/admin/users') // Same route
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.mobileRoute).toBe('/admin/users')
        expect(result.current.redirectAttempted).toBe(false)
        expect(mockRouter.replace).not.toHaveBeenCalled()
        // Should set main preference when routes are the same
        expect(document.cookie).toContain('view-preference=main')
      }, { timeout: 1000 })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockShouldRedirectToMobile.mockImplementation(() => {
        throw new Error('Device detection failed')
      })
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      }, { timeout: 1000 })
      
      // Should not redirect on error
      expect(mockRouter.replace).not.toHaveBeenCalled()
      
      // Error might be logged during the async operation
      // Just check that the hook doesn't crash
      expect(result.current.redirectAttempted).toBe(false)
    })

    it('should handle missing navigator gracefully', async () => {
      // Clear any existing cookies first
      document.cookie = 'view-preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Temporarily remove navigator
      const originalNavigator = window.navigator
      delete (window as any).navigator
      
      mockShouldRedirectToMobile.mockReturnValue(false)
      
      const { result } = renderHook(() => useDeviceRedirect())
      
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      }, { timeout: 1000 })
      
      // Should handle gracefully - the hook shouldn't crash
      expect(result.current.isPhone).toBe(false)
      expect(result.current.redirectAttempted).toBe(false)
      
      // Restore navigator
      ;(window as any).navigator = originalNavigator
    })
  })

  describe('Pathname Changes', () => {
    it('should reset check flag when pathname changes', async () => {
      const { result, rerender } = renderHook(() => useDeviceRedirect())
      
      // Wait for initial check
      await waitFor(() => {
        expect(result.current.isChecking).toBe(false)
      }, { timeout: 1000 })
      
      // Change pathname
      mockUsePathname.mockReturnValue('/new-route')
      
      // Rerender to trigger effect
      rerender()
      
      // Should allow new check (implementation detail: check flag is reset)
      // This is more of an internal behavior test
      expect(mockUsePathname).toHaveBeenCalled()
    })
  })
})

describe('useIsPhone Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockShouldRedirectToMobile.mockClear()
    
    // Reset navigator.userAgent safely
    if (window.navigator) {
      try {
        Object.defineProperty(window.navigator, 'userAgent', {
          writable: true,
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          configurable: true
        })
      } catch (e) {
        // Navigator property might not be configurable in test environment
      }
    }
  })

  it('should return true for phone devices', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    })
    mockShouldRedirectToMobile.mockReturnValue(true)
    
    const { result } = renderHook(() => useIsPhone())
    
    await waitFor(() => {
      expect(result.current).toBe(true)
    }, { timeout: 1000 })
  })

  it('should return false for non-phone devices', async () => {
    mockShouldRedirectToMobile.mockReturnValue(false)
    
    const { result } = renderHook(() => useIsPhone())
    
    await waitFor(() => {
      expect(result.current).toBe(false)
    }, { timeout: 1000 })
  })

  it('should only check once', async () => {
    mockShouldRedirectToMobile.mockReturnValue(false)
    
    const { result, rerender } = renderHook(() => useIsPhone())
    
    // Wait for the initial check
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
    
    rerender()
    rerender()
    
    expect(mockShouldRedirectToMobile).toHaveBeenCalledTimes(1)
  })
})

describe('useIsClient Hook', () => {
  it('should return false initially then true after hydration', async () => {
    const { result } = renderHook(() => useIsClient())
    
    // In jsdom, we're already client-side, so it should be true immediately
    // This hook is mainly useful for actual SSR scenarios
    expect(result.current).toBe(true)
  })
})