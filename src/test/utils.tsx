import React from 'react'
import { render, RenderOptions, screen } from '@testing-library/react'
import { ToastProvider } from '@/components/ToastProvider'

// Create a custom render function that includes providers if needed
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <ToastProvider>
        {children}
      </ToastProvider>
    )
  }

  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { customRender as render };
export { screen };


