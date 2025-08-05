import React from 'react'
import { render, screen } from '@/test/utils'

// Test component
const TestComponent = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="test-component">{children}</div>
)

describe('test/utils', () => {
  it('custom render function works correctly', () => {
    render(<TestComponent>Test content</TestComponent>)
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('screen is properly exported', () => {
    render(<TestComponent>Screen test</TestComponent>)
    
    expect(screen.getByText('Screen test')).toBeInTheDocument()
  })

  it('render accepts options parameter', () => {
    const { container } = render(
      <TestComponent>Options test</TestComponent>
    )
    
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Options test')).toBeInTheDocument()
  })

  it('works with complex components', () => {
    const ComplexComponent = () => (
      <div>
        <h1>Title</h1>
        <p>Description</p>
        <button>Click me</button>
      </div>
    )
    
    render(<ComplexComponent />)
    
    expect(screen.getByRole('heading')).toHaveTextContent('Title')
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('maintains React Testing Library functionality', () => {
    render(<TestComponent>RTL test</TestComponent>)
    
    // Test that all RTL queries work
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
    expect(screen.getByText('RTL test')).toBeInTheDocument()
    expect(screen.queryByText('Non-existent')).not.toBeInTheDocument()
  })
}) 