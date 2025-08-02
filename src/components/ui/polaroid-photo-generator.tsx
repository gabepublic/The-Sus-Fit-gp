"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"

interface PolaroidPhotoGeneratorProps {
    className?: string
    onGenerationStart?: () => void
    onGenerationComplete?: (imageUrl: string) => void
    onClose?: () => void
    onRetry?: () => void
    isGenerating?: boolean
    mockImageUrl?: string
}

export function PolaroidPhotoGenerator({
                                           className,
                                           onGenerationStart,
                                           onGenerationComplete,
                                           onClose,
                                           onRetry,
                                           isGenerating = false,
                                           mockImageUrl = "/images/demo/WillShalom.jpg"
                                       }: PolaroidPhotoGeneratorProps) {
    const [progress, setProgress] = useState(0)
    const [photoVisible, setPhotoVisible] = useState(false)
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'processing' | 'revealing' | 'complete'>('idle')
    const [showButtons, setShowButtons] = useState(false)

    const startGenerationSequence = useCallback(() => {
        setAnimationPhase('processing')
        setProgress(0)
        setPhotoVisible(false)
        setGeneratedImageUrl(null)
        setShowButtons(false)

        if (onGenerationStart) {
            onGenerationStart()
        }

        // Phase 1: Progress bar animation (0-3 seconds)
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval)
                    // Start Phase 2: Photo revelation
                    setTimeout(() => {
                        setAnimationPhase('revealing')
                        setGeneratedImageUrl(mockImageUrl)
                        setPhotoVisible(true)

                        // Phase 3: Complete after slide animation
                        setTimeout(() => {
                            setAnimationPhase('complete')
                            setShowButtons(true) // Show buttons with animation
                            if (onGenerationComplete) {
                                onGenerationComplete(mockImageUrl)
                            }
                        }, 1500) // Allow time for slide animation
                    }, 200)
                    return 100
                }
                return prev + 2
            })
        }, 60) // 60ms intervals for smooth animation (3 seconds total)
    }, [onGenerationStart, onGenerationComplete, mockImageUrl])

    useEffect(() => {
        if (isGenerating && animationPhase === 'idle') {
            startGenerationSequence()
        }
    }, [isGenerating, animationPhase, startGenerationSequence])

    const resetPolaroid = () => {
        setAnimationPhase('idle')
        setProgress(0)
        setPhotoVisible(false)
        setGeneratedImageUrl(null)
        setShowButtons(false)
    }

    const handleRetry = () => {
        resetPolaroid()
        if (onRetry) {
            onRetry()
        }
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

                    {/* Generated Photo - Square format */}
                    {generatedImageUrl && (
                        <div
                            className={cn(
                                "absolute inset-0 transition-all duration-1500 ease-out will-change-transform",
                                photoVisible
                                    ? "transform translate-y-0 opacity-100"
                                    : "transform -translate-y-full opacity-0"
                            )}
                            style={{
                                backgroundImage: `url(${generatedImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    )}
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
            {showButtons && (
                <div className="mt-4 flex gap-2 justify-center animate-slideUp">
                    <Button
                        onClick={handleRetry}
                        className="bg-[var(--color-susfit-pink-500)] hover:bg-[var(--color-susfit-pink-800)] text-black border-2 border-black font-bold text-sm px-3 py-1 transition-all duration-200"
                    >
                        Retry
                    </Button>
                    <Button
                        onClick={onClose}
                        className="bg-[var(--color-susfit-teal-500)] hover:bg-[var(--color-susfit-teal-800)] text-white border-2 border-black font-bold text-sm px-3 py-1 transition-all duration-200"
                    >
                        Close
                    </Button>
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
                    Phase: {animationPhase} | Progress: {Math.round(progress)}% | Buttons: {showButtons ? '✅' : '❌'}
                </div>
            )}
        </div>
    )
}
