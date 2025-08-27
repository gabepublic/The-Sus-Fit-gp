import React from 'react';
import { render, screen } from '@testing-library/react';
import MobileHomePage from '../../../src/app/(mobile)/m/home/page';

// Mock the HomeViewContent component
jest.mock('../../../src/mobile/components', () => ({
  HomeViewContent: ({ className, animationDelay }: { className: string; animationDelay: number }) => (
    <div data-testid="home-view-content" className={className} data-animation-delay={animationDelay}>
      <h1>Let's Get You Fitted</h1>
    </div>
  ),
}));

describe('Mobile Home Page Integration', () => {
  it('renders the home page with HomeViewContent component', () => {
    render(<MobileHomePage />);
    
    // Check that the main container is rendered
    expect(document.querySelector('.mobile-home-page')).toBeInTheDocument();
    
    // Check that HomeViewContent is rendered
    const homeViewContent = screen.getByTestId('home-view-content');
    expect(homeViewContent).toBeInTheDocument();
    expect(homeViewContent).toHaveClass('home-view-integrated');
    expect(homeViewContent).toHaveAttribute('data-animation-delay', '100');
  });

  it('includes proper accessibility skip link anchor', () => {
    render(<MobileHomePage />);
    
    const skipLinkAnchor = document.getElementById('main-content');
    expect(skipLinkAnchor).toBeInTheDocument();
    expect(skipLinkAnchor).toHaveAttribute('tabIndex', '-1');
    expect(skipLinkAnchor).toHaveClass('sr-only');
  });

  it('renders with Suspense boundary', () => {
    render(<MobileHomePage />);
    
    // The component should render successfully with Suspense
    expect(screen.getByTestId('home-view-content')).toBeInTheDocument();
  });

  it('passes correct props to HomeViewContent', () => {
    render(<MobileHomePage />);
    
    const homeViewContent = screen.getByTestId('home-view-content');
    expect(homeViewContent).toHaveClass('home-view-integrated');
    expect(homeViewContent).toHaveAttribute('data-animation-delay', '100');
  });

  it('includes expected text content', () => {
    render(<MobileHomePage />);
    
    // Should show the main heading from HomeViewContent
    expect(screen.getByText('Let\'s Get You Fitted')).toBeInTheDocument();
  });

  it('has proper page structure', () => {
    render(<MobileHomePage />);
    
    const container = document.querySelector('.mobile-home-page');
    expect(container).toBeInTheDocument();
    
    // Should contain the HomeViewContent component
    const homeViewContent = screen.getByTestId('home-view-content');
    expect(container).toContainElement(homeViewContent);
    
    // Should contain the skip link anchor
    const skipAnchor = document.getElementById('main-content');
    expect(container).toContainElement(skipAnchor);
  });
});