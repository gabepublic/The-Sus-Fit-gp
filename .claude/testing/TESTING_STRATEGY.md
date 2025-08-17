# Comprehensive Testing Strategy for Three-Layer Architecture

This document outlines the complete testing strategy for our three-layer architecture (Business → Bridge → UI), providing guidelines, patterns, and best practices for maintaining high-quality, reliable code.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Layer-Specific Testing](#layer-specific-testing)
4. [Testing Tools & Utilities](#testing-tools--utilities)
5. [Performance Testing](#performance-testing)
6. [E2E Testing](#e2e-testing)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

Our application uses a three-layer architecture that provides clear separation of concerns:

```
┌─────────────────────────────────────────┐
│              UI Components              │  ← React Components, User Interface
├─────────────────────────────────────────┤
│              Bridge Layer               │  ← Custom Hooks, State Coordination
├─────────────────────────────────────────┤
│             Business Layer              │  ← React Query, API Calls, Logic
├─────────────────────────────────────────┤
│             External APIs               │  ← OpenAI, File Processing, etc.
└─────────────────────────────────────────┘
```

### Benefits for Testing

- **Isolation**: Each layer can be tested independently
- **Mocking**: Clean interfaces between layers enable easy mocking
- **Maintainability**: Changes in one layer don't break other layer tests
- **Performance**: Layer-specific performance optimization and monitoring

## Testing Pyramid

Our testing strategy follows the testing pyramid with emphasis on different layers:

```
        /\
       /  \     E2E Tests (10%)
      /____\    - Full user workflows
     /      \   - Cross-browser testing
    /        \  
   /__________\ Integration Tests (30%)
  /            \ - Bridge layer coordination
 /              \ - API integration
/________________\ Unit Tests (60%)
                  - Business layer logic
                  - Individual components
                  - Utility functions
```

### Test Distribution

- **Unit Tests (60%)**: Focus on business layer and individual components
- **Integration Tests (30%)**: Bridge layer coordination and API integration
- **E2E Tests (10%)**: Critical user workflows and performance validation

## Layer-Specific Testing

### 1. Business Layer Testing

**What to Test:**
- React Query hooks and mutations
- API integration logic
- Data transformation
- Error handling
- Caching behavior

**Testing Tools:**
- Jest + React Testing Library
- Custom React Query test utilities
- MSW (Mock Service Worker) for API mocking

**Example:**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { createTestQueryClient, MockAPIUtils } from '@test/index';
import { useTryonMutation } from '@/business-layer/mutations/useTryonMutation';

describe('useTryonMutation', () => {
  beforeEach(() => {
    MockAPIUtils.setupServer();
  });

  it('should handle successful API response', async () => {
    MockAPIUtils.useCustomHandler(
      MockAPIUtils.createCustomTryonHandler({
        img_generated: 'test-image-data'
      })
    );

    const { result } = renderHook(() => useTryonMutation(), {
      wrapper: createTestQueryClient().wrapper,
    });

    act(() => {
      result.current.mutate({
        modelImage: 'test-model',
        apparelImages: ['test-apparel'],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.img_generated).toBe('test-image-data');
    });
  });
});
```

### 2. Bridge Layer Testing

**What to Test:**
- Hook composition and coordination
- State management logic
- UI abstraction correctness
- Backward compatibility
- Performance characteristics

**Testing Tools:**
- Custom bridge layer test utilities
- Hook testing with React Testing Library
- Performance monitoring utilities

**Example:**

```typescript
import { renderBridgeHook, WorkflowTestUtils } from '@test/index';
import { useBridgeLayer } from '@/hooks/useBridgeLayer';

describe('useBridgeLayer', () => {
  it('should coordinate file upload workflow', async () => {
    const { result, testUtils } = renderBridgeHook(() => useBridgeLayer());
    const mockFiles = WorkflowTestUtils.createMockFiles();

    testUtils.mockFileRead('data:image/jpeg;base64,test-data');

    await act(async () => {
      await result.current.actions.uploadUserImage(mockFiles.userImage);
    });

    expect(result.current.state.hasUserImage).toBe(true);
    expect(result.current.state.canGenerate).toBe(false); // Need both images
  });
});
```

### 3. UI Component Testing

**What to Test:**
- Component rendering
- User interactions
- Props handling
- Accessibility
- Visual regression

**Testing Tools:**
- React Testing Library
- Jest DOM matchers
- User event simulation

**Example:**

```typescript
import { render, screen, fireEvent } from '@test/index';
import { MockAPIUtils } from '@test/index';
import TryonPage from '@/app/page';

describe('TryonPage', () => {
  beforeEach(() => {
    MockAPIUtils.setupServer();
  });

  it('should handle complete user workflow', async () => {
    render(<TryonPage />);
    
    const userUpload = screen.getByLabelText(/upload.*user/i);
    const mockFile = new File(['test'], 'user.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(userUpload, { target: { files: [mockFile] } });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-preview')).toBeInTheDocument();
    });
  });
});
```

## Testing Tools & Utilities

### Core Testing Framework

Located in `__tests__/test-utils/`, our testing framework provides:

#### 1. React Query Test Utilities (`react-query-test-utils.tsx`)

```typescript
import { createTestQueryClient, renderWithProviders } from '@test/index';

// Create isolated QueryClient for testing
const queryClient = createTestQueryClient({
  disableRetries: true,
  disableCache: true,
});

// Render components with React Query providers
const { result } = renderWithProviders(<MyComponent />, { queryClient });
```

#### 2. Bridge Layer Test Utilities (`bridge-layer-test-utils.tsx`)

```typescript
import { renderBridgeHook, BridgeLayerTestUtils } from '@test/index';

// Test bridge layer hooks with mocked environment
const { result, testUtils } = renderBridgeHook(() => useBridgeLayer());

// Mock file operations
testUtils.mockFileRead('data:image/jpeg;base64,mock-data');
```

#### 3. API Mocking (`api-mocks.ts`)

```typescript
import { MockAPIUtils } from '@test/index';

// Setup MSW server
MockAPIUtils.setupServer();

// Use predefined error scenarios
MockAPIUtils.useErrorScenario('serverError');
MockAPIUtils.useErrorScenario('timeout');

// Create custom responses
MockAPIUtils.useCustomHandler(
  MockAPIUtils.createCustomTryonHandler(
    { img_generated: 'custom-data' },
    { delay: 500 }
  )
);
```

### Quick Setup Functions

```typescript
import { quickSetup } from '@test/index';

// Setup for different testing scenarios
const businessLayerUtils = quickSetup.businessLayer();
const bridgeLayerUtils = quickSetup.bridgeLayer();
const performanceUtils = quickSetup.performance();
```

## Performance Testing

### Performance Monitoring

We use custom performance utilities to track and benchmark our architecture:

```typescript
import { BridgePerformanceUtils, createPerformanceMonitor } from '@test/index';

const perfUtils = new BridgePerformanceUtils();
const monitor = createPerformanceMonitor();

// Measure hook render performance
const { duration } = await perfUtils.measureHookRender(
  () => renderBridgeHook(() => useBridgeLayer()),
  'bridge-layer-init'
);

// Record performance metrics
monitor.recordMeasurement('hook_initialization_bridge_layer', duration);

// Generate performance report
monitor.printReport();
```

### Performance Baselines

Default performance baselines are established for:

- **Hook Initialization**: < 50ms for bridge layer
- **File Upload Processing**: < 200ms
- **API Call Duration**: < 1000ms (mocked)
- **State Updates**: < 10ms
- **Memory Usage**: < 10MB per hook instance

### Architecture Comparison Tests

Comprehensive tests compare old vs new architecture:

```typescript
// Located in __tests__/performance/architecture-comparison.test.tsx
describe('Architecture Comparison: Legacy vs Three-Layer', () => {
  it('should compare initialization overhead', async () => {
    // Tests initialization time difference
    // Validates acceptable performance overhead
    // Demonstrates architectural benefits
  });
});
```

## E2E Testing

### Playwright Configuration

E2E tests are located in `tests/e2e/` and use Playwright for cross-browser testing.

**Key E2E Test Files:**
- `three-layer-architecture.spec.ts` - Validates complete architecture
- `tryon.spec.ts` - Happy path user workflow
- `toast-error-handling.spec.ts` - Error handling scenarios

### E2E Test Patterns

```typescript
import { test, expect } from '@playwright/test';
import { setupOpenAIStub } from './helpers/openai-stub';

test.describe('Three-Layer Architecture E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupOpenAIStub(page);
    // Disable animations for consistent testing
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('should complete workflow via three-layer architecture', async ({ page }) => {
    await page.goto('/');
    
    // Test file uploads through bridge layer
    await page.locator('input[data-test="model-upload"]').setInputFiles(fixtures.model);
    await expect(page.locator('[data-test="model-preview"]')).toBeVisible();
    
    // Test state coordination
    await page.locator('input[data-test="apparel-upload"]').setInputFiles(fixtures.apparel);
    await expect(page.locator('[data-test="generate-button"]')).toBeEnabled();
    
    // Test API integration through business layer
    await page.locator('[data-test="generate-button"]').click();
    await expect(page.locator('[data-test="result-image"]')).toBeVisible();
  });
});
```

### E2E Performance Testing

```typescript
test('should meet performance benchmarks', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      totalLoadTime: navigation.loadEventEnd - navigation.navigationStart,
      timeToFirstByte: navigation.responseStart - navigation.requestStart,
    };
  });

  expect(metrics.totalLoadTime).toBeLessThan(10000); // 10s max
  expect(metrics.timeToFirstByte).toBeLessThan(2000); // 2s max
});
```

## CI/CD Integration

### Jest Configuration

Our Jest configuration supports the three-layer architecture:

```javascript
// jest.config.js
module.exports = createJestConfig({
  // Path aliases for clean imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/__tests__/test-utils/$1',
  },
  
  // Coverage for each layer
  collectCoverageFrom: [
    'src/business-layer/**/*.{js,jsx,ts,tsx}',
    'src/hooks/**/*.{js,jsx,ts,tsx}',
    'src/components/**/*.{js,jsx,ts,tsx}',
  ],
  
  // Layer-specific coverage thresholds
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/business-layer/**/*.{js,jsx,ts,tsx}': {
      branches: 85, functions: 85, lines: 85, statements: 85
    },
  },
});
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=__tests__/bridge-layer",
    "test:performance": "jest --testPathPattern=__tests__/performance",
    "test:e2e": "playwright test",
    "test:ci": "jest --ci --coverage --coverageThreshold='{\"global\":{\"branches\":80,\"functions\":80,\"lines\":80,\"statements\":80}}'",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Performance Monitoring in CI

