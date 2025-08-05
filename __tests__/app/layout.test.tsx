import React from 'react'
import { render } from '@testing-library/react'
import RootLayout from '@/app/layout'

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Montserrat_Alternates: () => ({
    variable: '--font-Montserrat-Alternates-sans',
    style: { fontFamily: 'Montserrat Alternates' }
  }),
  Nabla: () => ({
    variable: '--font-Nabla-sans',
    style: { fontFamily: 'Nabla' }
  }),
  Fascinate: () => ({
    variable: '--font-Fascinate-sans',
    style: { fontFamily: 'Fascinate' }
  })
}))

// Mock next/head for metadata testing
jest.mock('next/head', () => {
  return function Head({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }
})

describe('RootLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )
    
    expect(container).toBeInTheDocument()
  })

  it('renders children correctly', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test child content</div>
      </RootLayout>
    )
    
    expect(getByText('Test child content')).toBeInTheDocument()
  })

  it('exports correct metadata', () => {
    // Import the metadata directly to test it
    const { metadata } = require('@/app/layout')
    
    expect(metadata).toEqual({
      title: "The Sus Fit",
      description: "we be doin' the most - a Those People production"
    })
  })

  it('has correct component structure', () => {
    const { container } = render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )
    
    // Test that the component renders without throwing
    expect(container).toBeInTheDocument()
    
    // Test that children are present
    expect(container.textContent).toContain('Test content')
  })
}) 