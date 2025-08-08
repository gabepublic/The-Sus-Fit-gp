import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, className, onLoad, onError, fill, unoptimized, ...props }: any) => (
        <img 
            src={src} 
            alt={alt} 
            className={className} 
            onLoad={onLoad}
            onError={onError}
            {...props}
        />
    )
}))

// Mock the Button component
jest.mock('../src/components/ui/button', () => ({
    Button: ({ children, onClick, className, ...props }: any) => (
        <button onClick={onClick} className={className} {...props}>
            {children}
        </button>
    )
}))

// Mock console methods
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'error').mockImplementation(() => {})
jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('Single Component Test', () => {
    it('should import and render PolaroidPhotoGenerator', () => {
        // Dynamic import to avoid issues
        const { PolaroidPhotoGenerator } = require('../src/components/ui/polaroid-photo-generator')
        
        render(<PolaroidPhotoGenerator />)
        
        // Should render the component
        expect(screen.getByTestId('polaroid-generator')).toBeInTheDocument()
    })
})
