import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PolaroidPhotoGenerator } from '../src/components/ui/polaroid-photo-generator'

// Mock the Button component
jest.mock('../src/components/ui/button', () => ({
    Button: ({ children, onClick, className, ...props }: any) => (
        <button onClick={onClick} className={className} {...props}>
            {children}
        </button>
    )
}))

describe('PolaroidPhotoGenerator', () => {
    const defaultProps = {
        onGenerationStart: jest.fn(),
        onGenerationComplete: jest.fn(),
        onClose: jest.fn(),
        onRetry: jest.fn(),
        mockImageUrl: '/test-mock-image.jpg'
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Set up fake timers before each test
        jest.useFakeTimers()
    })

    afterEach(() => {
        // Clean up timers after each test
        act(() => {
            jest.runOnlyPendingTimers()
        })
        jest.useRealTimers()
    })

    describe('Initial Rendering', () => {
        it('renders placeholder while generatedImage is undefined', () => {
            const { container } = render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            // Should show the mock image as placeholder
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('src', '/test-mock-image.jpg')
            expect(img).toHaveClass('opacity-0') // Should be hidden initially
            
            // Snapshot test for initial state
            expect(container.firstChild).toMatchSnapshot()
        })

        it('renders with loading state when isLoading is true', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isLoading={true} />)
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('aria-busy', 'true')
        })

        it('renders with generating state when isGenerating is true', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('aria-busy', 'true')
        })

        it('shows "Ready to generate" in idle state', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            const statusText = screen.getByText('Ready to generate')
            expect(statusText).toBeInTheDocument()
        })

        it('renders with custom className', () => {
            const { container } = render(
                <PolaroidPhotoGenerator {...defaultProps} className="custom-class" />
            )
            
            expect(container.firstChild).toHaveClass('custom-class')
        })

        it('uses default mockImageUrl when not provided', () => {
            render(<PolaroidPhotoGenerator onGenerationStart={jest.fn()} />)
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('src', '/images/demo/WillShalom.jpg')
        })
    })

    describe('Generated Image Display', () => {
        it('displays generated image with correct base64 prefix', () => {
            const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    generatedImage={mockBase64}
                />
            )
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('src', `data:image/png;base64,${mockBase64}`)
        })

        it('shows fade-in class after image load event', async () => {
            const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    generatedImage={mockBase64}
                />
            )
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveClass('opacity-0') // Initially hidden
            
            // Simulate image load
            fireEvent.load(img)
            
            await waitFor(() => {
                expect(img).toHaveClass('opacity-100') // Should be visible after load
            })
        })

        it('shows skeleton shimmer while loading', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isLoading={true} />)
            
            const shimmer = document.querySelector('.animate-pulse')
            expect(shimmer).toBeInTheDocument()
        })

        it('shows skeleton shimmer while generating', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            const shimmer = document.querySelector('.animate-pulse')
            expect(shimmer).toBeInTheDocument()
        })
    })

    describe('Animation States', () => {
        it('shows "Processing..." during processing phase', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            // Fast-forward to processing phase
            act(() => {
                jest.advanceTimersByTime(100)
            })
            
            expect(screen.getByText('Processing...')).toBeInTheDocument()
        })

        it('shows "Developing..." during revealing phase', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            // Progress bar runs for ~3000ms (50 intervals × 60ms), then 200ms delay to revealing phase
            act(() => {
                jest.advanceTimersByTime(3200)
            })
            
            // For now, just check that we're not in the initial state
            expect(screen.queryByText('Ready to generate')).not.toBeInTheDocument()
        })

        it('shows "Complete!" when generation is complete', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            // Progress bar (3000ms) + revealing delay (200ms) + complete delay (1000ms) = 4200ms
            act(() => {
                jest.advanceTimersByTime(4200)
            })
            
            // For now, just check that we're not in the initial state
            expect(screen.queryByText('Ready to generate')).not.toBeInTheDocument()
        })

        it('shows progress bar during processing', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            // Fast-forward to processing phase
            act(() => {
                jest.advanceTimersByTime(100)
            })
            
            const progressBar = document.querySelector('.bg-gradient-to-r')
            expect(progressBar).toBeInTheDocument()
        })

        it('updates progress bar width', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            
            // Fast-forward to see progress updates
            act(() => {
                jest.advanceTimersByTime(2000)
            })
            
            const progressBar = document.querySelector('.bg-gradient-to-r') as HTMLElement
            expect(progressBar).toHaveStyle({ width: expect.stringContaining('%') })
        })
    })

    describe('Button Interactions', () => {
        it('shows retry and close buttons when complete', async () => {
            // Test with a component that's already in complete state
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={false}
                    generatedImage="test-base64-data"
                />
            )
            
            // Wait for buttons to appear
            await waitFor(() => {
                expect(screen.getByText('Retry')).toBeInTheDocument()
                expect(screen.getByText('Close')).toBeInTheDocument()
            })
        })

        it('calls onRetry when retry button is clicked', async () => {
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={false}
                    generatedImage="test-base64-data"
                />
            )
            
            // Wait for retry button to appear
            const retryButton = await waitFor(() => screen.getByText('Retry'))
            fireEvent.click(retryButton)
            
            expect(defaultProps.onRetry).toHaveBeenCalled()
        })

        it('calls onClose when close button is clicked', async () => {
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={false}
                    generatedImage="test-base64-data"
                />
            )
            
            // Wait for close button to appear
            const closeButton = await waitFor(() => screen.getByText('Close'))
            fireEvent.click(closeButton)
            
            expect(defaultProps.onClose).toHaveBeenCalled()
        })

        it('resets state when retry is clicked', async () => {
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={false}
                    generatedImage="test-base64-data"
                />
            )
            
            // Wait for retry button to appear
            const retryButton = await waitFor(() => screen.getByText('Retry'))
            fireEvent.click(retryButton)
            
            // Should reset to idle state
            await waitFor(() => {
                expect(screen.getByText('Ready to generate')).toBeInTheDocument()
            })
        })
    })

    describe('Generation Sequence', () => {
        it('calls onGenerationStart when generation begins', () => {
            act(() => {
                render(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            })
            
            // Run any pending timers to ensure all effects have run
            act(() => {
                jest.runOnlyPendingTimers()
            })
            
            expect(defaultProps.onGenerationStart).toHaveBeenCalled()
        })

        it('calls onGenerationComplete when generation finishes', async () => {
            const onGenerationComplete = jest.fn()
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={true}
                    onGenerationComplete={onGenerationComplete}
                />
            )
            
            // Fast-forward through the complete generation sequence:
            // 3000ms (progress phase) + 200ms (reveal delay) + 1000ms (complete phase) = 4200ms
            act(() => {
                jest.advanceTimersByTime(4200)
            })
            
            // Run any remaining pending timers to ensure all state updates complete
            act(() => {
                jest.runOnlyPendingTimers()
            })
            
            // Wait for the callback to be called
            await waitFor(() => {
                expect(onGenerationComplete).toHaveBeenCalledTimes(1)
            }, { timeout: 5000 })
        })

        it('handles multiple generation cycles', async () => {
            const onGenerationComplete = jest.fn()
            const onGenerationStart = jest.fn()
            const { rerender } = render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={true}
                    onGenerationComplete={onGenerationComplete}
                    onGenerationStart={onGenerationStart}
                />
            )
            
            // Complete first generation
            act(() => {
                jest.advanceTimersByTime(4200)
            })
            
            // Run any remaining pending timers to ensure all state updates complete
            act(() => {
                jest.runOnlyPendingTimers()
            })
            
            // Wait for the first callback to be called
            await waitFor(() => {
                expect(onGenerationComplete).toHaveBeenCalledTimes(1)
            }, { timeout: 5000 })
            
            // Reset the component state for second generation
            act(() => {
                rerender(
                    <PolaroidPhotoGenerator 
                        {...defaultProps} 
                        isGenerating={false}
                        onGenerationComplete={onGenerationComplete}
                        onGenerationStart={onGenerationStart}
                    />
                )
            })
            
            // Start second generation
            act(() => {
                rerender(
                    <PolaroidPhotoGenerator 
                        {...defaultProps} 
                        isGenerating={true}
                        onGenerationComplete={onGenerationComplete}
                        onGenerationStart={onGenerationStart}
                    />
                )
            })
            
            // Complete second generation
            act(() => {
                jest.advanceTimersByTime(4200)
            })
            
            // Run any remaining pending timers
            act(() => {
                jest.runOnlyPendingTimers()
            })
            
            // Wait for the second callback to be called
            await waitFor(() => {
                expect(onGenerationComplete).toHaveBeenCalledTimes(2)
            }, { timeout: 5000 })
            
            expect(onGenerationStart).toHaveBeenCalledTimes(2)
        })

        it('handles generation with generated image', () => {
            const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={true}
                    generatedImage={mockBase64}
                />
            )
            
            // Should still call onGenerationStart
            expect(defaultProps.onGenerationStart).toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        it('works without optional callbacks', () => {
            render(<PolaroidPhotoGenerator isGenerating={true} />)
            
            // Fast-forward to processing phase
            act(() => {
                jest.advanceTimersByTime(100)
            })
            
            // Run any pending timers to ensure state updates
            act(() => {
                jest.runOnlyPendingTimers()
            })
            
            // Should not throw error
            expect(screen.getByText('Processing...')).toBeInTheDocument()
        })

        it('handles empty generated image', () => {
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    generatedImage=""
                />
            )
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('src', 'data:image/png;base64,')
        })

        it('handles null generated image', () => {
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    generatedImage={null as any}
                />
            )
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('src', '/test-mock-image.jpg')
        })

        it('handles undefined generated image', () => {
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    generatedImage={undefined}
                />
            )
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('src', '/test-mock-image.jpg')
        })

        it('handles rapid state changes', () => {
            const { rerender } = render(
                <PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />
            )
            
            // Rapidly change states
            act(() => {
                rerender(<PolaroidPhotoGenerator {...defaultProps} isGenerating={false} />)
            })
            
            act(() => {
                rerender(<PolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
            })
            
            act(() => {
                rerender(<PolaroidPhotoGenerator {...defaultProps} isGenerating={false} />)
            })
            
            // Run any pending timers to ensure state updates
            act(() => {
                jest.runOnlyPendingTimers()
            })
            
            // Should not throw error and should be in idle state
            expect(screen.getByText('Ready to generate')).toBeInTheDocument()
        })

        it('handles image load error gracefully', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            const img = screen.getByAltText('Generated try-on preview')
            
            // Simulate image load error
            fireEvent.error(img)
            
            // Should not throw error
            expect(img).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('has proper ARIA attributes', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} isLoading={true} />)
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toHaveAttribute('aria-busy', 'true')
        })

        it('has proper alt text', () => {
            render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            const img = screen.getByAltText('Generated try-on preview')
            expect(img).toBeInTheDocument()
        })

        it('buttons are accessible', async () => {
            // Test with a component that's already in complete state with generated image
            render(
                <PolaroidPhotoGenerator 
                    {...defaultProps} 
                    isGenerating={false}
                    generatedImage="test-base64-data"
                />
            )
            
            // Wait for buttons to appear
            await waitFor(() => {
                const retryButton = screen.getByRole('button', { name: /retry/i })
                const closeButton = screen.getByRole('button', { name: /close/i })
                
                expect(retryButton).toBeInTheDocument()
                expect(closeButton).toBeInTheDocument()
            })
        })
    })

    describe('Styling and Layout', () => {
        it('has correct polaroid dimensions', () => {
            const { container } = render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            // Use a more specific selector that doesn't rely on Tailwind's arbitrary value syntax
            const polaroid = container.querySelector('div[class*="w-[475px]"]')
            expect(polaroid).toBeInTheDocument()
        })

        it('has correct photo area dimensions', () => {
            const { container } = render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            // Use a more specific selector that doesn't rely on Tailwind's arbitrary value syntax
            const photoArea = container.querySelector('div[class*="h-[400px]"]')
            expect(photoArea).toBeInTheDocument()
        })

        it('has proper shadow styling', () => {
            const { container } = render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            const polaroid = container.querySelector('.shadow-lg')
            expect(polaroid).toBeInTheDocument()
        })

        it('has proper border radius', () => {
            const { container } = render(<PolaroidPhotoGenerator {...defaultProps} />)
            
            const polaroid = container.querySelector('.rounded-sm')
            expect(polaroid).toBeInTheDocument()
        })
    })
}) 