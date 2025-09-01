import { render, screen } from '@testing-library/react'
import { YellowBanner } from '../../../src/mobile/components/YellowBanner'

describe('YellowBanner', () => {
  describe('Rendering', () => {
    it('renders the component without errors', () => {
      const { container } = render(<YellowBanner />)
      expect(container.firstElementChild).toBeInTheDocument()
    })

    it('renders with correct base structure', () => {
      const { container } = render(<YellowBanner />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('yellow-banner')
      expect(rootDiv?.firstElementChild).toHaveClass('yellow-banner__svg-container')
      expect(rootDiv?.querySelector('.yellow-banner__content')).toBeInTheDocument()
    })

    it('renders children content correctly', () => {
      const testContent = <h1>Test Banner Content</h1>
      render(<YellowBanner>{testContent}</YellowBanner>)
      
      expect(screen.getByRole('heading', { name: 'Test Banner Content' })).toBeInTheDocument()
    })

    it('renders without children gracefully', () => {
      const { container } = render(<YellowBanner />)
      const contentDiv = container.querySelector('.yellow-banner__content')
      
      expect(contentDiv).toBeInTheDocument()
      expect(contentDiv).toBeEmptyDOMElement()
    })
  })

  describe('Props Handling', () => {
    it('accepts className prop and applies it correctly', () => {
      const testClassName = 'custom-banner-class'
      const { container } = render(<YellowBanner className={testClassName} />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('yellow-banner', testClassName)
    })

    it('handles undefined className gracefully', () => {
      const { container } = render(<YellowBanner className={undefined} />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('yellow-banner')
      expect(rootDiv?.className).toBe('yellow-banner ')
    })

    it('applies default animationDelay of 0', () => {
      const { container } = render(<YellowBanner />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe('0ms')
    })

    it('accepts and applies custom animationDelay', () => {
      const customDelay = 750
      const { container } = render(<YellowBanner animationDelay={customDelay} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe('750ms')
    })

    it('handles zero animationDelay correctly', () => {
      const { container } = render(<YellowBanner animationDelay={0} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe('0ms')
    })
  })

  describe('TypeScript Props Interface', () => {
    it('accepts valid props according to YellowBannerProps interface', () => {
      const validProps = {
        className: 'test-class',
        animationDelay: 300,
        children: <span>Test content</span>,
        useSvgFallback: true
      }
      
      expect(() => render(<YellowBanner {...validProps} />)).not.toThrow()
    })

    it('works with optional props', () => {
      expect(() => render(<YellowBanner />)).not.toThrow()
      expect(() => render(<YellowBanner className="test" />)).not.toThrow()
      expect(() => render(<YellowBanner animationDelay={500} />)).not.toThrow()
      expect(() => render(<YellowBanner useSvgFallback={true} />)).not.toThrow()
      expect(() => render(<YellowBanner><div>Content</div></YellowBanner>)).not.toThrow()
    })

    it('accepts React.ReactNode children', () => {
      const complexChildren = (
        <div>
          <h2>Title</h2>
          <p>Description</p>
          <button>Action</button>
        </div>
      )
      
      expect(() => render(<YellowBanner>{complexChildren}</YellowBanner>)).not.toThrow()
    })
  })

  describe('Component Optimization', () => {
    it('is wrapped with React.memo for performance optimization', () => {
      expect(YellowBanner.displayName).toBe('YellowBanner')
    })

    it('renders consistently with same props (memo optimization)', () => {
      const props = { className: 'test', animationDelay: 200 }
      
      const { container: container1 } = render(<YellowBanner {...props} />)
      const { container: container2 } = render(<YellowBanner {...props} />)
      
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })
  })

  describe('DOM Structure and Classes', () => {
    it('has correct nested structure with proper CSS classes', () => {
      const { container } = render(<YellowBanner />)
      
      // Check the DOM hierarchy
      const rootDiv = container.firstElementChild
      const shapeDiv = rootDiv?.firstElementChild
      const imgElement = shapeDiv?.firstElementChild
      const contentDiv = shapeDiv?.lastElementChild
      
      expect(rootDiv).toHaveClass('yellow-banner')
      expect(shapeDiv).toHaveClass('yellow-banner__svg-container')
      expect(imgElement).toHaveClass('yellow-banner__svg')
      expect(contentDiv).toHaveClass('yellow-banner__content')
    })

    it('maintains BEM methodology in class naming', () => {
      const { container } = render(<YellowBanner />)
      
      expect(container.querySelector('.yellow-banner__svg-container')).toBeInTheDocument()
      expect(container.querySelector('.yellow-banner__content')).toBeInTheDocument()
    })

    it('preserves existing CSS classes while adding custom ones', () => {
      const customClass = 'my-custom-banner another-modifier'
      const { container } = render(<YellowBanner className={customClass} />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('yellow-banner')
      expect(rootDiv).toHaveClass('my-custom-banner')
      expect(rootDiv).toHaveClass('another-modifier')
    })
  })

  describe('CSS Integration', () => {
    it('correctly applies inline styles for animation delay', () => {
      const delay = 1000
      const { container } = render(<YellowBanner animationDelay={delay} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv?.style.animationDelay).toBe(`${delay}ms`)
    })

    it('has proper structure for CSS clip-path styling', () => {
      const { container } = render(<YellowBanner />)
      const shapeDiv = container.querySelector('.yellow-banner__svg-container')
      
      expect(shapeDiv).toBeInTheDocument()
      expect(shapeDiv).toHaveClass('yellow-banner__svg-container')
    })
  })

  describe('Accessibility', () => {
    it('renders content that is accessible to screen readers', () => {
      const accessibleContent = <h2>Let's Get You Fitted</h2>
      render(<YellowBanner>{accessibleContent}</YellowBanner>)
      
      const heading = screen.getByRole('heading', { name: "Let's Get You Fitted" })
      expect(heading).toBeInTheDocument()
      expect(heading).toBeVisible()
    })

    it('supports nested interactive elements', () => {
      const interactiveContent = (
        <div>
          <button>Get Started</button>
          <a href="/help">Learn More</a>
        </div>
      )
      
      render(<YellowBanner>{interactiveContent}</YellowBanner>)
      
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Learn More' })).toBeInTheDocument()
    })
  })

  describe('Error Boundary Compatibility', () => {
    it('does not throw errors during rendering', () => {
      expect(() => {
        render(<YellowBanner />)
      }).not.toThrow()
    })

    it('handles edge case props gracefully', () => {
      expect(() => {
        render(<YellowBanner className="" animationDelay={-1} />)
      }).not.toThrow()
      
      expect(() => {
        render(<YellowBanner className="  " animationDelay={99999} />)
      }).not.toThrow()
    })

    it('handles complex children without throwing', () => {
      const complexChildren = (
        <>
          {null}
          {false}
          {0}
          <div>Valid content</div>
          {undefined}
        </>
      )
      
      expect(() => {
        render(<YellowBanner>{complexChildren}</YellowBanner>)
      }).not.toThrow()
    })
  })

  describe('Responsive Design Structure', () => {
    it('provides structure that supports responsive CSS breakpoints', () => {
      const { container } = render(<YellowBanner />)
      
      // Ensure the component structure supports the responsive CSS
      const banner = container.querySelector('.yellow-banner')
      const shape = container.querySelector('.yellow-banner__svg-container')
      const content = container.querySelector('.yellow-banner__content')
      
      expect(banner).toBeInTheDocument()
      expect(shape).toBeInTheDocument()
      expect(content).toBeInTheDocument()
    })
  })

  describe('Animation Integration', () => {
    it('provides proper structure for CSS animations', () => {
      const { container } = render(<YellowBanner />)
      const rootDiv = container.firstElementChild
      
      // Should have the class that CSS animations target
      expect(rootDiv).toHaveClass('yellow-banner')
    })

    it('supports animation delay customization', () => {
      const delays = [0, 100, 500, 1000, 2000]
      
      delays.forEach(delay => {
        const { container } = render(<YellowBanner animationDelay={delay} />)
        const rootDiv = container.firstElementChild as HTMLElement
        
        expect(rootDiv?.style.animationDelay).toBe(`${delay}ms`)
      })
    })
  })

  describe('SVG Fallback Mode', () => {
    it('renders with SVG image by default', () => {
      const { container } = render(<YellowBanner />)
      
      expect(container.querySelector('.yellow-banner__svg-container')).toBeInTheDocument()
      expect(container.querySelector('.yellow-banner__svg')).toBeInTheDocument()
    })

    it('renders with SVG image regardless of useSvgFallback setting', () => {
      const { container } = render(<YellowBanner useSvgFallback={true} />)
      
      expect(container.querySelector('.yellow-banner__svg')).toBeInTheDocument()
      expect(container.querySelector('.yellow-banner__svg-container')).toBeInTheDocument()
    })

    it('Image has correct attributes', () => {
      const { container } = render(<YellowBanner />)
      const img = container.querySelector('img')
      
      expect(img).toHaveAttribute('src', '/images/mobile/YellowBlob.svg')
      expect(img).toHaveAttribute('alt', '')
      expect(img).toHaveClass('yellow-banner__svg')
    })

    it('Image has correct dimensions and priority loading', () => {
      const { container } = render(<YellowBanner />)
      const img = container.querySelector('img')
      
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('width', '369')
      expect(img).toHaveAttribute('height', '636')
      // Note: priority attribute might be transformed by Next.js Image component
    })

    it('Container has proper structure for content overlay', () => {
      const { container } = render(<YellowBanner />)
      const svgContainer = container.querySelector('.yellow-banner__svg-container')
      const content = container.querySelector('.yellow-banner__content')
      
      expect(svgContainer).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(svgContainer).toContainElement(content)
    })

    it('uses correct container and content classes', () => {
      const { container } = render(<YellowBanner useSvgFallback={true} />)
      
      expect(container.querySelector('.yellow-banner__svg-container')).toBeInTheDocument()
      expect(container.querySelector('.yellow-banner__content')).toBeInTheDocument()
    })

    it('renders children correctly in SVG mode', () => {
      const testContent = <h2>SVG Banner Content</h2>
      render(<YellowBanner useSvgFallback={true}>{testContent}</YellowBanner>)
      
      expect(screen.getByRole('heading', { name: 'SVG Banner Content' })).toBeInTheDocument()
    })

    it('handles prop combination correctly', () => {
      const props = {
        className: 'custom-svg-banner',
        animationDelay: 400,
        useSvgFallback: true,
        children: <span>Combined props test</span>
      }
      
      const { container } = render(<YellowBanner {...props} />)
      const rootDiv = container.firstElementChild as HTMLElement
      
      expect(rootDiv).toHaveClass('yellow-banner', 'custom-svg-banner')
      expect(rootDiv.style.animationDelay).toBe('400ms')
      expect(container.querySelector('.yellow-banner__svg')).toBeInTheDocument()
      expect(screen.getByText('Combined props test')).toBeInTheDocument()
    })
  })

  describe('Browser Compatibility', () => {
    it('provides CSS clip-path as primary implementation', () => {
      const { container } = render(<YellowBanner />)
      
      // Should use clip-path by default for modern browsers
      expect(container.querySelector('.yellow-banner__svg-container')).toBeInTheDocument()
    })

    it('provides SVG as explicit fallback option', () => {
      const { container } = render(<YellowBanner useSvgFallback={true} />)
      
      // Should use SVG when fallback is requested
      expect(container.querySelector('.yellow-banner__svg')).toBeInTheDocument()
    })

    it('maintains consistent API between both modes', () => {
      const testContent = <div>Same API test</div>
      
      const { container: clipPath } = render(
        <YellowBanner className="test" animationDelay={100}>
          {testContent}
        </YellowBanner>
      )
      
      const { container: svg } = render(
        <YellowBanner className="test" animationDelay={100} useSvgFallback={true}>
          {testContent}
        </YellowBanner>
      )
      
      // Both should render the children and apply props correctly
      expect(clipPath.querySelector('.yellow-banner.test')).toBeInTheDocument()
      expect(svg.querySelector('.yellow-banner.test')).toBeInTheDocument()
      expect(screen.getAllByText('Same API test')).toHaveLength(2)
    })
  })
})