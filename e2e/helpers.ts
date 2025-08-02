import { Page, Locator, expect } from '@playwright/test'

// Mock anime image data (1x1 transparent PNG)
export const MOCK_ANIME_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
export const MOCK_ANIME_RESPONSE = `data:image/png;base64,${MOCK_ANIME_BASE64}`

/**
 * ============================================================================
 * CAMERA READINESS HELPERS
 * ============================================================================
 * These functions handle camera initialization and readiness checks.
 * Used in beforeEach hooks and camera-dependent tests.
 */

/**
 * Wait for camera to be ready with retry logic
 * 
 * REPEATED PATTERN: Camera initialization with retry logic
 * - Used in: retake-flow.spec.ts beforeEach
 * - Handles: Video element existence, srcObject, readyState, paused state, currentTime
 * - Retry logic: Attempts every 8 seconds within overall timeout
 * 
 * @param page - Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForCameraReady(page: Page, timeout = 20000): Promise<void> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      await page.waitForFunction(() => {
        const video = document.querySelector('#camera-stream') as HTMLVideoElement
        if (!video) {
          console.log('Camera ready check: No video element found')
          return false
        }
        if (!video.srcObject) {
          console.log('Camera ready check: No srcObject')
          return false
        }
        if (video.readyState < 2) {
          console.log('Camera ready check: readyState < 2, current:', video.readyState)
          return false
        }
        if (video.paused) {
          console.log('Camera ready check: Video is paused')
          return false
        }
        if (video.currentTime <= 0) {
          console.log('Camera ready check: currentTime <= 0, current:', video.currentTime)
          return false
        }
        console.log('Camera ready check: All conditions met')
        return true
      }, { timeout: 8000 })
      return // Success
    } catch (error) {
      // If we're still within the overall timeout, try again
      if (Date.now() - startTime < timeout - 8000) {
        console.log('Camera not ready yet, retrying...')
        // Wait for video element to be visible before retry
        await page.waitForSelector('#camera-stream', { timeout: 5000 })
      } else {
        throw error // Re-throw if we've exceeded the timeout
      }
    }
  }
}

/**
 * Wait for camera to be ready or handle fallback states
 * 
 * REPEATED PATTERN: Camera initialization with error handling
 * - Used in: anime-transformation.spec.ts, selfie-anime.spec.ts beforeEach
 * - Handles: Camera access denied errors, partial initialization
 * - Returns: boolean indicating if camera is fully ready
 * 
 * @param page - Playwright page object
 * @returns Promise<boolean> - true if camera is ready, false if fallback state
 */
export async function waitForCameraOrFallback(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(() => {
      const video = document.querySelector('video#camera-stream') as HTMLVideoElement
      return video && video.srcObject && video.readyState >= 3
    }, { timeout: 15000 })
    return true
  } catch (error) {
    console.log('Camera not ready, checking for fallback state...')
    
    // Check if there's a camera error message
    const errorAlert = page.locator('text=Camera access denied')
    const hasError = await errorAlert.isVisible()
    
    if (hasError) {
      console.log('Camera access error detected, proceeding with test')
      return false
    }
    
    // Check if video element exists but might not be ready
    const video = page.locator('video#camera-stream')
    const exists = await video.count() > 0
    
    if (exists) {
      console.log('Video element exists but not ready, proceeding anyway')
      return false
    }
    
    throw new Error('Camera initialization failed completely')
  }
}

/**
 * ============================================================================
 * BUTTON STATE VERIFICATION HELPERS
 * ============================================================================
 * These functions verify button states at different stages of the user journey.
 * Used to ensure UI consistency and prevent race conditions.
 */

/**
 * Verify initial button states (camera ready, no selfie captured)
 * 
 * REPEATED PATTERN: Initial UI state verification
 * - Used in: baseline.spec.ts, selfie-anime.spec.ts
 * - Verifies: take-btn enabled, download/retake/generate disabled
 * - Context: Camera ready, no selfie captured yet
 * 
 * @param page - Playwright page object
 */
export async function verifyInitialButtonStates(page: Page): Promise<void> {
  await expect(page.locator('#take-btn')).toBeEnabled()
  await expect(page.locator('#download-btn')).toBeDisabled()
  await expect(page.locator('#retake-btn')).toBeDisabled()
  await expect(page.locator('#generate-anime-btn')).toBeDisabled()
}

/**
 * Verify button states after selfie capture
 * 
 * REPEATED PATTERN: Post-capture UI state verification
 * - Used in: selfie-anime.spec.ts, retake-flow.spec.ts
 * - Verifies: take-btn disabled, download/retake/generate enabled
 * - Context: Selfie captured, ready for anime generation
 * 
 * @param page - Playwright page object
 */