```typescript
// Performance monitoring integration
import { createPerformanceMonitor } from '@test/performance-monitor';

const monitor = createPerformanceMonitor();

// Record measurements during CI tests
monitor.recordMeasurement('hook_initialization_bridge_layer', duration);

// Export results for CI/CD
const { exitCode, summary } = monitor.exportForCI();
console.log(summary);
process.exit(exitCode);
```

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run performance tests
        run: npm run test:performance
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Test Organization

```
__tests__/
├── business-layer/         # Unit tests for business logic
│   ├── hooks/
│   ├── mutations/
│   └── utils/
├── bridge-layer/          # Integration tests for bridge layer
│   ├── useTryonWorkflow.test.tsx
│   └── useBridgeLayer.test.tsx
├── components/            # Component tests
│   ├── ui/
│   └── pages/
├── performance/           # Performance benchmarks
│   ├── bridge-layer-performance.test.tsx
│   └── architecture-comparison.test.tsx
└── test-utils/           # Shared testing utilities
    ├── react-query-test-utils.tsx
    ├── bridge-layer-test-utils.tsx
    ├── api-mocks.ts
    └── index.ts
```

### 2. Test Naming Conventions

```typescript
// Descriptive test suites and cases
describe('useTryonMutation', () => {
  describe('when API returns success', () => {
    it('should update state with generated image', () => {});
  });
  
  describe('when API returns error', () => {
    it('should set error state and enable retry', () => {});
  });
});
```

