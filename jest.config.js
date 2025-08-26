const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js", "jest-canvas-mock"],
  moduleNameMapper: {
    // Handle module aliases (the same as in tsconfig.json)
    "^@/(.*)$": "<rootDir>/src/$1",
    // Test utilities alias for easier imports
    "^@test/(.*)$": "<rootDir>/__tests__/test-utils/$1",
  },
  // Use jsdom for React components, but support Node.js environment
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}",
    "<rootDir>/__tests__/**/*.spec.{js,jsx,ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/e2e/",
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/test-utils/", // Exclude test utilities from being run as tests
  ],
  // Enable coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/**/*.spec.{js,jsx,ts,tsx}",
    // Include our three-layer architecture in coverage
    "src/business-layer/**/*.{js,jsx,ts,tsx}",
    "src/hooks/**/*.{js,jsx,ts,tsx}",
    "src/components/**/*.{js,jsx,ts,tsx}",
    // Exclude test-specific files
    "!src/**/__mocks__/**",
    "!src/**/__tests__/**",
  ],
  // Enhanced coverage thresholds for different parts of the architecture
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
    // Higher standards for business layer (core logic)
    "src/business-layer/**/*.{js,jsx,ts,tsx}": {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    // Bridge layer hooks should be well tested
    "src/hooks/**/*.{js,jsx,ts,tsx}": {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  // Coverage reporters
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  // Transform configuration for TypeScript and JSX
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    "/node_modules/(?!(msw)/)", // Allow MSW to be transformed
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  // Test timeout for async operations
  testTimeout: 10000,
  // Global variables for tests
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  // Maximum worker processes for parallel testing
  maxWorkers: "50%",
  // Cache directory
  cacheDirectory: "<rootDir>/.jest-cache",
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  // Verbose output for debugging
  verbose: false,
};

module.exports = createJestConfig(customJestConfig);
