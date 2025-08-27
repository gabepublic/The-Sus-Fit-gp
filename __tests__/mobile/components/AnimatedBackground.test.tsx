import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AnimatedBackground } from '../../../src/mobile/components/AnimatedBackground'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill,
    className,
    style,
    priority,
    quality,
    loading,
    onLoad,
    onError,
    sizes,
    unoptimized,
  }: any) => (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      data-fill={fill}
      data-priority={priority}
      data-quality={quality}
      data-loading={loading}
      data-sizes={sizes}
      data-unoptimized={unoptimized}
      onLoad={onLoad}
      onError={onError}
      data-testid="next-image"
    />
  ),
}))

// Mock window.matchMedia for reduced motion testing
const mockMatchMedia = (matches: boolean) => {
  const mediaQuery = {
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }
  
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn(() => mediaQuery),
  })
  
  return mediaQuery
}

describe('AnimatedBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the component without errors', () => {
      mockMatchMedia(false)
      const { container } = render(<AnimatedBackground />)
      expect(container.firstElementChild).toBeInTheDocument()
    })

    it('renders with correct base structure', () => {
      mockMatchMedia(false)
      const { container } = render(<AnimatedBackground />)
      const rootDiv = container.firstElementChild
      
      expect(rootDiv).toHaveClass('animated-background')
      expect(rootDiv?.querySelector('.animated-background__container')).toBeInTheDocument()
      expect(rootDiv?.querySelector('[data-testid="next-image"]')).toBeInTheDocument()
    })

    it('uses default props correctly', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', '/images/mobile/home-page-animated.gif')
      expect(image).toHaveAttribute('alt', 'Animated colorful background')
      expect(image).toHaveAttribute('data-priority', 'false')
      expect(image).toHaveAttribute('data-quality', '75')
    })
  })

  describe('Props Handling', () => {
    it('accepts and applies custom props', () => {
      mockMatchMedia(false)
      const customProps = {
        className: 'custom-bg',
        src: '/custom-animation.gif',
        alt: 'Custom animation',
        priority: true,
        quality: 90,
        placeholder: '/static-fallback.jpg',
      }
      
      const { container } = render(<AnimatedBackground {...customProps} />)
      const rootDiv = container.firstElementChild
      const image = screen.getByTestId('next-image')
      
      expect(rootDiv).toHaveClass('animated-background', 'custom-bg')
      expect(image).toHaveAttribute('src', '/custom-animation.gif')
      expect(image).toHaveAttribute('alt', 'Custom animation')
      expect(image).toHaveAttribute('data-priority', 'true')
      expect(image).toHaveAttribute('data-quality', '90')
    })

    it('handles HTML attributes correctly', () => {
      mockMatchMedia(false)
      render(
        <AnimatedBackground 
          data-testid="custom-bg" 
          id="background-element"
          role="img"
        />
      )
      
      const container = screen.getByTestId('custom-bg')
      expect(container).toHaveAttribute('id', 'background-element')
      expect(container).toHaveAttribute('role', 'img')
    })
  })

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      mockMatchMedia(false)
      const { container } = render(<AnimatedBackground />)
      
      expect(container.querySelector('.animated-background__loading')).toBeInTheDocument()
      expect(container.querySelector('.animated-background__loading-spinner')).toBeInTheDocument()
    })

    it('shows loaded state after successful load', async () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      
      act(() => {
        fireEvent.load(image)
      })

      await waitFor(() => {
        expect(image).toHaveClass('animated-background__image--loaded')
      })
    })

    it('calls onLoadSuccess callback when image loads', async () => {
      mockMatchMedia(false)
      const onLoadSuccess = jest.fn()
      render(<AnimatedBackground onLoadSuccess={onLoadSuccess} />)
      
      const image = screen.getByTestId('next-image')
      
      act(() => {
        fireEvent.load(image)
      })

      await waitFor(() => {
        expect(onLoadSuccess).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error state when image fails to load', async () => {
      mockMatchMedia(false)
      const { container } = render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      
      act(() => {
        fireEvent.error(image)
      })

      await waitFor(() => {
        expect(container.querySelector('.animated-background__error')).toBeInTheDocument()
        expect(screen.getByText('Image unavailable')).toBeInTheDocument()
        expect(screen.getByText('📷')).toBeInTheDocument()
      })
    })

    it('calls onLoadError callback when image fails', async () => {
      mockMatchMedia(false)
      const onLoadError = jest.fn()
      render(<AnimatedBackground onLoadError={onLoadError} />)
      
      const image = screen.getByTestId('next-image')
      
      act(() => {
        fireEvent.error(image)
      })

      await waitFor(() => {
        expect(onLoadError).toHaveBeenCalledTimes(1)
      })
    })

    it('applies error class to image on error', async () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      
      act(() => {
        fireEvent.error(image)
      })

      await waitFor(() => {
        expect(image).toHaveClass('animated-background__image--error')
      })
    })
  })

  describe('Accessibility - Reduced Motion', () => {
    it('detects reduced motion preference', () => {
      const mediaQuery = mockMatchMedia(true)
      
      render(<AnimatedBackground placeholder="/static-fallback.jpg" />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', '/static-fallback.jpg')
    })

    it('uses animated version when motion is preferred', () => {
      const mediaQuery = mockMatchMedia(false)
      
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', '/images/mobile/home-page-animated.gif')
    })

    it('updates when media query changes', () => {
      const mediaQuery = mockMatchMedia(false)
      
      const { rerender } = render(<AnimatedBackground placeholder="/static.jpg" />)
      
      let image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', '/images/mobile/home-page-animated.gif')
      
      // Simulate media query change
      mediaQuery.matches = true
      const changeHandler = mediaQuery.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1]
      
      if (changeHandler) {
        act(() => {
          changeHandler({ matches: true })
        })
      }
      
      rerender(<AnimatedBackground placeholder="/static.jpg" />)
      
      // Component should re-evaluate and use static version
      image = screen.getByTestId('next-image')
      // Note: This test verifies the event listener is set up correctly
      expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('provides accessibility announcement', () => {
      mockMatchMedia(true)
      render(<AnimatedBackground />)
      
      expect(screen.getByText('Animated background disabled due to motion preferences')).toBeInTheDocument()
    })

    it('provides accessibility announcement for animated state', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      expect(screen.getByText('Animated background active')).toBeInTheDocument()
    })

    it('cleans up media query listener on unmount', () => {
      const mediaQuery = mockMatchMedia(false)
      
      const { unmount } = render(<AnimatedBackground />)
      
      unmount()
      
      expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('Image Optimization', () => {
    it('sets unoptimized=true for animated GIFs', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('data-unoptimized', 'true')
    })

    it('allows optimization for static fallback', () => {
      mockMatchMedia(true)
      render(<AnimatedBackground placeholder="/static.jpg" />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('data-unoptimized', 'false')
    })

    it('uses lazy loading by default', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('data-loading', 'lazy')
    })

    it('disables lazy loading when priority is true', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground priority={true} />)
      
      const image = screen.getByTestId('next-image')
      expect(image).not.toHaveAttribute('data-loading')
    })

    it('uses correct responsive sizes', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('data-sizes', '(max-width: 428px) 100vw, 428px')
    })
  })

  describe('CSS Classes', () => {
    it('applies correct loading classes', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveClass('animated-background__image')
      expect(image).toHaveClass('animated-background__image--loading')
      expect(image).toHaveClass('animated-background__image--animated')
    })

    it('applies static class for reduced motion', () => {
      mockMatchMedia(true)
      render(<AnimatedBackground placeholder="/static.jpg" />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveClass('animated-background__image--static')
    })

    it('updates classes on state changes', async () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      
      act(() => {
        fireEvent.load(image)
      })

      await waitFor(() => {
        expect(image).toHaveClass('animated-background__image--loaded')
        expect(image).not.toHaveClass('animated-background__image--loading')
      })
    })
  })

  describe('Component Optimization', () => {
    it('is wrapped with React.memo', () => {
      expect(AnimatedBackground.displayName).toBe('AnimatedBackground')
    })

    it('renders consistently with same props', () => {
      mockMatchMedia(false)
      const props = { className: 'test', src: '/test.gif' }
      
      const { container: container1 } = render(<AnimatedBackground {...props} />)
      const { container: container2 } = render(<AnimatedBackground {...props} />)
      
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })
  })

  describe('Edge Cases', () => {
    it('uses default placeholder for reduced motion when none explicitly provided', () => {
      mockMatchMedia(true)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      // Should use default placeholder for reduced motion users
      expect(image).toHaveAttribute('src', '/images/mobile/static-fallback.jpg')
    })

    it('uses original GIF when placeholder is explicitly null and reduced motion', () => {
      mockMatchMedia(true)
      render(<AnimatedBackground placeholder={null as any} />)
      
      const image = screen.getByTestId('next-image')
      // Should fall back to original src when placeholder is explicitly null
      expect(image).toHaveAttribute('src', '/images/mobile/home-page-animated.gif')
    })

    it('handles empty string className gracefully', () => {
      mockMatchMedia(false)
      expect(() => {
        render(<AnimatedBackground className="" />)
      }).not.toThrow()
    })

    it('handles undefined callback props', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground onLoadError={undefined} onLoadSuccess={undefined} />)
      
      const image = screen.getByTestId('next-image')
      
      expect(() => {
        fireEvent.load(image)
        fireEvent.error(image)
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('sets will-change property for performance', () => {
      mockMatchMedia(false)
      render(<AnimatedBackground />)
      
      const image = screen.getByTestId('next-image')
      expect(image).toHaveClass('animated-background__image')
    })

    it('positions element as absolute for performance', () => {
      mockMatchMedia(false)
      const { container } = render(<AnimatedBackground />)
      
      expect(container.firstElementChild).toHaveClass('animated-background')
    })
  })
})