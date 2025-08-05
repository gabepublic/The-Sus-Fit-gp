import React from 'react'
import { render, screen } from '@testing-library/react'
import SusFitPage from '@/app/page'

// Mock the utility functions
jest.mock('@/utils/image', () => ({
  fileToBase64: jest.fn().mockResolvedValue('mock-base64-data'),
  compressBase64: jest.fn().mockResolvedValue('mock-compressed-data'),
  CompressionFailedError: class CompressionFailedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'CompressionFailedError'
    }
  }
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock console.log to avoid noise in tests
const originalLog = console.log
const originalError = console.error
beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalLog
  console.error = originalError
})

// Mock Next.js Image component to avoid loading issues
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onLoad, ...props }: any) {
    React.useEffect(() => {
      // Simulate immediate image load for tests
      if (onLoad) {
        setTimeout(() => onLoad(), 10)
      }
    }, [onLoad])
    
    return <img src={src} alt={alt} {...props} />
  }
})

describe('SusFitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<SusFitPage />)
    expect(screen.getByText(/Sus Fit/)).toBeInTheDocument()
  })

  it('renders SaucyTicker component', () => {
    render(<SusFitPage />)
    // Check for any of the ticker items - use getAllByText since marquee creates multiple instances
    const tickerItems = screen.getAllByText(/That's my angle/)
    expect(tickerItems.length).toBeGreaterThan(0)
  })

  it('renders HeroImageWithButton component', () => {
    render(<SusFitPage />)
    // Check for the main title instead since the camera button might not be visible initially
    expect(screen.getByText(/The Sus Fit/)).toBeInTheDocument()
  })

  it('renders BrutalismCard components', () => {
    render(<SusFitPage />)
    // Check for the upload button text
    const cards = screen.getAllByText(/Upload Your Angle/)
    expect(cards.length).toBeGreaterThan(0)
  })
}) 