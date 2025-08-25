import { render, screen, fireEvent } from '@testing-library/react'
import MobileLayout from '../../src/app/(mobile)/m/layout'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/m/home'),
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, 'aria-current': ariaCurrent, 'aria-label': ariaLabel }: any) => (
    <a href={href} className={className} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, priority, className }: any) => (
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

// Mock react-transition-group
jest.mock('react-transition-group', () => ({
  CSSTransition: ({ children, in: inProp }: any) => inProp ? children : null,
}))

// Mock focus-trap-react
jest.mock('focus-trap-react', () => ({
  FocusTrap: ({ children }: any) => children,
}))

describe('MobileLayout', () => {
  beforeEach(() => {
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

  describe('Layout Structure', () => {
    it('renders the mobile layout container', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const layout = document.querySelector('.mobile-layout')
      expect(layout).toBeInTheDocument()
      expect(layout).toHaveClass('min-h-screen', 'bg-gradient-to-b', 'from-pink-50', 'to-yellow-50')
    })

    it('renders children in the main content area', () => {
      render(
        <MobileLayout>
          <div data-testid="test-content">Test Content</div>
        </MobileLayout>
      )
      
      const content = screen.getByTestId('test-content')
      expect(content).toBeInTheDocument()
      
      const main = content.closest('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveClass('mobile-main', 'pt-16')
    })

    it('has proper spacing for fixed header', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const main = screen.getByRole('main')
      expect(main).toHaveClass('pt-16') // Space for fixed header
    })
  })

  describe('MobileHeader Integration', () => {
    it('renders the mobile header', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('header has logo link', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const logoLink = screen.getByRole('link', { name: /the sus fit - home/i })
      expect(logoLink).toBeInTheDocument()
      expect(logoLink).toHaveAttribute('href', '/m/home')
    })

    it('header has hamburger menu button', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('Menu State Management', () => {
    it('menu is initially closed', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu')
      
      // Menu should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('clicking hamburger button opens menu', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      // Button state should update
      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
      expect(menuButton).toHaveAttribute('aria-label', 'Close navigation menu')
      
      // Menu should be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('Navigation menu')).toBeInTheDocument()
    })

    it('clicking hamburger button again closes menu', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      
      // Open menu
      fireEvent.click(menuButton)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      // Close menu
      fireEvent.click(menuButton)
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('menu has close button with autofocus when open', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
      fireEvent.click(menuButton)
      
      // Check that there's a close button with data-autofocus
      const closeButtons = screen.getAllByRole('button', { name: /close navigation menu/i })
      const autofocusButton = closeButtons.find(button => button.hasAttribute('data-autofocus'))
      expect(autofocusButton).toBeInTheDocument()
    })

    it('escape key closes the menu', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('backdrop click closes the menu', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      const backdrop = screen.getByRole('dialog').firstElementChild
      fireEvent.click(backdrop!)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Navigation Menu Integration', () => {
    it('renders all navigation links when menu is open', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      // Use getAllByRole to get all links, then filter for menu links
      const allLinks = screen.getAllByRole('link')
      const menuLinks = allLinks.filter(link => link.closest('#mobile-menu'))
      
      expect(menuLinks.length).toBe(5)
      expect(screen.getByRole('link', { name: /upload your angle/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /upload your fit/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /try it on/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /share/i })).toBeInTheDocument()
    })

    it('navigation links have correct hrefs', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      // Get menu-specific links by their unique text content
      const allLinks = screen.getAllByRole('link')
      const homeMenuLink = allLinks.find(link => link.textContent?.includes('Home') && link.closest('#mobile-menu'))
      const uploadAngleLink = screen.getByRole('link', { name: /upload your angle/i })
      const uploadFitLink = screen.getByRole('link', { name: /upload your fit/i })
      const tryItOnLink = screen.getByRole('link', { name: /try it on/i })
      const shareLink = screen.getByRole('link', { name: /share/i })
      
      expect(homeMenuLink).toHaveAttribute('href', '/m/home')
      expect(uploadAngleLink).toHaveAttribute('href', '/m/upload-angle')
      expect(uploadFitLink).toHaveAttribute('href', '/m/upload-fit')
      expect(tryItOnLink).toHaveAttribute('href', '/m/tryon')
      expect(shareLink).toHaveAttribute('href', '/m/share')
    })

    it('shows current route highlighting', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      // Find the home link in the menu (has aria-current="page")
      const allLinks = screen.getAllByRole('link')
      const activeLink = allLinks.find(link => link.getAttribute('aria-current') === 'page' && link.closest('#mobile-menu'))
      
      expect(activeLink).toHaveAttribute('aria-current', 'page')
      expect(activeLink).toHaveClass('bg-blue-50', 'text-blue-700')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      // Header accessibility
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
      
      // Main content accessibility
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      
      // Button accessibility
      const menuButton = screen.getByRole('button')
      expect(menuButton).toHaveAttribute('aria-expanded')
      expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu')
      expect(menuButton).toHaveAttribute('aria-label')
    })

    it('menu has proper dialog semantics when open', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-label', 'Navigation menu')
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('id', 'mobile-menu')
      expect(nav).toHaveAttribute('aria-label', 'Mobile navigation')
    })

    it('manages focus properly', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      // Check that there's a button with data-autofocus in the menu panel
      const buttons = screen.getAllByRole('button', { name: /close navigation menu/i })
      const menuCloseButton = buttons.find(btn => btn.hasAttribute('data-autofocus'))
      
      expect(menuCloseButton).toBeInTheDocument()
      expect(menuCloseButton).toHaveAttribute('data-autofocus')
    })
  })

  describe('Responsive Design', () => {
    it('has mobile-optimized styling classes', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const layout = document.querySelector('.mobile-layout')
      expect(layout).toHaveClass('min-h-screen')
      
      const main = screen.getByRole('main')
      expect(main).toHaveClass('mobile-main', 'pt-16')
    })

    it('has proper background styling for mobile', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const layout = document.querySelector('.mobile-layout')
      expect(layout).toHaveClass('bg-gradient-to-b', 'from-pink-50', 'to-yellow-50')
    })

    it('header is properly positioned', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50')
    })
  })

  describe('Body Scroll Management', () => {
    it('prevents body scroll when menu is open', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      fireEvent.click(menuButton)
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when menu is closed', () => {
      render(
        <MobileLayout>
          <div>Test Content</div>
        </MobileLayout>
      )
      
      const menuButton = screen.getByRole('button')
      
      // Open menu
      fireEvent.click(menuButton)
      expect(document.body.style.overflow).toBe('hidden')
      
      // Close menu
      fireEvent.click(menuButton)
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Multiple Children Support', () => {
    it('renders multiple children correctly', () => {
      render(
        <MobileLayout>
          <div data-testid="child-1">First Child</div>
          <div data-testid="child-2">Second Child</div>
          <p data-testid="child-3">Third Child</p>
        </MobileLayout>
      )
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('preserves child component structure', () => {
      const CustomComponent = () => <div data-testid="custom">Custom Component</div>
      
      render(
        <MobileLayout>
          <CustomComponent />
        </MobileLayout>
      )
      
      expect(screen.getByTestId('custom')).toBeInTheDocument()
    })
  })
})