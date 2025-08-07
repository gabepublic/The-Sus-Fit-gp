import { test, expect } from '@playwright/test'
import { setupOpenAIStub } from './helpers/openai-stub'

test.describe('OpenAI Stubbing Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Setup OpenAI stubbing before any navigation
    await setupOpenAIStub(page)
  })

  test('should stub OpenAI requests correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // The OpenAI stubbing is now active for this test
    // Any requests to https://api.openai.com/v1/images/edits will be intercepted
    // and return the stub response from tests/fixtures/openai-edit-success.json
    
    // You can verify the stubbing is working by checking network requests
    // or by testing the try-on functionality
  })
})
