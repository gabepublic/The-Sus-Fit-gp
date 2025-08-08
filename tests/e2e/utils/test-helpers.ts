import { Page, Locator, expect } from '@playwright/test'

/**
 * Modern test helper patterns based on 2024 Playwright best practices
 * Focuses on robust, resilient patterns that eliminate flakiness
 */

/**
 * Wait for component to be fully rendered and interactive
 * Uses modern expect patterns with built-in retry
 */
export async function waitForComponent(
  page: Page,
  selector: string,
  options: {
    timeout?: number
    hasContent?: boolean
    description?: string
  } = {}
): Promise<Locator> {
  const { timeout = 15000, hasContent = true, description = selector } = options
  const locator = page.locator(selector)
  
  // Use Playwright's built-in assertions with retry
  await expect(locator).toBeVisible({ timeout })
  await expect(locator).toBeAttached({ timeout })
  
  if (hasContent) {
    // Ensure component has meaningful content
    await expect(locator).not.toBeEmpty({ timeout })
  }
  
  return locator
}

/**
 * Robust file upload that ensures state is properly updated
 */
export async function uploadFileReliably(
  page: Page,
  inputSelector: string,
  filePath: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options
  const inputLocator = page.locator(inputSelector)
  
  // Ensure input exists and is ready
  await expect(inputLocator).toBeVisible({ timeout })
  await expect(inputLocator).toBeEnabled({ timeout })
  
  // Perform file upload
  await inputLocator.setInputFiles(filePath)
  
  // Verify file was uploaded using expect with retry
  await expect(inputLocator).toHaveJSProperty('files.length', 1, { timeout })
}

/**
 * Wait for button to be truly clickable with comprehensive checks
 */
export async function waitForClickableButton(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<Locator> {
  const { timeout = 15000 } = options
  const buttonLocator = page.locator(selector)
  
  // Use built-in Playwright assertions
  await expect(buttonLocator).toBeVisible({ timeout })
  await expect(buttonLocator).toBeEnabled({ timeout })
  await expect(buttonLocator).not.toHaveAttribute('aria-disabled', 'true', { timeout })
  
  return buttonLocator
}

/**
 * Perform action with built-in retry using Playwright's retry mechanisms
 */
export async function clickWithRetry(
  locator: Locator,
  options: { timeout?: number; force?: boolean } = {}
): Promise<void> {
  const { timeout = 10000, force = false } = options
  
  // Playwright locators have built-in retry, just use them
  await locator.click({ timeout, force })
}

/**
 * Wait for network and React state to stabilize
 */
export async function waitForStability(
  page: Page,
  options: { 
    networkIdle?: boolean
    reactStable?: boolean
    timeout?: number
  } = {}
): Promise<void> {
  const { networkIdle = true, reactStable = true, timeout = 10000 } = options
  
  if (networkIdle) {
    await page.waitForLoadState('networkidle', { timeout })
  }
  
  if (reactStable) {
    // Wait for React to finish any pending updates
    await page.waitForFunction(
      () => {
        // Check if React's scheduler is idle
        if (typeof (window as any).React !== 'undefined') {
          return !(window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.scheduleCallback
        }
        
        // Fallback: check if DOM mutations have settled
        return new Promise(resolve => {
          let timer: NodeJS.Timeout
          const observer = new MutationObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(() => {
              observer.disconnect()
              resolve(true)
            }, 100)
          })
          
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          })
          
          // If no mutations in 100ms, consider stable
          timer = setTimeout(() => {
            observer.disconnect()
            resolve(true)
          }, 100)
        })
      },
      undefined,
      { timeout, polling: 100 }
    )
  }
}

/**
 * Modern image loading verification
 */
export async function waitForImageLoad(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<Locator> {
  const { timeout = 15000 } = options
  const imageLocator = page.locator(selector)
  
  // Wait for image to be visible
  await expect(imageLocator).toBeVisible({ timeout })
  
  // Verify image is actually loaded (not just present)
  await page.waitForFunction(
    (sel) => {
      const img = document.querySelector(sel) as HTMLImageElement
      return img && img.complete && img.naturalHeight > 0 && img.naturalWidth > 0
    },
    selector,
    { timeout, polling: 100 }
  )
  
  return imageLocator
}

/**
 * Comprehensive page readiness check
 */
export async function waitForPageReady(
  page: Page,
  options: {
    waitForHydration?: boolean
    waitForFonts?: boolean
    timeout?: number
  } = {}
): Promise<void> {
  const { waitForHydration = true, waitForFonts = false, timeout = 15000 } = options
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout })
  
  if (waitForHydration) {
    // Wait for React/Next.js hydration
    await page.waitForFunction(
      () => {
        // Check for Next.js hydration
        if ((window as any).__NEXT_HYDRATED) return true
        
        // Check for React hydration markers
        const reactRoot = document.querySelector('[data-reactroot], #__next, #root')
        if (reactRoot && !(reactRoot as any)._reactInternalFiber && !(reactRoot as any)._reactInternalInstance) {
          return true // Modern React (no legacy markers)
        }
        
        // Fallback: check if critical elements are interactive
        const interactiveElements = document.querySelectorAll('button, input, [role="button"]')
        return Array.from(interactiveElements).some(el => 
          (el as HTMLElement).onclick !== null || 
          el.hasAttribute('data-testid')
        )
      },
      undefined,
      { timeout, polling: 100 }
    )
  }
  
  if (waitForFonts) {
    // Wait for fonts to load
    await page.waitForFunction(
      () => (document as any).fonts && (document as any).fonts.ready,
      undefined,
      { timeout }
    )
  }
}
