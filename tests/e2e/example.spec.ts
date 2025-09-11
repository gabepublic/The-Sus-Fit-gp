import { test, expect } from '@playwright/test'
import { mockImageResizeAPI } from './helpers/image-resize-mock'

test('homepage loads correctly', async ({ page }) => {
  // Mock the image resizing API to prevent server errors
  await mockImageResizeAPI(page)
  await page.goto('/')

  // Expect a title containing "The Sus Fit"
  await expect(page).toHaveTitle(/The Sus Fit/)

  // Expect main heading to be visible
  await expect(page.getByRole('heading', { name: 'The Sus Fit' })).toBeVisible()

  // Expect subtitle to be visible
  await expect(page.getByText("we be doin' the most")).toBeVisible()

  // Expect production credit to be visible
  await expect(page.getByText('a Those People production')).toBeVisible()

  // Expect upload cards to be visible
  await expect(page.getByText('Upload Your Angle')).toBeVisible()
  await expect(page.getByText('Select your Fit')).toBeVisible()
})