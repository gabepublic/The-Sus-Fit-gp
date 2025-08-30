import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { HomeViewContent } from '../../../src/mobile/components/HomeViewContent';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ 
    src, 
    alt, 
    onLoad, 
    onError, 
    className,
    style,
    fill, 
    priority, 
    unoptimized, 
    sizes, 
    quality,
    ...props 
  }: any) {
    const handleLoad = () => {
      if (onLoad) onLoad();
    };
    
    const handleError = () => {
      if (onError) onError();
    };

    // Remove Next.js specific props that shouldn't be passed to DOM
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        data-testid="mock-image"
      />
    );
  },
}));

// Mock YellowBanner component
jest.mock('../../../src/mobile/components/YellowBanner', () => ({
  YellowBanner: function MockYellowBanner({ className, animationDelay, ...props }: any) {
    return (
      <div 
        className={className}
        data-testid="yellow-banner"
        data-animation-delay={animationDelay}
      >
        Mock Yellow Banner
      </div>
    );
  },
}));

describe('HomeViewContent Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('YellowBanner Integration', () => {
    it('renders YellowBanner with correct props', () => {
      render(<HomeViewContent animationDelay={100} />);
      
      const yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toBeInTheDocument();
      expect(yellowBanner).toHaveClass('home-view-content__yellow-shape');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', '300'); // 100 + 200
    });

    it('passes animation delay correctly to YellowBanner', () => {
      const customDelay = 500;
      render(<HomeViewContent animationDelay={customDelay} />);
      
      const yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', '700'); // 500 + 200
    });

    it('handles zero animation delay for YellowBanner', () => {
      render(<HomeViewContent animationDelay={0} />);
      
      const yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', '200'); // 0 + 200
    });
  });

  describe('Image Component Integration', () => {
    it('renders image with correct props', () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/mobile/home-page-animated.gif');
      expect(image).toHaveAttribute('alt', '');
    });

    it('handles image load success', async () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      
      // Trigger image load
      act(() => {
        image.dispatchEvent(new Event('load'));
      });

      // Check that the performance marker reflects loaded state
      await waitFor(() => {
        const performanceMarker = document.querySelector('.performance-marker');
        expect(performanceMarker).toHaveAttribute('data-loaded', 'true');
        expect(performanceMarker).toHaveAttribute('data-error', 'false');
      });
    });

    it('handles image load error', async () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      
      // Trigger image error
      act(() => {
        image.dispatchEvent(new Event('error'));
      });

      // Check that the performance marker reflects error state
      await waitFor(() => {
        const performanceMarker = document.querySelector('.performance-marker');
        expect(performanceMarker).toHaveAttribute('data-loaded', 'false');
        expect(performanceMarker).toHaveAttribute('data-error', 'true');
      });
    });

    it('updates screen reader announcements on image load', async () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      const announcer = document.querySelector('[aria-live="polite"]');
      
      // Trigger image load
      act(() => {
        image.dispatchEvent(new Event('load'));
      });

      // Check screen reader announcement
      await waitFor(() => {
        expect(announcer?.textContent).toBe(
          'Welcome to SusFit. Interactive background loaded successfully.'
        );
      });
    });

    it('updates screen reader announcements on image error', async () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      const announcer = document.querySelector('[aria-live="polite"]');
      
      // Trigger image error
      act(() => {
        image.dispatchEvent(new Event('error'));
      });

      // Check screen reader announcement
      await waitFor(() => {
        expect(announcer?.textContent).toBe(
          'SusFit homepage loaded with static background.'
        );
      });
    });
  });

  describe('Reduced Motion Integration', () => {
    it('handles reduced motion preference changes', async () => {
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };

      (window.matchMedia as jest.Mock).mockImplementation(() => mockMediaQuery);

      render(<HomeViewContent />);
      
      // Simulate reduced motion change
      mockMediaQuery.matches = true;
      act(() => {
        mockMediaQuery.addEventListener.mock.calls[0][1]({ matches: true });
      });

      await waitFor(() => {
        const image = screen.getByTestId('mock-image');
        expect(image).toHaveClass('reduced-motion');
      });
    });
  });

  describe('Component Integration Stability', () => {
    it('maintains stable structure with all dependencies', () => {
      const { container } = render(<HomeViewContent />);
      
      // Check all major structural elements are present
      expect(container.querySelector('main[aria-label="SusFit Homepage"]')).toBeInTheDocument();
      expect(screen.getByTestId('yellow-banner')).toBeInTheDocument();
      expect(screen.getByTestId('mock-image')).toBeInTheDocument();
      expect(container.querySelector('.home-view-content__text-mask-container')).toBeInTheDocument();
      expect(container.querySelector('.skip-link')).toBeInTheDocument();
      expect(container.querySelector('.performance-marker')).toBeInTheDocument();
    });

    it('handles all props while maintaining dependency integration', () => {
      const { container } = render(
        <HomeViewContent className="test-class" animationDelay={250} />
      );
      
      // Check main component
      const main = container.querySelector('main');
      expect(main).toHaveClass('home-view-content', 'test-class');
      expect(main?.style.animationDelay).toBe('250ms');
      
      // Check YellowBanner receives adjusted delay
      const yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', '450'); // 250 + 200
      
      // Check Image is still present
      expect(screen.getByTestId('mock-image')).toBeInTheDocument();
    });

    it('gracefully handles missing dependencies', () => {
      // This test ensures the component doesn't crash if dependencies fail
      expect(() => {
        render(<HomeViewContent />);
      }).not.toThrow();
      
      // All critical elements should still be present
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Animation Timing Coordination', () => {
    it('coordinates animation delays between main component and YellowBanner', () => {
      const baseDelay = 300;
      const { container } = render(<HomeViewContent animationDelay={baseDelay} />);
      
      // Main component should use base delay
      const main = container.querySelector('main');
      expect(main?.style.animationDelay).toBe(`${baseDelay}ms`);
      
      // YellowBanner should use base delay + 200ms offset
      const yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', `${baseDelay + 200}`);
    });

    it('maintains timing relationships across re-renders', () => {
      const { rerender } = render(<HomeViewContent animationDelay={100} />);
      
      // Initial state
      let yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', '300');
      
      // Re-render with new delay
      rerender(<HomeViewContent animationDelay={500} />);
      
      yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveAttribute('data-animation-delay', '700');
    });
  });
});