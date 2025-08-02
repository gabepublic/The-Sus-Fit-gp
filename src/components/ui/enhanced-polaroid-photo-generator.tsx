"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useRef, useCallback } from "react"

interface EnhancedPolaroidPhotoGeneratorProps {
    className?: string
    onGenerationStart?: () => void
    onGenerationComplete?: (imageUrl: string) => void
    isGenerating?: boolean
    personImageUrl?: string
    garmentImageUrl?: string
    mockImageUrl?: string
    position?: 'center' | 'bottom' // Position relative to camera
}

export function EnhancedPolaroidPhotoGenerator({
                                                   className,
                                                   onGenerationStart,
                                                   onGenerationComplete,
                                                   isGenerating = false,
                                                   personImageUrl,
                                                   garmentImageUrl,
                                                   mockImageUrl = "/images/ScoredGarment.jpg",
                                                   position = 'bottom'
                                               }: EnhancedPolaroidPhotoGeneratorProps) {
    const [progress, setProgress] = useState(0)
    const [photoVisible, setPhotoVisible] = useState(false)
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
    const [animationPhase, setAnimationPhase] = useState<'idle' | 'processing' | 'revealing' | 'complete'>('idle')
    const [polaroidVisible, setPolaroidVisible] = useState(false)
    const progressRef = useRef<NodeJS.Timeout | null>(null)

    const startGenerationSequence = useCallback(() => {
        // Show the polaroid sliding out from camera
        setPolaroidVisible(true)
        setAnimationPhase('processing')
        setProgress(0)
        setPhotoVisible(false)
        setGeneratedImageUrl(null)

        if (onGenerationStart) {
            onGenerationStart()
        }

        // Determine which image to use
        const imageToUse = personImageUrl || garmentImageUrl || mockImageUrl

        // Phase 1: Progress bar animation (0-4 seconds)
        let currentProgress = 0
        progressRef.current = setInterval(() => {
            currentProgress += 1.5
            setProgress(currentProgress)

            if (currentProgress >= 100) {
                if (progressRef.current) {
                    clearInterval(progressRef.current)
                }

                // Phase 2: Photo revelation (after 4 seconds)
                setTimeout(() => {
                    setAnimationPhase('revealing')
                    setGeneratedImageUrl(imageToUse)

                    // Start photo slide animation
                    setTimeout(() => {
                        setPhotoVisible(true)

                        // Phase 3: Complete after slide animation (1.5s later)
                        setTimeout(() => {
                            setAnimationPhase('complete')
                            if (onGenerationComplete) {
                                onGenerationComplete(imageToUse)
                            }
                        }, 1500)
                    }, 100)
                }, 500)
            }
        }, 80) // Slower, more realistic progress
    }, [onGenerationStart, onGenerationComplete, personImageUrl, garmentImageUrl, mockImageUrl])

    useEffect(() => {
        if (isGenerating && animationPhase === 'idle') {
            startGenerationSequence()
        }
    }, [isGenerating, animationPhase, startGenerationSequence])



    const getPositionClasses = () => {
        switch (position) {
            case 'center':
                return "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            case 'bottom':
            default:
                return "absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-8"
        }
    }

    if (!polaroidVisible) return null

    return (
        <div className={cn(
            "z-50 transition-all duration-700 ease-out",
            getPositionClasses(),
            className
        )}>
            {/* Polaroid Card */}
            <div className={cn(
                "relative bg-white border-2 border-black rounded-lg p-4 w-72 h-80 transition-all duration-500",
                "polaroid-shadow",
                polaroidVisible ? "animate-polaroidAppear" : "opacity-0 transform scale-95"
            )}>

                {/* Photo Area */}
                <div className="relative w-full h-48 bg-gray-400 border border-gray-300 overflow-hidden rounded-sm">

                    {/* Gray Placeholder with Developing Effect */}
                    <div
                        className={cn(
                            "absolute inset-0 transition-all duration-1000 z-10",
                            animationPhase === 'processing' ? "photo-developing" : "",
                            photoVisible ? "opacity-0" : "opacity-100 bg-gray-400"
                        )}
                    />

                    {/* Generated Photo */}
                    {generatedImageUrl && (
                        <div
                            className={cn(
                                "absolute inset-0 transition-all duration-1500 ease-out",
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

                    {/* Processing Overlay */}
                    {animationPhase === 'processing' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent animate-pulse z-20" />
                    )}
                </div>

                {/* Polaroid White Space */}
                <div className="h-16 bg-white flex items-center justify-center">
                    <div className="text-xs text-gray-600 font-mono tracking-wider">
                        {animationPhase === 'idle' && "READY"}
                        {animationPhase === 'processing' && "PROCESSING..."}
                        {animationPhase === 'revealing' && "DEVELOPING..."}
                        {animationPhase === 'complete' && "SUS FIT COMPLETE"}
                    </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="absolute bottom-3 left-4 right-4">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                        <div
                            className={cn(
                                "h-full bg-gradient-to-r from-[var(--color-susfit-pink-500)] via-[var(--color-susfit-teal-500)] to-[var(--color-susfit-green-500)] transition-all duration-200 ease-out rounded-full",
                                animationPhase === 'processing' ? "progress-bar-animated" : ""
                            )}
                            style={{
                                width: `${progress}%`,
                                transition: 'width 0.2s ease-out'
                            }}
                        />
                    </div>

                    {/* Progress Percentage */}
                    <div className="text-xs text-gray-500 text-center mt-1 font-mono">
                        {Math.round(progress)}%
                    </div>
                </div>

                {/* Vintage Polaroid Logo */}
                <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">
                    SUS FIT
                </div>
            </div>

            {/* Photo "Ejection" Animation Shadow */}
            <div className={cn(
                "absolute -bottom-2 left-4 right-4 h-2 bg-black/20 rounded-full blur-sm transition-opacity duration-500",
                polaroidVisible ? "opacity-100" : "opacity-0"
            )} />

            {/* Development Completion Indicator */}
            {animationPhase === 'complete' && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="bg-[var(--color-susfit-green-500)] text-black px-3 py-1 rounded-full text-xs font-bold border-2 border-black">
                        ✨ READY!
                    </div>
                </div>
            )}
        </div>
    )
}
