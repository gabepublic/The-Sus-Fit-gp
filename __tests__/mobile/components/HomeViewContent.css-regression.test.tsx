/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeViewContent } from '../../../src/mobile/components/HomeViewContent';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ fill, priority, unoptimized, quality, sizes, ...props }: any) {
    // Remove Next.js specific props that shouldn't be passed to DOM
    return <img {...props} data-testid="mock-image" />;
  },
}));

// Mock YellowBanner component
jest.mock('../../../src/mobile/components/YellowBanner', () => ({
  YellowBanner: function MockYellowBanner(props: any) {
    return <div {...props} data-testid="yellow-banner">Mock Yellow Banner</div>;
  },
}));

describe('HomeViewContent CSS/Styling Regression Tests', () => {
  beforeEach(() => {
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

  describe('Critical CSS Class Application', () => {
    it('applies core CSS classes to main container', () => {
      const { container } = render(<HomeViewContent />);
      const main = container.firstElementChild;
      
      expect(main).toHaveClass('home-view-content');
      expect(main).toHaveAttribute('role', 'main');
      expect(main).toHaveAttribute('aria-label', 'SusFit Homepage');
    });

    it('maintains CSS class hierarchy for text masking', () => {
      const { container } = render(<HomeViewContent />);
      
      // Text mask container
      const textMaskContainer = container.querySelector('.home-view-content__text-mask-container');
      expect(textMaskContainer).toBeInTheDocument();
      
      // Text section
      const textSection = container.querySelector('.home-view-content__text-section');
      expect(textSection).toBeInTheDocument();
      
      // Text stroke layer
      const textStrokeLayer = container.querySelector('.home-view-content__text-stroke-layer');
      expect(textStrokeLayer).toBeInTheDocument();
      
      // Animated GIF text
      const animatedGifText = container.querySelector('.home-view-content__animated-gif-text');
      expect(animatedGifText).toBeInTheDocument();
    });

    it('applies correct classes to YellowBanner', () => {
      render(<HomeViewContent />);
      
      const yellowBanner = screen.getByTestId('yellow-banner');
      expect(yellowBanner).toHaveClass('home-view-content__yellow-shape');
    });

    it('applies correct classes to image elements', () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      expect(image).toHaveClass('home-view-content__gif');
      expect(image).toHaveClass('loading'); // Initial state
    });
  });

  describe('Dynamic CSS Class Changes', () => {
    it('updates image classes based on loading state', () => {
      const { container } = render(<HomeViewContent />);
      
      const hiddenGifContainer = container.querySelector('.home-view-content__hidden-gif');
      expect(hiddenGifContainer).toBeInTheDocument();
      
      const image = screen.getByTestId('mock-image');
      expect(image).toHaveClass('loading');
      expect(image).not.toHaveClass('loaded');
    });

    it('applies custom className while preserving core classes', () => {
      const customClass = 'custom-home-view test-class';
      const { container } = render(<HomeViewContent className={customClass} />);
      
      const main = container.firstElementChild;
      expect(main).toHaveClass('home-view-content');
      expect(main).toHaveClass('custom-home-view');
      expect(main).toHaveClass('test-class');
    });

    it('handles undefined className gracefully', () => {
      const { container } = render(<HomeViewContent className={undefined} />);
      
      const main = container.firstElementChild;
      expect(main).toHaveClass('home-view-content');
      // Should not have 'undefined' as a class
      expect(main?.className).not.toContain('undefined');
    });
  });

  describe('Inline Style Application', () => {
    it('applies animation delay as inline style', () => {
      const delay = 300;
      const { container } = render(<HomeViewContent animationDelay={delay} />);
      
      const main = container.firstElementChild as HTMLElement;
      expect(main?.style.animationDelay).toBe(`${delay}ms`);
    });

    it('handles zero animation delay correctly', () => {
      const { container } = render(<HomeViewContent animationDelay={0} />);
      
      const main = container.firstElementChild as HTMLElement;
      expect(main?.style.animationDelay).toBe('0ms');
    });

    it('applies default animation delay when not provided', () => {
      const { container } = render(<HomeViewContent />);
      
      const main = container.firstElementChild as HTMLElement;
      expect(main?.style.animationDelay).toBe('0ms');
    });

    it('applies image styles correctly', () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      expect(image.style.objectFit).toBe('cover');
      expect(image.style.objectPosition).toBe('center');
    });
  });

  describe('CSS Architecture Integrity', () => {
    it('maintains semantic heading structure classes', () => {
      const { container } = render(<HomeViewContent />);
      
      // Check title line classes
      const line1 = container.querySelector('.splash-title-line1');
      const line2 = container.querySelector('.splash-title-line2');
      const line3 = container.querySelector('.splash-title-line3');
      
      expect(line1).toBeInTheDocument();
      expect(line2).toBeInTheDocument();
      expect(line3).toBeInTheDocument();
      
      // Should have multiple instances (stroke and gif layers)
      const allLine1s = container.querySelectorAll('.splash-title-line1');
      expect(allLine1s.length).toBe(2); // stroke layer + gif layer
    });

    it('maintains accessibility-specific CSS classes', () => {
      const { container } = render(<HomeViewContent />);
      
      // Skip link
      const skipLink = container.querySelector('.skip-link');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveClass('skip-link');
      
      // Screen reader only content
      const srOnlyElements = container.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
      
      // Performance marker
      const performanceMarker = container.querySelector('.performance-marker');
      expect(performanceMarker).toBeInTheDocument();
      expect(performanceMarker).toHaveClass('performance-marker');
    });

    it('preserves layering structure classes', () => {
      const { container } = render(<HomeViewContent />);
      
      // All critical layout classes must be present
      const criticalClasses = [
        '.home-view-content__text-mask-container',
        '.home-view-content__text-section',
        '.home-view-content__hidden-gif',
        '.home-view-content__text-stroke-layer',
        '.home-view-content__animated-gif-text',
      ];
      
      criticalClasses.forEach(className => {
        const element = container.querySelector(className);
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('CSS State Management', () => {
    it('manages loading and error state classes correctly', () => {
      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      
      // Initial state
      expect(image).toHaveClass('loading');
      expect(image).not.toHaveClass('loaded');
    });

    it('applies reduced motion classes when needed', () => {
      // Mock reduced motion preference
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<HomeViewContent />);
      
      const image = screen.getByTestId('mock-image');
      expect(image).toHaveClass('reduced-motion');
    });
  });

  describe('Critical CSS Regressions Protection', () => {
    it('ensures no unintended style pollution from props', () => {
      const { container: container1 } = render(<HomeViewContent />);
      const { container: container2 } = render(<HomeViewContent className="test" />);
      
      // Base structure should be identical
      const main1 = container1.querySelector('.home-view-content');
      const main2 = container2.querySelector('.home-view-content');
      
      expect(main1?.tagName).toBe(main2?.tagName);
      expect(main1?.getAttribute('role')).toBe(main2?.getAttribute('role'));
      expect(main1?.getAttribute('aria-label')).toBe(main2?.getAttribute('aria-label'));
    });

    it('prevents CSS class conflicts in nested structure', () => {
      const { container } = render(<HomeViewContent className="external-class" />);
      
      // External class should not interfere with internal structure
      const textStrokeLayer = container.querySelector('.home-view-content__text-stroke-layer');
      const animatedGifText = container.querySelector('.home-view-content__animated-gif-text');
      
      expect(textStrokeLayer).not.toHaveClass('external-class');
      expect(animatedGifText).not.toHaveClass('external-class');
      
      // But main should have both
      const main = container.querySelector('.home-view-content');
      expect(main).toHaveClass('home-view-content');
      expect(main).toHaveClass('external-class');
    });

    it('maintains consistent DOM hierarchy for CSS targeting', () => {
      const { container } = render(<HomeViewContent />);
      
      // Check parent-child relationships critical for CSS
      const main = container.querySelector('main.home-view-content');
      const textMaskContainer = main?.querySelector('.home-view-content__text-mask-container');
      const textSection = textMaskContainer?.querySelector('.home-view-content__text-section');
      const textStrokeLayer = textSection?.querySelector('.home-view-content__text-stroke-layer');
      
      expect(main).toBeInTheDocument();
      expect(textMaskContainer).toBeInTheDocument();
      expect(textSection).toBeInTheDocument();
      expect(textStrokeLayer).toBeInTheDocument();
      
      // Verify nesting structure
      expect(main).toContainElement(textMaskContainer as Element);
      expect(textMaskContainer).toContainElement(textSection as Element);
      expect(textSection).toContainElement(textStrokeLayer as Element);
    });
  });
});