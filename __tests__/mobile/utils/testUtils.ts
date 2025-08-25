import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Common User Agent strings for testing
export const TEST_USER_AGENTS = {
  // Phone devices
  iPhone13: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  iPhoneX: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
  samsungGalaxy: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
  
  // Tablet devices
  iPadPro: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  androidTablet: 'Mozilla/5.0 (Linux; Android 9; SM-T820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
  
  // Desktop
  chromeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  
  // Edge cases
  iPadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  empty: '',
  undefined: undefined as unknown as string,
} as const;

// Common mobile routes for testing
export const TEST_MOBILE_ROUTES = [
  '/m/home',
  '/m/upload-angle', 
  '/m/upload-fit',
  '/m/tryon',
  '/m/share',
] as const;

// Mock viewport dimensions for responsive testing
export const TEST_VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLarge: { width: 1024, height: 1366 }, // iPad Pro
  desktop: { width: 1280, height: 720 }, // Desktop
} as const;

/**
 * Mock window properties for testing
 */
export const mockWindowProperties = (properties: Partial<Window>) => {
  const originalWindow = { ...window };
  
  Object.defineProperties(window, 
    Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [
        key,
        { value, writable: true, configurable: true }
      ])
    )
  );

  return () => {
    // Restore original properties
    Object.defineProperties(window, 
      Object.fromEntries(
        Object.keys(properties).map(key => [
          key,
          { 
            value: originalWindow[key as keyof Window], 
            writable: true, 
            configurable: true 
          }
        ])
      )
    );
  };
};

/**
 * Mock navigator.userAgent for testing
 */
export const mockUserAgent = (userAgent: string) => {
  const originalUserAgent = navigator.userAgent;
  
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    writable: true,
    configurable: true,
  });

  return () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  };
};

/**
 * Mock viewport dimensions for responsive testing
 */
export const mockViewport = (viewport: { width: number; height: number }) => {
  return mockWindowProperties({
    innerWidth: viewport.width,
    innerHeight: viewport.height,
    outerWidth: viewport.width,
    outerHeight: viewport.height,
  });
};

/**
 * Create a mock Next.js request object for middleware testing
 */
export const createMockNextRequest = (
  url: string,
  options: {
    userAgent?: string;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    method?: string;
  } = {}
) => {
  const {
    userAgent = TEST_USER_AGENTS.chromeDesktop,
    cookies = {},
    headers = {},
    method = 'GET',
  } = options;

  const mockHeaders = new Headers({
    'user-agent': userAgent,
    ...headers,
  });

  const mockCookies = new Map(Object.entries(cookies));

  return {
    nextUrl: new URL(url),
    url,
    method,
    headers: mockHeaders,
    cookies: {
      get: (name: string) => {
        const value = mockCookies.get(name);
        return value ? { name, value } : undefined;
      },
      getAll: () => Array.from(mockCookies.entries()).map(([name, value]) => ({ name, value })),
      has: (name: string) => mockCookies.has(name),
      set: (name: string, value: string) => mockCookies.set(name, value),
      delete: (name: string) => mockCookies.delete(name),
    },
  };
};

/**
 * Custom render function for mobile components with common providers
 */
interface MobileRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  viewport?: keyof typeof TEST_VIEWPORTS;
  userAgent?: string;
}

export const renderMobileComponent = (
  ui: ReactElement,
  options: MobileRenderOptions = {}
): RenderResult => {
  const { viewport = 'mobile', userAgent = TEST_USER_AGENTS.iPhone13, ...renderOptions } = options;

  // Setup viewport and user agent mocks
  const restoreViewport = mockViewport(TEST_VIEWPORTS[viewport]);
  const restoreUserAgent = mockUserAgent(userAgent);

  const result = render(ui, renderOptions);

  // Store cleanup functions on the result object for manual cleanup if needed
  (result as any).cleanup = () => {
    restoreViewport();
    restoreUserAgent();
    result.unmount();
  };

  return result;
};

/**
 * Test helper to simulate keyboard events
 */
export const simulateKeyboardEvent = (
  element: Element | Document,
  key: string,
  type: 'keydown' | 'keyup' | 'keypress' = 'keydown'
) => {
  const event = new KeyboardEvent(type, { key, bubbles: true });
  element.dispatchEvent(event);
};

/**
 * Test helper to simulate touch events for mobile testing
 */
export const simulateTouchEvent = (
  element: Element,
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
  touches: { x: number; y: number }[] = [{ x: 0, y: 0 }]
) => {
  const touchList = touches.map(({ x, y }) => ({
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    target: element,
  }));

  const event = new TouchEvent(type, {
    touches: touchList as any,
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(event);
};

/**
 * Test helper to check if element has focus
 */
export const isElementFocused = (element: Element): boolean => {
  return document.activeElement === element;
};

/**
 * Test helper to check accessibility attributes
 */
export const checkAccessibilityAttributes = (element: Element) => {
  const checks = {
    hasAriaLabel: element.hasAttribute('aria-label'),
    hasAriaLabelledBy: element.hasAttribute('aria-labelledby'),
    hasRole: element.hasAttribute('role'),
    hasTabIndex: element.hasAttribute('tabindex'),
    isFocusable: element.tabIndex >= 0 || element.tagName.toLowerCase() === 'button' || element.tagName.toLowerCase() === 'a',
  };

  return checks;
};

/**
 * Test helper to get all focusable elements within a container
 */
export const getFocusableElements = (container: Element): Element[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Test helper to simulate Next.js router push/replace
 */
export const createMockRouter = (initialPath = '/') => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: initialPath,
    query: {},
    asPath: initialPath,
    route: initialPath,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  };

  return mockRouter;
};

/**
 * Test helper to create mock intersection observer for testing components that use it
 */
export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });

  Object.defineProperty(window, 'IntersectionObserver', {
    value: mockIntersectionObserver,
    writable: true,
  });

  return mockIntersectionObserver;
};

/**
 * Test helper to create mock resize observer for responsive component testing
 */
export const createMockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });

  Object.defineProperty(window, 'ResizeObserver', {
    value: mockResizeObserver,
    writable: true,
  });

  return mockResizeObserver;
};