export async function verifyAfterSelfieCapture(page: Page): Promise<void> {
  await expect(page.locator('#take-btn')).toBeDisabled()
  await expect(page.locator('#download-btn')).toBeEnabled()
  await expect(page.locator('#retake-btn')).toBeEnabled()
  await expect(page.locator('#generate-anime-btn')).toBeEnabled()
}

/**
 * Verify button states after retake (back to initial state)
 * 
 * REPEATED PATTERN: Post-retake UI state verification
 * - Used in: retake-flow.spec.ts
 * - Verifies: take-btn enabled, download/retake/generate disabled
 * - Context: Retake completed, back to initial state
 * 
 * @param page - Playwright page object
 */
export async function verifyAfterRetake(page: Page): Promise<void> {
  await expect(page.locator('#take-btn')).toBeEnabled()
  await expect(page.locator('#download-btn')).toBeDisabled()
  await expect(page.locator('#retake-btn')).toBeDisabled()
  await expect(page.locator('#generate-anime-btn')).toBeDisabled()
}

/**
 * ============================================================================
 * SELFIE CAPTURE HELPERS
 * ============================================================================
 * These functions handle selfie capture verification and preview management.
 * Used in retake flow and main user journey tests.
 */

/**
 * Wait for selfie to be captured and verify
 * 
 * REPEATED PATTERN: Selfie capture verification
 * - Used in: anime-transformation.spec.ts, selfie-anime.spec.ts
 * - Waits for: #selfie-img to be visible
 * - Returns: Selfie image locator for further verification
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise<Locator> - Selfie image locator
 */
export async function waitForSelfieCapture(page: Page, timeout = 5000): Promise<Locator> {
  const selfieImg = page.locator('#selfie-img')
  await expect(selfieImg).toBeVisible({ timeout })
  return selfieImg
}

/**
 * Wait for selfie preview to appear (for retake flow tests)
 * 
 * REPEATED PATTERN: Selfie preview appearance
 * - Used in: retake-flow.spec.ts
 * - Waits for: img[alt="Captured selfie preview"] to be visible
 * - Context: After clicking take button in retake flow
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForSelfiePreview(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('img[alt="Captured selfie preview"]', { timeout })
}

/**
 * Wait for selfie preview to disappear (for retake flow tests)
 * 
 * REPEATED PATTERN: Selfie preview disappearance
 * - Used in: retake-flow.spec.ts
 * - Waits for: img[alt="Captured selfie preview"] to be hidden
 * - Context: After clicking retake button
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForSelfiePreviewHidden(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('img[alt="Captured selfie preview"]', { state: 'hidden', timeout })
}

/**
 * ============================================================================
 * ANIME GENERATION HELPERS
 * ============================================================================
 * These functions handle anime generation verification and image source validation.
 * Used in transformation tests and download tests.
 */

/**
 * Wait for anime generation to complete
 * 
 * REPEATED PATTERN: Anime generation completion
 * - Used in: anime-transformation.spec.ts, selfie-anime.spec.ts, download-feature.spec.ts
 * - Waits for: #anime-img to be visible
 * - Context: After clicking generate anime button
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 15000)
 * @returns Promise<Locator> - Anime image locator
 */
export async function waitForAnimeGeneration(page: Page, timeout = 15000): Promise<Locator> {
  const animeImg = page.locator('#anime-img')
  await expect(animeImg).toBeVisible({ timeout })
  return animeImg
}

/**
 * Verify anime image has correct source
 * 
 * REPEATED PATTERN: Anime image source verification
 * - Used in: anime-transformation.spec.ts, download-feature.spec.ts
 * - Verifies: #anime-img src attribute matches expected value
 * - Note: More reliable than naturalWidth for mock data
 * 
 * @param page - Playwright page object
 * @param expectedSrc - Expected image source
 * @param timeout - Timeout in milliseconds (default: 5000)
 */
export async function verifyAnimeImageSource(page: Page, expectedSrc: string, timeout = 5000): Promise<void> {
  const animeImg = page.locator('#anime-img')
  await expect(animeImg).toHaveAttribute('src', expectedSrc, { timeout })
}

/**
 * ============================================================================
 * LOADING STATE HELPERS
 * ============================================================================
 * These functions handle loading spinner states during anime generation.
 * Used to ensure proper loading state management and prevent race conditions.
 */

/**
 * Wait for loading spinner to appear
 * 
 * REPEATED PATTERN: Loading state appearance
 * - Used in: retake-flow.spec.ts, anime-transformation.spec.ts
 * - Waits for: [data-testid="spinner-container"] to be visible
 * - Context: After clicking generate anime button
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 5000)
 */
export async function waitForSpinnerVisible(page: Page, timeout = 5000): Promise<void> {
  await page.waitForSelector('[data-testid="spinner-container"]', { timeout })
}

