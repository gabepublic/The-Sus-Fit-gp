import React from 'react';
import { render, screen } from '@testing-library/react';
import { SaucyTicker } from '../../../src/components/ui/saucy-ticker';

// Mock react-fast-marquee
jest.mock('react-fast-marquee', () => {
  return function MockMarquee({ children, speed, gradient, pauseOnHover, direction, delay, loop }: any) {
    return (
      <div 
        data-testid="marquee"
        data-speed={speed}
        data-gradient={gradient}
        data-pause-on-hover={pauseOnHover}
        data-direction={direction}
        data-delay={delay}
        data-loop={loop}
      >
        {children}
      </div>
    );
  };
});

describe('SaucyTicker', () => {
  it('should render the ticker container', () => {
    render(<SaucyTicker />);
    
    const container = screen.getByTestId('marquee').closest('.ticker-container');
    expect(container).toBeInTheDocument();
  });

  it('should render all phrases', () => {
    const expectedPhrases = [
      "Posin'",
      "That's my angle",
      "Just for the gram",
      "Actin' brand new",
      "Cappin'",
      "Lookin' Fab",
      "Glow Up Suspiciously",
      "Fake it 'til you make it",
    ];

    render(<SaucyTicker />);
    
    expectedPhrases.forEach(phrase => {
      expect(screen.getByText(phrase)).toBeInTheDocument();
    });
  });

  it('should render separators between phrases', () => {
    render(<SaucyTicker />);
    
    const separators = screen.getAllByText('•');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('should configure Marquee with correct props', () => {
    render(<SaucyTicker />);
    
    const marquee = screen.getByTestId('marquee');
    expect(marquee).toHaveAttribute('data-speed', '50');
    expect(marquee).toHaveAttribute('data-gradient', 'false');
    expect(marquee).toHaveAttribute('data-pause-on-hover', 'true');
    expect(marquee).toHaveAttribute('data-direction', 'right');
    expect(marquee).toHaveAttribute('data-delay', '0');
    expect(marquee).toHaveAttribute('data-loop', '0');
  });

  it('should render ticker items with correct classes', () => {
    render(<SaucyTicker />);
    
    const tickerItems = document.querySelectorAll('.ticker-item');
    expect(tickerItems.length).toBe(8); // 8 phrases
    
    tickerItems.forEach(item => {
      expect(item).toHaveClass('ticker-item');
    });
  });

  it('should render separators with correct classes', () => {
    render(<SaucyTicker />);
    
    const separators = document.querySelectorAll('.separator');
    expect(separators.length).toBe(7); // 7 separators for 8 phrases
    
    separators.forEach(separator => {
      expect(separator).toHaveClass('separator');
    });
  });
}); 