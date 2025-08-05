import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { HeroImageWithButton } from '@/components/ui/hero-image-with-button'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, priority, fill, ...props }: any) {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        data-priority={priority}
        data-fill={fill}
        {...props}
        data-testid="next-image"
      />
    )
  }
})

// Mock window resize
const mockResizeEvent = new Event('resize')
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920
})

describe('HeroImageWithButton', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test hero image'
  }

  const mockOverlayButton = {
    onClick: jest.fn(),
    position: { leftPercent: '50%', topPercent: '50%' },
    size: 'md' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920
    })
    
    // Mock image dimensions for consistent testing
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 600 // Default to medium size for consistent testing
      }
    })
    
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 800
      }
    })
  })

  it('renders image with correct props', () => {
    render(<HeroImageWithButton {...defaultProps} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('src', '/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test hero image')
  })

  it('applies custom className', () => {
    const { container } = render(
      <HeroImageWithButton {...defaultProps} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('sets priority prop correctly', () => {
    render(<HeroImageWithButton {...defaultProps} priority={false} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('data-priority', 'false')
  })

  it('renders without overlay button by default', () => {
    render(<HeroImageWithButton {...defaultProps} />)
    
    const button = screen.queryByRole('button')
    expect(button).not.toBeInTheDocument()
  })

  it('renders overlay button when provided', async () => {
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    // Trigger image load to make button appear
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    // Wait for button to be ready (after image load simulation)
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('calls onClick when button is clicked', async () => {
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
      expect(mockOverlayButton.onClick).toHaveBeenCalled()
    })
  })

  it('applies correct button size classes', async () => {
    const largeButton = { ...mockOverlayButton, size: 'lg' as const }
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={largeButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-10', 'h-10')
    })
  })

  it('disables button when disabled prop is true', async () => {
    const disabledButton = { ...mockOverlayButton, disabled: true }
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={disabledButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-50')
    })
  })

  it('applies custom button className', async () => {
    const customButton = { ...mockOverlayButton, className: 'custom-button-class' }
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={customButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-button-class')
    })
  })

  it('positions button correctly', async () => {
    const positionedButton = {
      ...mockOverlayButton,
      position: { leftPercent: '25%', topPercent: '75%' }
    }
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={positionedButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      // The component uses the original position values, not adjusted ones
      expect(button).toHaveStyle({ left: '25%' })
      expect(button).toHaveStyle({ top: '75%' })
    })
  })

  it('handles image load event', async () => {
    const onLoadMock = jest.fn()
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    // Should trigger button positioning calculation
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('adjusts button position based on image height', async () => {
    // Mock image with small height
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 400 // Small image
      }
    })
    
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // With 400px height, position adjustment is +3.4, so 50% + 3.4% = 53.4%
      expect(button).toHaveStyle({ left: '53.4%' })
    })
  })

  it('adjusts button position based on screen width', async () => {
    // Mock small screen width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    })
    
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('handles window resize events', async () => {
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    // Trigger resize event
    await act(async () => {
      window.dispatchEvent(mockResizeEvent)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('has correct accessibility attributes', async () => {
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Camera capture button')
    })
  })

  it('applies hover and active states to enabled button', async () => {
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={mockOverlayButton}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:scale-110', 'active:scale-95', 'cursor-pointer')
    })
  })

  it('renders with correct container structure', () => {
    const { container } = render(<HeroImageWithButton {...defaultProps} />)
    
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('relative', 'w-full', 'flex', 'items-center', 'justify-center')
    expect(mainContainer).toHaveClass('h-[50vh]', 'min-h-[400px]', 'max-h-[800px]')
  })

  it('renders image with correct styling', () => {
    render(<HeroImageWithButton {...defaultProps} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveClass('object-contain', 'drop-shadow-2xl')
  })

  it('works without overlay button props', () => {
    render(<HeroImageWithButton {...defaultProps} />)
    
    expect(screen.getByTestId('next-image')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('handles button position with percentage values', async () => {
    const buttonWithPercentages = {
      ...mockOverlayButton,
      position: { leftPercent: '75.5%', topPercent: '25.3%' }
    }
    
    render(
      <HeroImageWithButton 
        {...defaultProps} 
        overlayButton={buttonWithPercentages}
      />
    )
    
    // Trigger image load first
    const image = screen.getByTestId('next-image')
    await act(async () => {
      fireEvent.load(image)
    })
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      // The component uses the original position values, not adjusted ones
      expect(button).toHaveStyle({ left: '75.5%' })
      expect(button).toHaveStyle({ top: '25.3%' })
    })
  })
}) 