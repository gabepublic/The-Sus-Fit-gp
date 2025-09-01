import { render, screen, fireEvent } from '@testing-library/react'
import { MobileHeader } from '../../../src/mobile/components/MobileHeader'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    priority,
    className,
  }: {
    src: string
    alt: string
    width: number
    height: number
    priority?: boolean
    className?: string
  }) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-priority={priority}
    />
  ),
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, 'aria-label': ariaLabel }: any) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

describe('MobileHeader', () => {
  const defaultProps = {
    isMenuOpen: false,
    onMenuToggle: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the header element', () => {
      render(<MobileHeader {...defaultProps} />)
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('mobile-header')
    })

    it('renders with transparent background', () => {
      render(<MobileHeader {...defaultProps} />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-transparent')
    })

    it('is positioned fixed at top', () => {
      render(<MobileHeader {...defaultProps} />)
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })
  })

  describe('Logo', () => {
    it('renders the logo link', () => {
      render(<MobileHeader {...defaultProps} />)
      const logoLink = screen.getByRole('link', { name: /the sus fit - home/i })
      expect(logoLink).toBeInTheDocument()
      expect(logoLink).toHaveAttribute('href', '/m/home')
    })

    it('renders the logo text with correct attributes', () => {
      render(<MobileHeader {...defaultProps} />)
      const logoText = screen.getByRole('heading', { name: /the sus fit/i })
      expect(logoText).toBeInTheDocument()
      expect(logoText).toHaveClass('font-bold', 'leading-tight', 'susfit-logo-font', 'mobile-title')
      expect(logoText).toHaveTextContent('The Sus Fit')
    })

    it('has proper focus styles for logo link', () => {
      render(<MobileHeader {...defaultProps} />)
      const logoLink = screen.getByRole('link', { name: /the sus fit - home/i })
      expect(logoLink).toHaveClass('focus:outline-none')
    })
  })

  describe('Hamburger Menu Button', () => {
    it('renders the menu button', () => {
      render(<MobileHeader {...defaultProps} />)
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('has correct ARIA attributes when menu is closed', () => {
      render(<MobileHeader {...defaultProps} />)
      const menuButton = screen.getByRole('button')
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu')
    })

    it('has correct ARIA attributes when menu is open', () => {
      render(<MobileHeader {...defaultProps} isMenuOpen={true} />)
      const menuButton = screen.getByRole('button')
      
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
      expect(menuButton).toHaveAttribute('aria-label', 'Close navigation menu')
    })

    it('calls onMenuToggle when clicked', () => {
      const mockToggle = jest.fn()
      render(<MobileHeader {...defaultProps} onMenuToggle={mockToggle} />)
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      expect(mockToggle).toHaveBeenCalledTimes(1)
    })

    it('has proper focus styles', () => {
      render(<MobileHeader {...defaultProps} />)
      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveClass('focus:outline-none')
    })
  })

  describe('Hamburger Icon Animation', () => {
    it('shows hamburger icon when menu is closed', () => {
      render(<MobileHeader {...defaultProps} isMenuOpen={false} />)
      const menuButton = screen.getByRole('button')
      
      // Check that hamburger lines have closed state classes
      const lines = menuButton.querySelectorAll('span:not(.sr-only)')
      expect(lines[0]).toHaveClass('translate-y-1.5')
      expect(lines[1]).toHaveClass('opacity-100', 'translate-y-3')
      expect(lines[2]).toHaveClass('translate-y-4.5')
    })

    it('shows X icon when menu is open', () => {
      render(<MobileHeader {...defaultProps} isMenuOpen={true} />)
      const menuButton = screen.getByRole('button')
      
      // Check that hamburger lines have open state classes (X formation)
      const lines = menuButton.querySelectorAll('span:not(.sr-only)')
      expect(lines[0]).toHaveClass('rotate-45', 'translate-y-3')
      expect(lines[1]).toHaveClass('opacity-0', 'translate-y-3')
      expect(lines[2]).toHaveClass('-rotate-45', 'translate-y-3')
    })

    it('applies transition classes to all lines', () => {
      render(<MobileHeader {...defaultProps} />)
      const menuButton = screen.getByRole('button')
      
      const lines = menuButton.querySelectorAll('span:not(.sr-only)')
      lines.forEach(line => {
        expect(line).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
      })
    })
  })

  describe('Screen Reader Support', () => {
    it('includes screen reader only text for menu state', () => {
      render(<MobileHeader {...defaultProps} />)
      const srText = screen.getByText('Open menu')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })

    it('updates screen reader text when menu is open', () => {
      render(<MobileHeader {...defaultProps} isMenuOpen={true} />)
      const srText = screen.getByText('Close menu')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('Responsive Design', () => {
    it('has proper mobile-first responsive classes', () => {
      render(<MobileHeader {...defaultProps} />)
      const container = screen.getByRole('banner').firstElementChild
      
      expect(container).toHaveClass('flex', 'items-center', 'justify-between')
      expect(container).toHaveClass('px-4', 'py-3', 'h-16') // Mobile padding and height
    })

    it('logo text has proper styling', () => {
      render(<MobileHeader {...defaultProps} />)
      const logoText = screen.getByRole('heading', { name: /the sus fit/i })
      expect(logoText).toHaveClass('font-bold', 'leading-tight', 'susfit-logo-font', 'mobile-title')
    })

    it('hamburger button has appropriate touch target size', () => {
      render(<MobileHeader {...defaultProps} />)
      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveClass('w-10', 'h-10') // 40px minimum touch target
    })
  })

  describe('Color Scheme', () => {
    it('uses custom colors for hamburger menu matching design', () => {
      render(<MobileHeader {...defaultProps} />)
      const menuButton = screen.getByRole('button')
      
      const lines = menuButton.querySelectorAll('span:not(.sr-only)')
      lines.forEach(line => {
        expect(line).toHaveStyle('background-color: rgb(25, 137, 169)')
      })
    })

    it('has proper focus outline styles', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const logoLink = screen.getByRole('link')
      const menuButton = screen.getByRole('button')
      
      expect(logoLink).toHaveClass('focus:outline-none')
      expect(menuButton).toHaveClass('focus:outline-none')
    })
  })
})