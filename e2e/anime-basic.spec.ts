import { test, expect } from '@playwright/test'

// Mock anime image data (1x1 transparent PNG)
const MOCK_ANIME_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const MOCK_ANIME_RESPONSE = `data:image/png;base64,${MOCK_ANIME_BASE64}`

// Helper function to check if camera is available and ready
async function waitForCameraOrFallback(page: any) {
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

test('basic anime transformation flow', async ({ page }) => {
  // Grant camera permissions
  await page.context().grantPermissions(['camera'])
  
  // Navigate to the app
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  
  // Wait for camera to initialize or handle fallback
  await waitForCameraOrFallback(page)

  // Mock the API endpoint
  await page.route('/api/anime', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ image: MOCK_ANIME_RESPONSE })
    })
  })

  // Take a photo
  const takeButton = page.locator('#take-btn')
  await takeButton.click()

  // Wait for selfie to be captured
  const selfieImg = page.locator('#selfie-img')
  await expect(selfieImg).toBeVisible({ timeout: 5000 })

  // Click "Generate Anime" button
  const generateButton = page.getByRole('button', { name: /generate anime/i })
  await expect(generateButton).toBeEnabled()
  await generateButton.click()

  // Wait for anime image to appear
  const animeImg = page.locator('#anime-img')
  await expect(animeImg).toBeVisible({ timeout: 10000 })

  // Verify the anime image has the correct source
  await expect(animeImg).toHaveAttribute('src', MOCK_ANIME_RESPONSE)
}) 