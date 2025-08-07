import { Page } from '@playwright/test'
import { fixtures } from '../../fixtures'

/**
 * Stub OpenAI Images Edit endpoint for Playwright tests
 * Call this in beforeEach hooks or at the start of tests
 */
export async function stubOpenAI(page: Page) {
  await page.route('https://api.openai.com/v1/images/edits', route => 
    route.fulfill({ 
      status: 200, 
      contentType: 'application/json', 
      body: JSON.stringify(fixtures.stub) 
    })
  )
}

/**
 * Setup function to be used in test beforeEach hooks
 */
export async function setupOpenAIStub(page: Page) {
  // Stub OpenAI requests before any navigation
  await stubOpenAI(page)
}
