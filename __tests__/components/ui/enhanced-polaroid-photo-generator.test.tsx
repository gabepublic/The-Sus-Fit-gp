import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { EnhancedPolaroidPhotoGenerator } from '@/components/ui/enhanced-polaroid-photo-generator'

// Mock timers for testing animations
jest.useFakeTimers()

describe('EnhancedPolaroidPhotoGenerator', () => {
  const defaultProps = {
    onGenerationStart: jest.fn(),
    onGenerationComplete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('renders nothing when not generating', () => {
    const { container } = render(<EnhancedPolaroidPhotoGenerator {...defaultProps} />)
    expect(container.firstChild).toBeNull()
  })

  it('starts generation sequence when isGenerating is true', () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    expect(defaultProps.onGenerationStart).toHaveBeenCalled()
  })

  it('shows polaroid when generating', () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    expect(screen.getByText('PROCESSING...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('positions correctly at bottom by default', () => {
    const { container } = render(
      <EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />
    )
    
    const polaroid = container.firstChild as HTMLElement
    expect(polaroid).toHaveClass('bottom-0')
    expect(polaroid).toHaveClass('-translate-x-1/2')
  })

  it('positions correctly at center when specified', () => {
    const { container } = render(
      <EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} position="center" />
    )
    
    const polaroid = container.firstChild as HTMLElement
    expect(polaroid).toHaveClass('top-1/2')
    expect(polaroid).toHaveClass('-translate-y-1/2')
  })

  it('shows progress bar during processing', () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('updates progress during generation', async () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    // Fast-forward timers to see progress updates
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    
    await waitFor(() => {
      const progressText = screen.getByText(/\d+%/)
      expect(progressText).toBeInTheDocument()
    })
  })

  it('completes generation sequence', async () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    // Fast-forward through the entire generation sequence
    act(() => {
      jest.advanceTimersByTime(6000) // Complete all phases
    })
    
    await waitFor(() => {
      expect(defaultProps.onGenerationComplete).toHaveBeenCalled()
      expect(screen.getByText('SUS FIT COMPLETE')).toBeInTheDocument()
    })
  })

  it('shows ready indicator when complete', async () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    act(() => {
      jest.advanceTimersByTime(6000)
    })
    
    await waitFor(() => {
      expect(screen.getByText('✨ READY!')).toBeInTheDocument()
    })
  })

  it('uses person image when provided', async () => {
    const personImageUrl = '/test-person.jpg'
    render(
      <EnhancedPolaroidPhotoGenerator 
        {...defaultProps} 
        isGenerating={true} 
        personImageUrl={personImageUrl}
      />
    )
    
    act(() => {
      jest.advanceTimersByTime(4500) // Advance to revealing phase
    })
    
    await waitFor(() => {
      expect(defaultProps.onGenerationComplete).toHaveBeenCalledWith(personImageUrl)
    })
  })

  it('uses garment image when person image not provided', async () => {
    const garmentImageUrl = '/test-garment.jpg'
    render(
      <EnhancedPolaroidPhotoGenerator 
        {...defaultProps} 
        isGenerating={true} 
        garmentImageUrl={garmentImageUrl}
      />
    )
    
    act(() => {
      jest.advanceTimersByTime(4500)
    })
    
    await waitFor(() => {
      expect(defaultProps.onGenerationComplete).toHaveBeenCalledWith(garmentImageUrl)
    })
  })

  it('uses mock image when no other images provided', async () => {
    const mockImageUrl = '/custom-mock.jpg'
    render(
      <EnhancedPolaroidPhotoGenerator 
        {...defaultProps} 
        isGenerating={true} 
        mockImageUrl={mockImageUrl}
      />
    )
    
    act(() => {
      jest.advanceTimersByTime(4500)
    })
    
    await waitFor(() => {
      expect(defaultProps.onGenerationComplete).toHaveBeenCalledWith(mockImageUrl)
    })
  })

  it('uses default mock image when no images provided', async () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    act(() => {
      jest.advanceTimersByTime(4500)
    })
    
    await waitFor(() => {
      expect(defaultProps.onGenerationComplete).toHaveBeenCalledWith('/images/ScoredGarment.jpg')
    })
  })

  it('shows correct status text during different phases', () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    // Initial processing phase
    expect(screen.getByText('PROCESSING...')).toBeInTheDocument()
    
    // Advance to revealing phase
    act(() => {
      jest.advanceTimersByTime(4500)
    })
    
    // Should show developing
    expect(screen.getByText('DEVELOPING...')).toBeInTheDocument()
    
    // Advance to complete phase
    act(() => {
      jest.advanceTimersByTime(1500)
    })
    
    // Should show complete
    expect(screen.getByText('SUS FIT COMPLETE')).toBeInTheDocument()
  })

  it('shows SUS FIT logo', () => {
    render(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    expect(screen.getByText('SUS FIT')).toBeInTheDocument()
  })

  it('works without optional callbacks', () => {
    render(<EnhancedPolaroidPhotoGenerator isGenerating={true} />)
    
    // Should not throw error
    expect(screen.getByText('PROCESSING...')).toBeInTheDocument()
  })

  it('resets state when isGenerating changes from true to false', () => {
    const { rerender } = render(
      <EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />
    )
    
    expect(screen.getByText('PROCESSING...')).toBeInTheDocument()
    
    // Change to false
    rerender(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={false} />)
    
    // Should not render anything
    expect(screen.queryByText('PROCESSING...')).not.toBeInTheDocument()
  })

  it('handles multiple generation cycles', async () => {
    const { rerender } = render(
      <EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />
    )
    
    // Complete first generation
    act(() => {
      jest.advanceTimersByTime(6000)
    })
    
    await waitFor(() => {
      expect(defaultProps.onGenerationComplete).toHaveBeenCalledTimes(1)
    })
    
    // Reset and start second generation
    rerender(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={false} />)
    rerender(<EnhancedPolaroidPhotoGenerator {...defaultProps} isGenerating={true} />)
    
    expect(defaultProps.onGenerationStart).toHaveBeenCalledTimes(2)
  })
}) 