### 3. Setup and Teardown

```typescript
describe('Component Tests', () => {
  let testUtils;

  beforeEach(() => {
    testUtils = quickSetup.bridgeLayer();
    MockAPIUtils.setupServer();
  });

  afterEach(() => {
    testUtils.cleanup();
    MockAPIUtils.reset();
  });
});
```

### 4. Async Testing

```typescript
// Use waitFor for async state changes
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});

// Use act for state updates
act(() => {
  result.current.startGeneration();
});
```

### 5. Error Testing

```typescript
// Test error scenarios explicitly
it('handles network errors gracefully', async () => {
  MockAPIUtils.useErrorScenario('networkError');
  
  // Trigger operation...
  
  await waitFor(() => {
    expect(result.current.error).toBeTruthy();
    expect(result.current.error.retryable).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Hook Testing Errors

**Problem**: "Cannot read properties of null"
**Solution**: Ensure hooks are rendered with proper providers

```typescript
// ❌ Wrong
const { result } = renderHook(() => useBridgeLayer());

// ✅ Correct
const { result } = renderBridgeHook(() => useBridgeLayer());
```

#### 2. API Mock Issues

**Problem**: API calls not being intercepted
**Solution**: Ensure MSW server is set up correctly

```typescript
// Setup server before tests
beforeEach(() => {
  MockAPIUtils.setupServer();
});

// Reset handlers between tests
afterEach(() => {
  MockAPIUtils.reset();
});
```

#### 3. Performance Test Inconsistencies

**Problem**: Performance tests failing inconsistently
**Solution**: Use appropriate timeouts and environment-specific baselines

```typescript
// Account for CI environment differences
const isCI = process.env.CI === 'true';
const timeoutMultiplier = isCI ? 2 : 1;

expect(duration).toBeLessThan(baselineTime * timeoutMultiplier);
```

#### 4. E2E Test Flakiness

**Problem**: E2E tests failing randomly
**Solution**: Use proper wait conditions and disable animations

```typescript
// Wait for specific conditions
await expect(page.locator('[data-test="result"]')).toBeVisible({ timeout: 10000 });

// Disable animations
await page.addInitScript(() => {
  const style = document.createElement('style');
  style.textContent = `*, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }`;
  document.head.appendChild(style);
});
```

### Debug Mode

Enable verbose logging for debugging:

```typescript
// Enable debug mode in test utilities
const testUtils = new BridgeLayerTestUtils({ debug: true });

// Mock API with logging
MockAPIUtils.enableDebugLogging();
```

### Coverage Issues

Ensure all layers are properly covered:

```bash
# Check coverage by layer
npm run test:coverage -- --collectCoverageFrom="src/business-layer/**/*.{ts,tsx}"
npm run test:coverage -- --collectCoverageFrom="src/hooks/**/*.{ts,tsx}"
npm run test:coverage -- --collectCoverageFrom="src/components/**/*.{ts,tsx}"
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [React Query Testing](https://tanstack.com/query/latest/docs/react/guides/testing)
- [MSW Documentation](https://mswjs.io/docs/)

---

*This testing strategy ensures our three-layer architecture remains robust, performant, and maintainable as the application evolves.*