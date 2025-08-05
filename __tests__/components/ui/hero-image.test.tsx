import React from 'react';
import { render, screen } from '@testing-library/react';
import { HeroImage } from '../../../src/components/ui/hero-image';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, className, priority, fill, sizes }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        data-priority={priority}
        data-fill={fill}
        data-sizes={sizes}
      />
    );
  };
});

describe('HeroImage', () => {
  it('should render with required props', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image" 
      />
    );
    
    const image = screen.getByAltText('Test hero image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should render with custom className', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
        className="custom-class"
      />
    );
    
    // Find the outer container div that has the custom className
    const container = screen.getByAltText('Test hero image').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should render with priority prop', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
        priority={true}
      />
    );
    
    const image = screen.getByAltText('Test hero image');
    expect(image).toHaveAttribute('data-priority', 'true');
  });

  it('should render without priority by default', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
      />
    );
    
    const image = screen.getByAltText('Test hero image');
    expect(image).toHaveAttribute('data-priority', 'true'); // default is true
  });

  it('should render with fill prop', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
      />
    );
    
    const image = screen.getByAltText('Test hero image');
    expect(image).toHaveAttribute('data-fill', 'true');
  });

  it('should render with correct sizes prop', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
      />
    );
    
    const image = screen.getByAltText('Test hero image');
    expect(image).toHaveAttribute('data-sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw');
  });

  it('should have correct CSS classes', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
      />
    );
    
    const image = screen.getByAltText('Test hero image');
    expect(image).toHaveClass('object-contain', 'drop-shadow-2xl');
  });

  it('should render container with correct classes', () => {
    render(
      <HeroImage 
        src="/test-image.jpg" 
        alt="Test hero image"
      />
    );
    
    // Find the outer container div that has the main classes
    const container = screen.getByAltText('Test hero image').closest('div')?.parentElement;
    expect(container).toHaveClass('relative', 'w-full', 'flex', 'items-center', 'justify-center');
  });
}); 