import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HomeViewContent } from '../../../src/mobile/components/HomeViewContent';

// Mock matchMedia for prefers-reduced-motion testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('HomeViewContent Accessibility', () => {
  it('renders with proper semantic HTML structure', () => {
    render(<HomeViewContent />);
    
    // Check main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByLabelText('SusFit Homepage')).toBeInTheDocument();
    
    // Check heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Let\'s Get You Fitted')).toBeInTheDocument();
  });

  it('provides screen reader announcements', async () => {
    render(<HomeViewContent />);
    
    // Check for aria-live region
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('includes skip link for keyboard navigation', () => {
    render(<HomeViewContent />);
    
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink).toHaveAttribute('tabIndex', '0');
  });

  it('provides proper image descriptions', () => {
    render(<HomeViewContent />);
    
    // Background should have role="img" with dynamic aria-label
    const background = screen.getByLabelText('Loading background content');
    expect(background).toBeInTheDocument();
    expect(background).toHaveAttribute('role', 'img');
  });

  it('supports reduced motion preferences', () => {
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
    
    // Component should still render properly with reduced motion
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('includes performance monitoring markers', () => {
    render(<HomeViewContent />);
    
    const marker = document.querySelector('.performance-marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-component', 'home-view-content');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  it('provides comprehensive screen reader content', () => {
    render(<HomeViewContent />);
    
    // Check for descriptive text for screen readers
    const srText = screen.getByText('Let\'s Get You Fitted - Welcome to SusFit, your personal fitting experience');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('sr-only');
  });

  it('has proper ARIA labelledby relationships', () => {
    render(<HomeViewContent />);
    
    const section = document.querySelector('[aria-labelledby="main-headline"]');
    const heading = document.querySelector('#main-headline');
    
    expect(section).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
  });
});