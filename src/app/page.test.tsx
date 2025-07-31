import { render } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow()
  })

  it('renders blank canvas', () => {
    const { container } = render(<Home />)
    expect(container.firstChild).toBeNull()
  })


}) 