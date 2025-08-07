const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', 'jest-canvas-mock'],
  moduleNameMapper: {
    // Handle module aliases (the same as in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Use jsdom for React components, but support Node.js environment
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/e2e/',
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  // Enable coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  // Set coverage threshold to >80% as required
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  // Transform configuration for TypeScript and JSX
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

module.exports = createJestConfig(customJestConfig)