/**
 * Wait for loading spinner to disappear
 * 
 * REPEATED PATTERN: Loading state completion
 * - Used in: retake-flow.spec.ts, download-feature.spec.ts
 * - Waits for: [data-testid="spinner-container"] to be hidden
 * - Context: After anime generation completes or fails
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 15000)
 */
export async function waitForSpinnerHidden(page: Page, timeout = 15000): Promise<void> {
  await page.waitForSelector('[data-testid="spinner-container"]', { state: 'hidden', timeout })
}

/**
 * ============================================================================
 * BUTTON ENABLEMENT HELPERS
 * ============================================================================
 * These functions wait for specific buttons to become enabled.
 * Used in download tests and generate tests.
 */

/**
 * Wait for download button to be enabled
 * 
 * REPEATED PATTERN: Download button enablement
 * - Used in: download-feature.spec.ts
 * - Waits for: button[aria-label="Download"]:not([disabled])
 * - Context: After selfie capture or anime generation
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForDownloadButtonEnabled(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('button[aria-label="Download"]:not([disabled])', { timeout })
}

/**
 * Wait for generate anime button to be enabled
 * 
 * REPEATED PATTERN: Generate button enablement
 * - Used in: download-feature.spec.ts
 * - Waits for: button[aria-label="Generate anime portrait"]:not([disabled])
 * - Context: After selfie capture
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function waitForGenerateButtonEnabled(page: Page, timeout = 10000): Promise<void> {
  await page.waitForSelector('button[aria-label="Generate anime portrait"]:not([disabled])', { timeout })
}

/**
 * ============================================================================
 * ERROR HANDLING HELPERS
 * ============================================================================
 * These functions handle error state verification.
 * Used in error scenario tests.
 */

/**
 * Wait for error alert to appear
 * 
 * REPEATED PATTERN: Error alert verification
 * - Used in: selfie-anime.spec.ts, anime-transformation.spec.ts
 * - Waits for: [role="alert"]:not(#__next-route-announcer__) to be visible
 * - Context: After API failures or camera permission errors
 * 
 * @param page - Playwright page object
 * @param timeout - Timeout in milliseconds (default: 15000)
 * @returns Promise<Locator> - Error alert locator
 */
export async function waitForErrorAlert(page: Page, timeout = 15000): Promise<Locator> {
  const errorAlert = page.locator('[role="alert"]:not(#__next-route-announcer__)')
  await expect(errorAlert).toBeVisible({ timeout })
  return errorAlert
}

/**
 * ============================================================================
 * API MOCKING HELPERS
 * ============================================================================
 * These functions provide consistent API mocking patterns.
 * Used across all tests that require API interaction.
 */

/**
 * Mock anime API response
 * 
 * REPEATED PATTERN: Basic API mocking
 * - Used in: anime-transformation.spec.ts, selfie-anime.spec.ts
 * - Mocks: /api/anime endpoint with success response
 * - Default: Returns MOCK_ANIME_RESPONSE with 200 status
 * 
 * @param page - Playwright page object
 * @param response - Response data (defaults to MOCK_ANIME_RESPONSE)
 * @param status - HTTP status code (default: 200)
 */
export async function mockAnimeAPI(page: Page, response = MOCK_ANIME_RESPONSE, status = 200): Promise<void> {
  await page.route('/api/anime', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ image: response })
    })
  })
}

/**
 * Mock anime API with delay (for testing loading states)
 * 
 * REPEATED PATTERN: Delayed API mocking
 * - Used in: anime-transformation.spec.ts, retake-flow.spec.ts
 * - Mocks: /api/anime endpoint with intentional delay
 * - Purpose: Test loading states and user interactions during delays
 * 
 * @param page - Playwright page object
 * @param delayMs - Delay in milliseconds (default: 1000)
 * @param response - Response data (defaults to MOCK_ANIME_RESPONSE)
 */
export async function mockAnimeAPIWithDelay(page: Page, delayMs = 1000, response = MOCK_ANIME_RESPONSE): Promise<void> {
  await page.route('/api/anime', async (route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image: response })
    })
  })
}

/**
 * Mock anime API with retry logic (fails first N times, then succeeds)
 * 
 * REPEATED PATTERN: Retry logic testing
 * - Used in: anime-transformation.spec.ts
 * - Mocks: /api/anime endpoint with controlled failures
 * - Purpose: Test retry mechanism and error handling
 * 
 * @param page - Playwright page object
 * @param failCount - Number of times to fail before succeeding (default: 2)
 * @param response - Response data (defaults to MOCK_ANIME_RESPONSE)
 */
export async function mockAnimeAPIWithRetry(page: Page, failCount = 2, response = MOCK_ANIME_RESPONSE): Promise<void> {
  let callCount = 0
  
  await page.route('/api/anime', async (route) => {
    callCount++
    
    if (callCount <= failCount) {
      // First N calls fail
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    } else {
      // Subsequent calls succeed
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ image: response })
      })
    }
  })
} 