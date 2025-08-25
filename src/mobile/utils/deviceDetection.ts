import { UAParser } from 'ua-parser-js'
import type { DeviceInfo } from '../types'

/**
 * Detects if the user agent represents a phone device
 * Distinguishes phones from tablets and desktops
 * @param userAgent - User agent string from request headers
 * @returns true if the device is identified as a phone
 */
export function isPhoneDevice(userAgent: string): boolean {
  if (!userAgent) return false

  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  const os = parser.getOS()
  
  // Primary check: device type is 'mobile'
  if (device.type === 'mobile') {
    return true
  }

  // Additional checks for edge cases where device.type might not be set correctly
  const lowerUA = userAgent.toLowerCase()
  
  // Exclude tablet patterns first (more specific)
  const tabletPatterns = [
    /ipad/i,
    /tablet/i,
    /kindle/i,
    /silk/i,
    /playbook/i
  ]

  // Check if it's explicitly a tablet first
  for (const pattern of tabletPatterns) {
    if (pattern.test(lowerUA)) {
      return false
    }
  }

  // Special case for Android devices - check for tablet indicators
  if (lowerUA.includes('android')) {
    // If it contains 'tablet' or lacks 'mobile', it's likely a tablet
    if (lowerUA.includes('tablet') || !lowerUA.includes('mobile')) {
      return false
    }
    // If it has 'mobile', it's likely a phone
    return true
  }

  // Check for phone-specific patterns
  const phonePatterns = [
    /iphone/i,
    /ipod/i,
    /blackberry/i,
    /windows phone/i,
    /mobile/i
  ]

  // Check if it matches phone patterns
  for (const pattern of phonePatterns) {
    if (pattern.test(lowerUA)) {
      return true
    }
  }

  // Special handling for iPad which often has desktop-like UA
  if (os.name === 'iOS' && !lowerUA.includes('iphone') && !lowerUA.includes('ipod')) {
    // Likely an iPad - check for specific iPad indicators
    if (lowerUA.includes('ipad') || lowerUA.includes('macintosh')) {
      return false // iPad is not a phone
    }
  }

  return false
}

/**
 * Detects if the user agent represents a tablet device
 * @param userAgent - User agent string from request headers
 * @returns true if the device is identified as a tablet
 */
export function isTabletDevice(userAgent: string): boolean {
  if (!userAgent) return false

  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  const lowerUA = userAgent.toLowerCase()

  // Primary check: device type is 'tablet'
  if (device.type === 'tablet') {
    return true
  }

  // Tablet-specific patterns
  const tabletPatterns = [
    /ipad/i,
    /tablet/i,
    /kindle/i,
    /silk/i,
    /playbook/i
  ]

  for (const pattern of tabletPatterns) {
    if (pattern.test(lowerUA)) {
      return true
    }
  }

  // Special case for Android tablets
  if (lowerUA.includes('android')) {
    // Android tablets typically have 'tablet' in UA or lack 'mobile'
    if (lowerUA.includes('tablet') || !lowerUA.includes('mobile')) {
      return true
    }
  }

  return false
}

/**
 * Detects if the user agent represents any mobile device (phone or tablet)
 * @param userAgent - User agent string from request headers
 * @returns true if the device is mobile (phone or tablet)
 */
export function isMobileDevice(userAgent: string): boolean {
  return isPhoneDevice(userAgent) || isTabletDevice(userAgent)
}

/**
 * Gets comprehensive device information from user agent
 * @param userAgent - User agent string from request headers
 * @returns DeviceInfo object with device classification details
 */
export function getDeviceInfo(userAgent: string): DeviceInfo {
  const isPhone = isPhoneDevice(userAgent)
  const isTablet = isTabletDevice(userAgent)
  const isMobile = isPhone || isTablet

  return {
    isPhone,
    isTablet,
    isMobile,
    userAgent
  }
}

/**
 * Gets device type as a string for easier consumption
 * @param userAgent - User agent string from request headers
 * @returns 'phone', 'tablet', or 'desktop'
 */
export function getDeviceType(userAgent: string): 'phone' | 'tablet' | 'desktop' {
  if (isPhoneDevice(userAgent)) {
    return 'phone'
  }
  if (isTabletDevice(userAgent)) {
    return 'tablet'
  }
  return 'desktop'
}

/**
 * Utility for Next.js middleware - checks if request should be redirected to mobile
 * @param userAgent - User agent string from request headers
 * @returns true if the request should be redirected to mobile routes
 */
export function shouldRedirectToMobile(userAgent: string): boolean {
  // Only redirect phones to mobile, keep tablets on desktop version
  return isPhoneDevice(userAgent)
}