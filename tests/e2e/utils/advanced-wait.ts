import { Page, Locator, expect } from '@playwright/test'

/**
 * Advanced wait utilities based on 2024 Playwright best practices
 * Focus on robust, retry-enabled patterns that avoid waitForSelector
 */
export class AdvancedWait {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Wait for element with built-in retry and smart polling
   * Uses Playwright's modern locator API with auto-waiting
   */
  async waitForLocator(
    locator: Locator,
    options: {
      timeout?: number
      description?: string
      state?: 'visible' | 'hidden' | 'attached' | 'detached'
    } = {}
  ): Promise<Locator> {
    const { timeout = 15000, description = '', state = 'visible' } = options
    
    // Use Playwright's built-in auto-waiting with locators
    await locator.waitFor({ state, timeout })
    
    // Additional verification for critical elements
    if (state === 'visible') {
      await expect(locator).toBeVisible({ timeout })
    }
    
    return locator
  }

  /**
   * Wait for React hydration and component readiness
   * Modern approach using state-based indicators
   */
  async waitForHydration(options: { timeout?: number } = {}): Promise<void> {
    const { timeout = 10000 } = options
    
    // Wait for React hydration to complete
    await this.page.waitForFunction(
      () => {
        // Check if React has hydrated
        const hasReactRoot = document.querySelector('[data-reactroot], #__next, #root')
        if (!hasReactRoot) return false
        
        // Check for hydration indicators
        const isHydrated = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || 
                          document.documentElement.hasAttribute('data-hydrated') ||
                          !document.querySelector('[data-reactroot] [data-react-checksum]')
        
        return isHydrated
      },
      undefined,
      { timeout, polling: 100 }
    )
  }

  /**
   * Smart button wait that ensures true interactivity
   */
  async waitForInteractiveButton(
    selector: string,
    options: { timeout?: number; description?: string } = {}
  ): Promise<Locator> {
    const { timeout = 15000, description = selector } = options
    const locator = this.page.locator(selector)
    
    // Use Playwright's built-in button assertions
    await expect(locator).toBeVisible({ timeout })
    await expect(locator).toBeEnabled({ timeout })
    
    // Ensure button is not covered by other elements
    await expect(locator).not.toBeHidden({ timeout })
    
    // Additional check for animations/transitions
    await this.page.waitForFunction(
      (sel) => {
        const button = document.querySelector(sel) as HTMLElement
        if (!button) return false
        
        const rect = button.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(button)
        
        // Ensure button is stable (not animating)
        return rect.width > 0 && 
               rect.height > 0 && 
               computedStyle.pointerEvents !== 'none' &&
               computedStyle.visibility !== 'hidden'
      },
      selector,
      { timeout: timeout / 3, polling: 100 }
    )
    
    return locator
  }

  /**
   * Wait for network stability and content load
   */
  async waitForNetworkStability(options: { 
    timeout?: number 
    idleTime?: number 
  } = {}): Promise<void> {
    const { timeout = 10000, idleTime = 500 } = options
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout })
    
    // Additional wait for any lingering async operations
    await this.page.waitForTimeout(idleTime)
  }

  /**
   * Robust element interaction with retry logic
   */
  async performActionWithRetry<T>(
    action: () => Promise<T>,
    options: {
      maxRetries?: number
      retryDelay?: number
      description?: string
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 1000, description = 'action' } = options
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await action()
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`${description} failed after ${maxRetries} attempts: ${error}`)
        }
        
        console.log(`${description} attempt ${attempt} failed, retrying in ${retryDelay}ms...`)
        await this.page.waitForTimeout(retryDelay)
      }
    }
    
    throw new Error(`Unexpected error in ${description}`)
  }

  /**
   * Wait for React component to render with content
   */
  async waitForComponentWithContent(
    selector: string,
    options: {
      timeout?: number
      minContent?: boolean
      description?: string
    } = {}
  ): Promise<Locator> {
    const { timeout = 15000, minContent = true, description = selector } = options
    const locator = this.page.locator(selector)
    
    // Wait for element to be visible
    await expect(locator).toBeVisible({ timeout })
    
    if (minContent) {
      // Ensure element has meaningful content
      await this.page.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel)
          if (!element) return false
          
          const hasTextContent = (element.textContent?.trim().length ?? 0) > 0
          const hasChildren = element.children.length > 0
          const hasImages = element.querySelector('img') !== null
          
          return hasTextContent || hasChildren || hasImages
        },
        selector,
        { timeout: timeout / 2, polling: 200 }
      )
    }
    
    return locator
  }

  /**
   * Smart file upload wait
   */
  async waitForFileUpload(
    inputSelector: string,
    filePath: string,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const { timeout = 10000 } = options
    
    // Set the file
    await this.page.setInputFiles(inputSelector, filePath)
    
          // Verify file was set
      await this.page.waitForFunction(
        (sel) => {
          const input = document.querySelector(sel) as HTMLInputElement
          return input?.files && input.files.length > 0
        },
        inputSelector,
        { timeout, polling: 100 }
      )
  }
}
