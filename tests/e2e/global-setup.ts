import { chromium, FullConfig } from '@playwright/test'
import { fixtures } from '../fixtures'

async function globalSetup(config: FullConfig) {
  // This setup runs once before all tests
  // We'll use beforeEach hooks in individual test files for route interception
  console.log('Global setup completed - OpenAI stubbing will be configured per test')
}

export default globalSetup
