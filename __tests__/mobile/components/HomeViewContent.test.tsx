import { render, screen } from '@testing-library/react'
import { HomeViewContent } from '../../../src/mobile/components/HomeViewContent'

describe('HomeViewContent', () => {
  describe('Rendering', () => {
    it('renders the component without errors', () => {
      render(<HomeViewContent />)
      // Check for the first line of text - there are 2 instances due to text layering
      const letsParts = screen.getAllByText('Let\'s')
      expect(letsParts).toHaveLength(2)
      expect(letsParts[0]).toBeInTheDocument()
    })

    it('renders with correct base structure', () => {
      const { container } = render(<HomeViewContent />)
      const rootElement = container.firstElementChild
      
      expect(rootElement).toHaveAttribute('role', 'main')
      expect(rootElement).toHaveClass('home-view-content')
      expect(rootElement).toHaveAttribute('aria-label', 'SusFit Homepage')
    })

    it('renders main content correctly', () => {
      render(<HomeViewContent />)
      // Check for individual text parts since they're in separate divs (2 layers each)
      const letsParts = screen.getAllByText('Let\'s')
      const getParts = screen.getAllByText('Get')
      const youParts = screen.getAllByText('You')
      const fittedParts = screen.getAllByText('Fitted')
      expect(letsParts).toHaveLength(2)
      expect(getParts).toHaveLength(2)
      expect(youParts).toHaveLength(2)
      expect(fittedParts).toHaveLength(2)
      
      const headingElement = screen.getByRole('heading', { level: 1 })
      expect(headingElement).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('accepts className prop and applies it correctly', () => {
      const testClassName = 'custom-test-class'
      const { container } = render(<HomeViewContent className={testClassName} />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('home-view-content', testClassName)
    })

    it('handles undefined className gracefully', () => {
      const { container } = render(<HomeViewContent className={undefined} />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('home-view-content')
      expect(rootDiv?.className).toBe('home-view-content ')
    })

    it('applies default animationDelay of 0', () => {
      const { container } = render(<HomeViewContent />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe('0ms')
    })

    it('accepts and applies custom animationDelay', () => {
      const customDelay = 500
      const { container } = render(<HomeViewContent animationDelay={customDelay} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe('500ms')
    })

    it('handles zero animationDelay correctly', () => {
      const { container } = render(<HomeViewContent animationDelay={0} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe('0ms')
    })
  })

  describe('TypeScript Props Interface', () => {
    it('accepts valid props according to HomeViewContentProps interface', () => {
      // This test ensures TypeScript compilation works correctly
      const validProps = {
        className: 'test-class',
        animationDelay: 100
      }
      
      expect(() => render(<HomeViewContent {...validProps} />)).not.toThrow()
    })

    it('works with optional props', () => {
      // Test that all props are indeed optional
      expect(() => render(<HomeViewContent />)).not.toThrow()
      expect(() => render(<HomeViewContent className="test" />)).not.toThrow()
      expect(() => render(<HomeViewContent animationDelay={200} />)).not.toThrow()
    })
  })

  describe('Component Optimization', () => {
    it('is wrapped with React.memo for performance optimization', () => {
      // Check that the component has displayName set by React.memo
      expect(HomeViewContent.displayName).toBe('HomeViewContent')
    })

    it('renders consistently with same props (memo optimization)', () => {
      const props = { className: 'test', animationDelay: 100 }
      
      const { container: container1 } = render(<HomeViewContent {...props} />)
      const { container: container2 } = render(<HomeViewContent {...props} />)
      
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })
  })

  describe('DOM Structure', () => {
    it('has correct nested structure', () => {
      const { container } = render(<HomeViewContent />)
      
      // Check the main structure
      const mainElement = container.querySelector('main')
      const yellowBanner = container.querySelector('.home-view-content__yellow-shape')
      const textMaskContainer = container.querySelector('.home-view-content__text-mask-container')
      const hiddenGif = container.querySelector('.home-view-content__hidden-gif')
      
      expect(mainElement).toHaveClass('home-view-content')
      expect(yellowBanner).toBeInTheDocument()
      expect(textMaskContainer).toBeInTheDocument()
      expect(hiddenGif).toBeInTheDocument()
    })

    it('maintains semantic structure for content', () => {
      const { container } = render(<HomeViewContent />)
      const mainElement = container.querySelector('main')
      const section = container.querySelector('section')
      const heading = container.querySelector('h1')
      
      expect(mainElement).toHaveAttribute('role', 'main')
      expect(section).toHaveAttribute('aria-labelledby', 'main-headline')
      expect(heading).toHaveAttribute('id', 'main-headline')
    })
  })

  describe('Accessibility', () => {
    it('renders content that is accessible to screen readers', () => {
      render(<HomeViewContent />)
      
      // Check for proper semantic structure
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
      
      // Check for main landmark
      const mainLandmark = screen.getByRole('main')
      expect(mainLandmark).toBeInTheDocument()
      
      // Check for text content that would be read by screen readers
      const letsTexts = screen.getAllByText('Let\'s')
      expect(letsTexts).toHaveLength(2)
      expect(letsTexts[0]).toBeInTheDocument()
      expect(letsTexts[0]).toBeVisible()
      
      // Check aria-label
      expect(mainLandmark).toHaveAttribute('aria-label', 'SusFit Homepage')
    })
  })

  describe('Error Boundary Compatibility', () => {
    it('does not throw errors during rendering', () => {
      // Ensure component renders without throwing
      expect(() => {
        render(<HomeViewContent />)
      }).not.toThrow()
    })

    it('handles edge case props gracefully', () => {
      // Test with various edge case prop values
      expect(() => {
        render(<HomeViewContent className="" animationDelay={-1} />)
      }).not.toThrow()
      
      expect(() => {
        render(<HomeViewContent className="  " animationDelay={99999} />)
      }).not.toThrow()
    })
  })

  describe('Style Application', () => {
    it('correctly applies inline styles for animation delay', () => {
      const delay = 250
      const { container } = render(<HomeViewContent animationDelay={delay} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe(`${delay}ms`)
    })

    it('preserves existing CSS classes while adding custom ones', () => {
      const customClass = 'my-custom-class another-class'
      const { container } = render(<HomeViewContent className={customClass} />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('home-view-content')
      expect(rootDiv).toHaveClass('my-custom-class')
      expect(rootDiv).toHaveClass('another-class')
    })
  })
})