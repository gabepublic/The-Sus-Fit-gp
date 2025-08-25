import { renderHook } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useMobileAnalytics } from '@/mobile/hooks/useMobileAnalytics';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock window.innerWidth and navigator
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 375, // Mobile width
});

Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  configurable: true,
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
});

describe('useMobileAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return analytics functions', () => {
    (usePathname as jest.Mock).mockReturnValue('/m/home');

    const { result } = renderHook(() => useMobileAnalytics());

    expect(result.current).toHaveProperty('trackRouteChange');
    expect(result.current).toHaveProperty('trackCustomEvent');
    expect(typeof result.current.trackRouteChange).toBe('function');
    expect(typeof result.current.trackCustomEvent).toBe('function');
  });

  it('should track custom events', () => {
    (usePathname as jest.Mock).mockReturnValue('/m/home');

    const { result } = renderHook(() => useMobileAnalytics());

    // This should not throw
    expect(() => {
      result.current.trackCustomEvent('button_click', { buttonId: 'upload' });
    }).not.toThrow();
  });

  it('should track route changes manually', () => {
    (usePathname as jest.Mock).mockReturnValue('/m/share');

    const { result } = renderHook(() => useMobileAnalytics());

    // This should not throw
    expect(() => {
      result.current.trackRouteChange({
        route: '/m/custom',
        deviceType: 'mobile',
        previousRoute: '/m/home',
      });
    }).not.toThrow();
  });

  it('should handle non-mobile routes without errors', () => {
    (usePathname as jest.Mock).mockReturnValue('/desktop/page');

    expect(() => {
      renderHook(() => useMobileAnalytics());
    }).not.toThrow();
  });

  it('should handle pathname changes', () => {
    const { rerender } = renderHook(() => useMobileAnalytics());
    
    (usePathname as jest.Mock).mockReturnValue('/m/home');
    rerender();
    
    (usePathname as jest.Mock).mockReturnValue('/m/tryon');
    rerender();
    
    // Should not throw during route changes
    expect(true).toBe(true);
  });
});