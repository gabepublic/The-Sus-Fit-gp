import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

describe('Simple Test', () => {
    it('should work', () => {
        expect(true).toBe(true)
    })

    it('should render a simple div', () => {
        render(<div data-testid="test-div">Hello World</div>)
        expect(screen.getByTestId('test-div')).toBeInTheDocument()
    })
})
