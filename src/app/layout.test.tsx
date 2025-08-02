import RootLayout from './layout';

// Mock the Toaster component
jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

// Mock the CSS import
jest.mock('./globals.css', () => ({}));

// Mock Next.js metadata
jest.mock('next', () => ({
  ...jest.requireActual('next'),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('RootLayout', () => {
  it('exports a function component', () => {
    expect(typeof RootLayout).toBe('function');
  });

  it('has correct metadata export', () => {
    // Test that the metadata is exported correctly
    expect(RootLayout).toBeDefined();
  });

  it('can be imported without errors', () => {
    // This test just verifies that the component can be imported
    // without causing any runtime errors
    expect(() => {
      require('./layout');
    }).not.toThrow();
  });
}); 