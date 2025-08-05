"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"

interface PolaroidPhotoGeneratorProps {
    className?: string
    onGenerationStart?: () => void
    onGenerationComplete?: (imageUrl: string) => void
    onClose?: () => void
    onRetry?: () => void
    isGenerating?: boolean
    mockImageUrl?: string
    generatedImage?: string     // base-64 PNG returned from backend
    isLoading?: boolean         // when backend call is in flight
}

export function PolaroidPhotoGenerator({
                                           className,
                                           onGenerationStart,
                                           onGenerationComplete,
                                           onClose,
                                           onRetry,
                                           isGenerating = false,
                                           mockImageUrl = "/images/demo/WillShalom.jpg",
                                           generatedImage,
                                           isLoading = false
                                       }: PolaroidPhotoGeneratorProps) {
    const [progress, setProgress] = useState(0)
    const [photoVisible, setPhotoVisible] = useState(false)
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'processing' | 'revealing' | 'complete'>('idle')
    const [showButtons, setShowButtons] = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)
    const animationTimersRef = useRef<(NodeJS.Timeout | number)[]>([])
    const hasCompletedRef = useRef(false) // Track if completion callback has been called

    // Use refs to avoid dependency issues with callbacks
    const onGenerationStartRef = useRef(onGenerationStart)
    const onGenerationCompleteRef = useRef(onGenerationComplete)
    const currentPhaseRef = useRef(animationPhase)

    // Update refs when callbacks change
    useEffect(() => {
        onGenerationStartRef.current = onGenerationStart
        onGenerationCompleteRef.current = onGenerationComplete
    }, [onGenerationStart, onGenerationComplete])

    // Update phase ref when animationPhase changes
    useEffect(() => {
        currentPhaseRef.current = animationPhase
    }, [animationPhase])

    // Use generatedImage prop if provided, otherwise fall back to mockImageUrl
    const imageToDisplay = generatedImage != null ? generatedImage : mockImageUrl

    const startGenerationSequence = useCallback(() => {
        // Clear any existing timers
        animationTimersRef.current.forEach(timer => {
            if (typeof timer === 'number') {
                clearTimeout(timer)
                clearInterval(timer)
            } else {
                clearTimeout(timer)
            }
        })
        animationTimersRef.current = []
        
        // Reset completion flag
        hasCompletedRef.current = false
        
        setAnimationPhase('processing')
        setProgress(0)
        setPhotoVisible(false)
        setShowButtons(false)
        setImgLoaded(false)

        const timers: (NodeJS.Timeout | number)[] = []

        // Phase 1: Progress bar animation (0-3 seconds)
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval)
                    // Start Phase 2: Photo revelation
                    const revealTimer = setTimeout(() => {
                        setAnimationPhase('revealing')
                        setPhotoVisible(true)

                        // Phase 3: Complete after slide animation
                        const completeTimer = setTimeout(() => {
                            setAnimationPhase('complete')
                            setShowButtons(true) // Show buttons with animation
                            
                            // Only call onGenerationComplete once
                            if (onGenerationCompleteRef.current && !hasCompletedRef.current) {
                                hasCompletedRef.current = true
                                // Call with the full data URL format
                                const fullImageUrl = generatedImage != null ? `data:image/png;base64,${generatedImage}` : imageToDisplay
                                onGenerationCompleteRef.current(fullImageUrl)
                            }
                        }, 1000) // Reduced time for testing
                        timers.push(completeTimer)
                    }, 200)
                    timers.push(revealTimer)
                    return 100
                }
                return prev + 2
            })
        }, 60) // 60ms intervals for smooth animation (3 seconds total)
        
        timers.push(progressInterval)
        animationTimersRef.current = timers
    }, [generatedImage, imageToDisplay])

    const resetPolaroid = useCallback(() => {
        // Clear any existing timers
        animationTimersRef.current.forEach(timer => {
            if (typeof timer === 'number') {
                clearTimeout(timer)
                clearInterval(timer)
            } else {
                clearTimeout(timer)
            }
        })
        animationTimersRef.current = []
        
        // Reset completion flag
        hasCompletedRef.current = false
        
        setAnimationPhase('idle')
        setProgress(0)
        setPhotoVisible(false)
        setShowButtons(false)
        setImgLoaded(false)
    }, [])

    // Handle generation state changes
    useEffect(() => {
        // Prioritize isGenerating over isLoading when both are provided
        const shouldStartGeneration = isGenerating || (isLoading !== undefined && isLoading)
        
        if (shouldStartGeneration) {
            // Call onGenerationStart immediately when generation begins
            if (onGenerationStartRef.current && currentPhaseRef.current === 'idle') {
                onGenerationStartRef.current()
            }
            
            // Only start the sequence if we're in idle state
            if (currentPhaseRef.current === 'idle') {
                startGenerationSequence()
            }
        } else {
            // Reset when generation stops
            resetPolaroid()
        }
    }, [isLoading, isGenerating, startGenerationSequence, resetPolaroid])

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            animationTimersRef.current.forEach(timer => {
                if (typeof timer === 'number') {
                    clearTimeout(timer)
                    clearInterval(timer)
                } else {
                    clearTimeout(timer)
                }
            })
        }
    }, [])

    const handleRetry = () => {
        resetPolaroid()
        if (onRetry) {
            onRetry()
        }
    }

    const handleImageLoad = () => {
        setImgLoaded(true)
    }

    return (
        <div className={cn("relative flex flex-col items-center", className)}>
            {/* MUCH LARGER POLAROID - Nearly as wide as camera, longer than wide */}
            <div className="relative bg-white p-6 w-[475px] h-[550px] flex flex-col shadow-lg rounded-sm">

                {/* Large Square Photo Area - Authentic Polaroid style */}
                <div className="relative w-full h-[400px] overflow-hidden rounded-sm bg-gray-100">

                    {/* Gray Placeholder with Opacity */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-gray-400/80 transition-opacity duration-1000 z-10",
                            photoVisible ? "opacity-0" : "opacity-100"
                        )}
                    />

                    {/* Dynamic Image - Square format */}
                    <div
                        className={cn(
                            "absolute inset-0 transition-all duration-1500 ease-out will-change-transform",
                            photoVisible
                                ? "transform translate-y-0 opacity-100"
                                : "transform -translate-y-full opacity-0"
                        )}
                    >
                        {/* Skeleton shimmer background while loading */}
                        {!imgLoaded && (isLoading || isGenerating) && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-sm" />
                        )}
                        
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={generatedImage != null ? `data:image/png;base64,${generatedImage}` : mockImageUrl}
                            alt="Generated try-on preview"
                            className={cn(
                                "w-full h-full object-cover select-none rounded-sm transition-opacity duration-500",
                                imgLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={handleImageLoad}
                            aria-busy={!imgLoaded && (isLoading || isGenerating)}
                        />
                    </div>
                </div>

                {/* Larger Polaroid White Bottom Border */}
                <div className="h-[70px] bg-white flex items-center justify-center">
                    <div className="text-lg text-gray-600 font-mono">
                        {animationPhase === 'idle' && "Ready to generate"}
                        {animationPhase === 'processing' && "Processing..."}
                        {animationPhase === 'revealing' && "Developing..."}
                        {animationPhase === 'complete' && "Complete!"}
                    </div>
                </div>

                {/* Progress Bar - Positioned in white border area */}
                {animationPhase === 'processing' && (
                    <div className="absolute bottom-8 left-6 right-6 h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                        <div
                            className="h-full bg-gradient-to-r from-[var(--color-susfit-pink-500)] to-[var(--color-susfit-teal-500)] transition-all duration-200 ease-out rounded-full"
                            style={{
                                width: `${progress}%`,
                                transition: 'width 0.2s ease-out'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ANIMATED BUTTONS - APPEAR ONLY WHEN COMPLETE */}
            {(showButtons || generatedImage != null) && (
                <div className="mt-4 flex gap-2 justify-center animate-slideUp">
                    <Button
                        onClick={handleRetry}
                        className="bg-[var(--color-susfit-pink-500)] hover:bg-[var(--color-susfit-pink-800)] text-black border-2 border-black font-bold text-sm px-3 py-1 transition-all duration-200"
                        aria-label="Retry generation"
                    >
                        Retry
                    </Button>
                    <Button
                        onClick={onClose}
                        className="bg-[var(--color-susfit-teal-500)] hover:bg-[var(--color-susfit-teal-800)] text-white border-2 border-black font-bold text-sm px-3 py-1 transition-all duration-200"
                        aria-label="Close polaroid"
                    >
                        Close
                    </Button>
                </div>
            )}

            {/* Additional retry button visible when generatedImage is provided */}
            {generatedImage != null && (
                <div className="mt-4 text-center" aria-live="polite">
                    <button 
                        onClick={onRetry} 
                        className="text-sm underline text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors duration-200"
                        aria-label="Try another outfit"
                    >
                        Try another outfit
                    </button>
                </div>
            )}

            {/* Custom Animation Styles */}
            <style jsx>{`
                @keyframes slideUp {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.5s ease-out forwards;
                }
            `}</style>

            {/* Debug/Dev Controls (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500 font-mono text-center">
                    Phase: {animationPhase} | Progress: {Math.round(progress)}% | Buttons: {showButtons ? '✅' : '❌'} | isGenerating: {isGenerating ? 'true' : 'false'}
                </div>
            )}
        </div>
    )
}
