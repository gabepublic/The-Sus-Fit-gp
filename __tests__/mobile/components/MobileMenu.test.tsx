import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { MobileMenu } from '../../../src/mobile/components/MobileMenu'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, 'aria-current': ariaCurrent }: any) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}))

// Mock react-transition-group
jest.mock('react-transition-group', () => ({
  CSSTransition: ({ children, in: inProp, timeout, classNames, unmountOnExit }: any) =>
    inProp ? children : null,
}))

// Mock focus-trap-react
jest.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: any) => children,
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('MobileMenu', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/m/home')
    // Mock document.body.style
    Object.defineProperty(document.body.style, 'overflow', {
      writable: true,
      value: '',
    })
  })

  afterEach(() => {
    // Clean up any event listeners
    document.removeEventListener('keydown', jest.fn())
  })

  describe('Rendering', () => {
    it('renders nothing when closed', () => {
      render(<MobileMenu {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders the menu when open', () => {
      render(<MobileMenu {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument()
    })

    it('has proper ARIA attributes', () => {
      render(<MobileMenu {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-label', 'Navigation menu')
    })

    it('has proper navigation structure', () => {
      render(<MobileMenu {...defaultProps} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toHaveAttribute('id', 'mobile-menu')
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Mobile navigation')
    })
  })

  describe('Navigation Links', () => {
    it('renders all mobile routes', () => {
      render(<MobileMenu {...defaultProps} />)
      
      expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Upload Your Angle/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Upload Your Fit/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Try It On/ })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Share/ })).toBeInTheDocument()
    })

    it('has correct href attributes', () => {
      render(<MobileMenu {...defaultProps} />)
      
      expect(screen.getByRole('link', { name: /Home/ })).toHaveAttribute('href', '/m/home')
      expect(screen.getByRole('link', { name: /Upload Your Angle/ })).toHaveAttribute('href', '/m/upload-angle')
      expect(screen.getByRole('link', { name: /Upload Your Fit/ })).toHaveAttribute('href', '/m/upload-fit')
      expect(screen.getByRole('link', { name: /Try It On/ })).toHaveAttribute('href', '/m/tryon')
      expect(screen.getByRole('link', { name: /Share/ })).toHaveAttribute('href', '/m/share')
    })

    it('highlights the current route', () => {
      mockUsePathname.mockReturnValue('/m/upload-angle')
      render(<MobileMenu {...defaultProps} />)
      
      const activeLink = screen.getByRole('link', { name: /Upload Your Angle/ })
      expect(activeLink).toHaveAttribute('aria-current', 'page')
      expect(activeLink).toHaveClass('bg-blue-50', 'text-blue-700', 'border-l-4', 'border-blue-700')
    })

    it('does not highlight non-current routes', () => {
      mockUsePathname.mockReturnValue('/m/home')
      render(<MobileMenu {...defaultProps} />)
      
      const nonActiveLink = screen.getByRole('link', { name: /Upload Your Angle/ })
      expect(nonActiveLink).not.toHaveAttribute('aria-current')
      expect(nonActiveLink).toHaveClass('text-gray-700', 'hover:bg-gray-50', 'hover:text-gray-900')
    })

    it('has proper focus styles for all links', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
      })
    })
  })

  describe('Close Button', () => {
    it('renders close button with proper attributes', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: /close navigation menu/i })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveAttribute('data-autofocus')
      expect(closeButton).toHaveAttribute('aria-label', 'Close navigation menu')
    })

    it('calls onClose when close button is clicked', () => {
      const mockClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close navigation menu/i })
      fireEvent.click(closeButton)
      
      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('has proper focus styles for close button', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const closeButton = screen.getByRole('button')
      expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
    })
  })

  describe('Backdrop Interaction', () => {
    it('calls onClose when backdrop is clicked', () => {
      const mockClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      // Click the backdrop (first child of the dialog)
      const backdrop = screen.getByRole('dialog').firstElementChild
      fireEvent.click(backdrop!)
      
      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('backdrop has aria-hidden attribute', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const backdrop = screen.getByRole('dialog').firstElementChild
      expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Keyboard Navigation', () => {
    it('calls onClose when Escape key is pressed', () => {
      const mockClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose for other keys', () => {
      const mockClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })
      
      expect(mockClose).not.toHaveBeenCalled()
    })

    it('only responds to Escape when menu is open', () => {
      const mockClose = jest.fn()
      const { rerender } = render(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      // Close the menu
      rerender(<MobileMenu {...defaultProps} isOpen={false} onClose={mockClose} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('Body Scroll Management', () => {
    it('prevents body scroll when menu is open', () => {
      render(<MobileMenu {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when menu is closed', () => {
      const { rerender } = render(<MobileMenu {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
      
      rerender(<MobileMenu {...defaultProps} isOpen={false} />)
      expect(document.body.style.overflow).toBe('unset')
    })

    it('restores body scroll on unmount', () => {
      const { unmount } = render(<MobileMenu {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')
      
      unmount()
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Route Change Handling', () => {
    it('closes menu when route changes', async () => {
      const mockClose = jest.fn()
      const { rerender } = render(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      // Simulate route change
      mockUsePathname.mockReturnValue('/m/upload-angle')
      rerender(<MobileMenu {...defaultProps} onClose={mockClose} />)
      
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalledTimes(1)
      })
    })

    it('does not close menu if already closed', () => {
      const mockClose = jest.fn()
      const { rerender } = render(<MobileMenu {...defaultProps} isOpen={false} onClose={mockClose} />)
      
      // Simulate route change
      mockUsePathname.mockReturnValue('/m/upload-angle')
      rerender(<MobileMenu {...defaultProps} isOpen={false} onClose={mockClose} />)
      
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  describe('Visual Design', () => {
    it('has proper styling classes', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('fixed', 'inset-0', 'z-200', 'bg-black', 'bg-opacity-50', 'backdrop-blur-sm')
    })

    it('menu panel has correct styling', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const menuPanel = screen.getByRole('navigation')
      expect(menuPanel).toHaveClass(
        'relative', 'ml-auto', 'h-full', 'w-80', 'max-w-sm', 
        'bg-white', 'shadow-xl', 'transform', 'transition-transform'
      )
    })

    it('has proper header styling', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const header = screen.getByText('Navigation')
      expect(header).toHaveClass('text-lg', 'font-semibold', 'text-gray-900')
    })

    it('shows brand footer', () => {
      render(<MobileMenu {...defaultProps} />)
      
      expect(screen.getByText('The Sus Fit Mobile')).toBeInTheDocument()
      expect(screen.getByText('The Sus Fit Mobile')).toHaveClass('text-sm', 'text-gray-500', 'text-center')
    })
  })

  describe('Screen Reader Support', () => {
    it('has proper screen reader text', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const srText = screen.getByText('Close menu')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveClass('sr-only')
    })

    it('has proper role attributes', () => {
      render(<MobileMenu {...defaultProps} />)
      
      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })

    it('icons are hidden from screen readers', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const icons = screen.getAllByText(/[🏠📸👕✨📱]/)
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('has proper responsive classes', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const menuPanel = screen.getByRole('navigation')
      expect(menuPanel).toHaveClass('w-80', 'max-w-sm')
    })

    it('navigation links have proper spacing and sizing', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('flex', 'items-center', 'px-4', 'py-3', 'text-base', 'font-medium')
      })
    })

    it('has scrollable content area', () => {
      render(<MobileMenu {...defaultProps} />)
      
      const contentArea = screen.getByRole('list').parentElement
      expect(contentArea).toHaveClass('flex-1', 'px-4', 'py-6', 'overflow-y-auto')
    })
  })
})