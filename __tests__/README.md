# Testing Guide for Three-Layer Architecture

This guide covers testing strategies and utilities for our three-layer architecture: Business Layer → Bridge Layer → UI Components.

> 📖 **Complete Testing Strategy**: For comprehensive testing guidelines, architecture comparisons, and best practices, see [docs/TESTING_STRATEGY.md](../docs/TESTING_STRATEGY.md)

## Quick Reference

This README provides practical examples and quick setup guides. For detailed strategies, performance benchmarking, and CI/CD integration, refer to the complete testing strategy document.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Test Utilities](#test-utilities)
- [Testing Patterns](#testing-patterns)
- [API Mocking](#api-mocking)
- [Performance Testing](#performance-testing)
- [Best Practices](#best-practices)

## 🚀 Quick Start

### Basic Setup

```typescript
import { setupTestEnvironment, quickSetup } from '@test/index';

// Setup for most tests
setupTestEnvironment();

// Or use quick setup for specific layers
const testUtils = quickSetup.bridgeLayer();
```

### Simple Component Test

```typescript
import { render, screen } from '@test/index';
import MyComponent from '@/components/MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello World')).toBeInTheDocument();
});
```

### Hook Testing

```typescript
import { renderHook } from '@test/index';
import { useTryonWorkflow } from '@/hooks/useTryonWorkflow';

test('hook initializes correctly', () => {
  const { result } = renderHook(() => useTryonWorkflow());
  expect(result.current.isCapturing).toBe(false);
});
```

## 🏗️ Architecture Overview

### Testing Layers

Our testing strategy mirrors our application architecture:

```
┌─────────────────────────────────────────┐
│           UI Components Layer           │  ← Component Tests
├─────────────────────────────────────────┤
│            Bridge Layer                 │  ← Integration Tests
├─────────────────────────────────────────┤
│           Business Layer                │  ← Unit Tests
├─────────────────────────────────────────┤
│          External APIs                  │  ← API Mocks
└─────────────────────────────────────────┘
```

### Test Types

1. **Unit Tests**: Business layer hooks and utilities
2. **Integration Tests**: Bridge layer coordination
3. **Component Tests**: UI component behavior
4. **API Tests**: External service integration
5. **E2E Tests**: Complete user workflows

## 🛠️ Test Utilities

### React Query Testing

```typescript
import { 
  createQueryClient, 
  HookTestUtils, 
  MutationTestUtils 
} from '@test/index';

// Create isolated QueryClient for testing
const queryClient = createQueryClient({
  disableRetries: true,
  disableCache: true,
});

// Test React Query hooks
const hookUtils = new HookTestUtils();
const mutationUtils = new MutationTestUtils();
```

### Bridge Layer Testing

```typescript
import { 
  BridgeLayerTestUtils, 
  WorkflowTestUtils,
  renderBridgeHook 
} from '@test/index';

// Setup bridge layer testing
const testUtils = new BridgeLayerTestUtils({
  mockToast: true,
  mockFileAPIs: true,
  mockFetch: false, // Use MSW
});

// Test bridge layer hooks
const { result, testUtils, waitForWorkflow } = renderBridgeHook(
  () => useTryonWorkflow()
);
```

### API Mocking with MSW

```typescript
import { 
  MockAPIUtils, 
  server, 
  DEFAULT_MOCK_RESPONSES 
} from '@test/index';

// Use predefined error scenarios
MockAPIUtils.useErrorScenario('serverError');

// Create custom responses
MockAPIUtils.useCustomHandler(
  MockAPIUtils.createCustomTryonHandler(
    { img_generated: 'custom-image-data' },
    { delay: 1000 }
  )
);
```

## 📝 Testing Patterns

### 1. Business Layer Testing

Test individual React Query hooks and mutations:

```typescript
// __tests__/business-layer/hooks/useTryonMutation.test.tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { MockAPIUtils, quickSetup } from '@test/index';
import { useTryonMutation } from '@/business-layer/mutations/useTryonMutation';

describe('useTryonMutation', () => {
  let testUtils;

  beforeEach(() => {
    testUtils = quickSetup.mutations();
  });

  it('handles successful API response', async () => {
    MockAPIUtils.useCustomHandler(
      MockAPIUtils.createCustomTryonHandler({
        img_generated: 'test-image-data'
      })
    );

    const { result } = renderHook(() => useTryonMutation(), {
      wrapper: testUtils.createWrapper(),
    });

    act(() => {
      result.current.mutate({
        modelImage: 'test-model-image',
        apparelImages: ['test-apparel-image'],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.img_generated).toBe('test-image-data');
  });
});
```

### 2. Bridge Layer Testing

Test coordination between business layer and UI:

```typescript
// __tests__/bridge-layer/useTryonWorkflow.test.tsx
import { act } from '@testing-library/react';
import { 
  renderBridgeHook, 
  WorkflowTestUtils, 
  MockAPIUtils 
} from '@test/index';
import { useTryonWorkflow } from '@/hooks/useTryonWorkflow';

describe('useTryonWorkflow', () => {
  it('handles complete workflow', async () => {
    MockAPIUtils.setupServer();

    const { result, waitForWorkflow } = renderBridgeHook(
      () => useTryonWorkflow()
    );

    const mockFiles = WorkflowTestUtils.createMockFiles();

    // Upload files
    act(() => {
      result.current.handleUserFileUpload(mockFiles.userImage);
      result.current.handleApparelFileUpload(mockFiles.apparelImage);
    });

    // Wait for files to be processed
    await waitForWorkflow((workflow) => 
      workflow.canGenerate()
    );

    // Start generation
    act(() => {
      result.current.startGeneration();
    });

    // Wait for completion
    await waitForWorkflow((workflow) => 
      !!workflow.generatedImage
    );

    expect(result.current.generatedImage).toBeTruthy();
  });
});
```

### 3. Component Testing

Test UI components with bridge layer integration:

```typescript
// __tests__/components/TryonPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@test/index';
import { MockAPIUtils, WorkflowTestUtils } from '@test/index';
import TryonPage from '@/app/page';

describe('TryonPage', () => {
  beforeEach(() => {
    MockAPIUtils.setupServer();
  });

  it('completes full try-on workflow', async () => {
    const mockFiles = WorkflowTestUtils.createMockFiles();
    
    render(<TryonPage />);

    // Upload user image
    const userUpload = screen.getByLabelText(/upload.*user/i);
    fireEvent.change(userUpload, {
      target: { files: [mockFiles.userImage] }
    });

    // Upload apparel image
    const apparelUpload = screen.getByLabelText(/upload.*apparel/i);
    fireEvent.change(apparelUpload, {
      target: { files: [mockFiles.apparelImage] }
    });

    // Wait for uploads to complete
    await waitFor(() => {
      expect(screen.getByTestId('generate-button')).not.toBeDisabled();
    });

    // Click generate
    fireEvent.click(screen.getByTestId('generate-button'));

    // Wait for result
    await waitFor(() => {
      expect(screen.getByTestId('generated-result')).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
```

### 4. Performance Testing

Test performance characteristics:

```typescript
// __tests__/performance/workflow.performance.test.tsx
import { BridgePerformanceUtils, renderBridgeHook } from '@test/index';
import { useTryonWorkflow } from '@/hooks/useTryonWorkflow';

describe('Workflow Performance', () => {
  let perfUtils;

  beforeEach(() => {
    perfUtils = new BridgePerformanceUtils();
  });

  it('hook renders within performance budget', async () => {
    const { result, duration } = await perfUtils.measureHookRender(
      () => renderBridgeHook(() => useTryonWorkflow())
    );

    perfUtils.assertPerformance(
      duration, 
      100, // 100ms budget
      'useTryonWorkflow render'
    );
  });
});
```

## 🌐 API Mocking

### Predefined Scenarios

```typescript
import { MockAPIUtils, errorHandlers } from '@test/index';

// Use built-in error scenarios
MockAPIUtils.useErrorScenario('serverError');
MockAPIUtils.useErrorScenario('timeout');
MockAPIUtils.useErrorScenario('rateLimit');

// Use performance scenarios
MockAPIUtils.usePerformanceScenario('slow');
MockAPIUtils.usePerformanceScenario('variable');
```

### Custom Responses

```typescript
import { MockAPIUtils } from '@test/index';

// Custom success response
MockAPIUtils.useCustomHandler(
  MockAPIUtils.createCustomTryonHandler(
    { 
      img_generated: 'custom-image-data',
      metadata: { processingTime: 1500 }
    },
    { delay: 500 }
  )
);

// Custom error response
MockAPIUtils.useCustomHandler(
  MockAPIUtils.createCustomTryonHandler(
    {},
    { shouldFail: true, status: 422 }
  )
);
```

## ⚡ Performance Testing

### Benchmarking

```typescript
import { BridgePerformanceUtils } from '@test/index';

const perfUtils = new BridgePerformanceUtils();

// Measure operations
perfUtils.startMeasurement('file-upload');
await uploadFile(mockFile);
const uploadTime = perfUtils.endMeasurement('file-upload');

// Assert performance
perfUtils.assertPerformance(uploadTime, 1000, 'file upload');
```

### Memory Usage

```typescript
// Monitor memory during tests
const initialMemory = process.memoryUsage();

// Run operations...

const finalMemory = process.memoryUsage();
const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;

expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // 50MB limit
```

## ✅ Best Practices

### 1. Test Organization

```
__tests__/
├── business-layer/         # Unit tests for business logic
│   ├── hooks/
│   ├── mutations/
│   └── utils/
├── bridge-layer/          # Integration tests for bridge layer
│   ├── useTryonWorkflow.test.tsx
│   └── useImageUpload.test.tsx
├── components/            # Component tests
│   ├── ui/
│   └── pages/
├── integration/           # End-to-end integration tests
├── performance/           # Performance benchmarks
└── test-utils/           # Shared testing utilities
```

### 2. Test Naming

```typescript
// Good: Descriptive test names
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
  });

  afterEach(() => {
    testUtils.cleanup();
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

## 🎯 Coverage Goals

- **Business Layer**: 85%+ (critical business logic)
- **Bridge Layer**: 80%+ (integration points)
- **Components**: 80%+ (user-facing functionality)
- **Overall**: 80%+ (project requirement)

## 🔧 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test business-layer
npm test bridge-layer
npm test components

# Run performance tests
npm test performance

# Run end-to-end tests
npm run test:e2e

# Watch mode for development
npm run test:watch
```

## 📊 Test Reports

Test reports are generated in:
- `coverage/` - Coverage reports
- `__tests__/reports/` - Performance reports
- `playwright-report/` - E2E test reports

## 🌐 End-to-End Testing

Our E2E tests validate the complete three-layer architecture in real browser environments:

### Key E2E Test Files
- `tests/e2e/three-layer-architecture.spec.ts` - Validates complete architecture workflow
- `tests/e2e/tryon.spec.ts` - Happy path user workflows  
- `tests/e2e/toast-error-handling.spec.ts` - Error handling scenarios

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test three-layer-architecture

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Generate E2E test report
npx playwright show-report
```

### E2E Test Features
- **Architecture Validation**: Tests Business → Bridge → UI layer coordination
- **Performance Monitoring**: Validates load times and responsiveness
- **Error Handling**: Tests error propagation through all layers
- **State Consistency**: Validates state management across interactions
- **Cross-Browser**: Tests in Chromium, Firefox, and WebKit

---

📖 **For complete testing guidelines**: See [docs/TESTING_STRATEGY.md](../docs/TESTING_STRATEGY.md)

For questions or issues with testing, refer to the complete testing strategy documentation or check existing test examples in the codebase.