import { render } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow()
  })

  it('renders main container with Selfie component', () => {
    const { container } = render(<Home />)
    const mainElement = container.querySelector('main')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'w-full', 'h-full', 'gap-4')
  })
}) 