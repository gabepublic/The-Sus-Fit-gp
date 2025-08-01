import { test, expect } from '@playwright/test'

// Mock anime image data (1x1 transparent PNG)
const MOCK_ANIME_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const MOCK_ANIME_RESPONSE = `data:image/png;base64,${MOCK_ANIME_BASE64}`

test('basic anime transformation flow', async ({ page }) => {
  // Grant camera permissions
  await page.context().grantPermissions(['camera'])
  
  // Navigate to the app
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  
  // Wait for camera to initialize
  await page.waitForFunction(() => {
    const video = document.querySelector('video#camera-stream') as HTMLVideoElement
    return video && video.readyState >= 3
  }, { timeout: 10000 })

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