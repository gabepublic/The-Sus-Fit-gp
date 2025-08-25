'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { shouldRedirectToMobile } from '../utils/deviceDetection'
import { getMobileRouteString } from '../utils/routeMapping'

/**
 * Configuration options for the device redirect hook
 */
export interface DeviceRedirectConfig {
  /** Whether to enable the client-side redirect check */
  enabled?: boolean
  /** Delay in milliseconds before checking (for debouncing) */
  checkDelay?: number
  /** Whether to use replace instead of push for navigation */
  useReplace?: boolean
  /** Custom cookie name for view preference */
  cookieName?: string
  /** Whether to log debug information */
  debug?: boolean
}

/**
 * Return values from the device redirect hook
 */
export interface DeviceRedirectResult {
  /** Whether the current device is detected as a phone */
  isPhone: boolean
  /** Whether a redirect check is in progress */
  isChecking: boolean
  /** Whether a redirect was attempted */
  redirectAttempted: boolean
  /** The mobile route that would be redirected to (if any) */
  mobileRoute: string | null
  /** Function to manually trigger a redirect check */
  checkRedirect: () => void
}

/**
 * Default configuration for the device redirect hook
 */
const DEFAULT_CONFIG: Required<DeviceRedirectConfig> = {
  enabled: true,
  checkDelay: 100,
  useReplace: true,
  cookieName: 'view-preference',
  debug: false
}

/**
 * Helper to get cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue || null
  }
  return null
}

/**
 * Helper to set cookie with expiration
 * @param name Cookie name
 * @param value Cookie value
 * @param maxAgeSeconds Max age in seconds
 */
function setCookie(name: string, value: string, maxAgeSeconds: number = 300): void {
  if (typeof document === 'undefined') return
  
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

/**
 * Client-side device detection hook that serves as a safety net for server-side detection
 * 
 * This hook runs after hydration to catch cases where:
 * - Server-side detection was inconclusive or failed
 * - User agent was not available on server-side
 * - Edge cases where middleware didn't run
 * 
 * @param config Configuration options for the hook
 * @returns Device redirect result object
 */
export function useDeviceRedirect(config: DeviceRedirectConfig = {}): DeviceRedirectResult {
  const router = useRouter()
  const pathname = usePathname()
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  
  // State management
  const [isPhone, setIsPhone] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [mobileRoute, setMobileRoute] = useState<string | null>(null)
  
  // Refs for managing timeouts and preventing duplicate checks
  const timeoutRef = useRef<NodeJS.Timeout>()
  const hasCheckedRef = useRef(false)
  const isClientSideRef = useRef(false)
  
  /**
   * Performs the actual device detection and redirect logic
   */
  const performRedirectCheck = (forceCheck: boolean = false) => {
    if ((!mergedConfig.enabled && !forceCheck) || typeof window === 'undefined') {
      return
    }

    if (mergedConfig.debug) {
      console.log('[useDeviceRedirect] Starting redirect check')
    }

    setIsChecking(true)
    
    try {
      // Check if we're already on a mobile route
      if (pathname.startsWith('/m/')) {
        if (mergedConfig.debug) {
          console.log('[useDeviceRedirect] Already on mobile route, skipping')
        }
        setIsChecking(false)
        return
      }

      // Check for existing view preference cookie
      const viewPreference = getCookie(mergedConfig.cookieName)
      if (viewPreference === 'main' || viewPreference === 'mobile') {
        if (mergedConfig.debug) {
          console.log('[useDeviceRedirect] View preference cookie exists:', viewPreference)
        }
        setIsChecking(false)
        return
      }

      // Get user agent and detect device
      const userAgent = navigator.userAgent || ''
      const phoneDetected = shouldRedirectToMobile(userAgent)
      setIsPhone(phoneDetected)

      if (mergedConfig.debug) {
        console.log('[useDeviceRedirect] Device detection:', { userAgent, phoneDetected })
      }

      if (phoneDetected) {
        // Get the mobile route for current path
        const mobilePath = getMobileRouteString(pathname)
        setMobileRoute(mobilePath)

        if (mobilePath && mobilePath !== pathname) {
          if (mergedConfig.debug) {
            console.log('[useDeviceRedirect] Redirecting to mobile route:', mobilePath)
          }

          // Set cookie to prevent loops
          setCookie(mergedConfig.cookieName, 'mobile', 300)
          
          // Perform redirect
          if (mergedConfig.useReplace) {
            router.replace(mobilePath)
          } else {
            router.push(mobilePath)
          }
          
          setRedirectAttempted(true)
        } else {
          // No mobile route available, set main preference
          setCookie(mergedConfig.cookieName, 'main', 300)
          
          if (mergedConfig.debug) {
            console.log('[useDeviceRedirect] No mobile route available, staying on main')
          }
        }
      } else {
        // Not a phone, set main preference
        setCookie(mergedConfig.cookieName, 'main', 300)
        
        if (mergedConfig.debug) {
          console.log('[useDeviceRedirect] Not a phone device, staying on main')
        }
      }
    } catch (error) {
      console.error('[useDeviceRedirect] Error during redirect check:', error)
    } finally {
      setIsChecking(false)
    }
  }

  /**
   * Debounced redirect check function
   */
  const checkRedirect = (forceCheck: boolean = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      performRedirectCheck(forceCheck)
      hasCheckedRef.current = true
    }, mergedConfig.checkDelay)
  }

  // Effect to run client-side detection after hydration
  useEffect(() => {
    // Mark as client-side
    isClientSideRef.current = true

    // Only run once per component lifecycle
    if (hasCheckedRef.current) {
      return
    }

    // Skip if disabled
    if (!mergedConfig.enabled) {
      return
    }

    if (mergedConfig.debug) {
      console.log('[useDeviceRedirect] Initializing client-side detection')
    }

    // Run the check
    checkRedirect()

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [mergedConfig.enabled, mergedConfig.checkDelay, mergedConfig.debug])

  // Effect to reset check flag when pathname changes
  useEffect(() => {
    hasCheckedRef.current = false
  }, [pathname])

  return {
    isPhone,
    isChecking,
    redirectAttempted,
    mobileRoute,
    checkRedirect
  }
}

/**
 * Simplified version of the device redirect hook that only returns whether device is a phone
 * Useful for conditional rendering without redirect behavior
 * 
 * @returns Whether the current device is detected as a phone
 */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(false)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (hasCheckedRef.current || typeof window === 'undefined') {
      return
    }

    const userAgent = navigator.userAgent || ''
    const phoneDetected = shouldRedirectToMobile(userAgent)
    setIsPhone(phoneDetected)
    hasCheckedRef.current = true
  }, [])

  return isPhone
}

/**
 * Hook to check if client-side detection is available
 * Useful for SSR-safe conditional logic
 * 
 * @returns Whether we're running on the client side
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}