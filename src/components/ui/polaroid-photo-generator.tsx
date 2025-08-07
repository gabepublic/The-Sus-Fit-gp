"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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
    mockImageUrl,
    generatedImage,
    isLoading = false
}: PolaroidPhotoGeneratorProps) {
    const [imgLoaded, setImgLoaded] = useState(false)
    const [showButtons, setShowButtons] = useState(false)
    const [progress, setProgress] = useState(0)

    // Debug logging
    console.log('PolaroidPhotoGenerator props:', {
        generatedImage: generatedImage ? `base64 (${generatedImage.length} chars)` : 'null',
        isGenerating,
        isLoading
    })

    // Handle generatedImage changes - show immediately when available
    useEffect(() => {
        if (generatedImage != null) {
            console.log('Generated image available, showing immediately')
            setShowButtons(true)
            setImgLoaded(false) // Will be set to true when image loads
            
            // Call onGenerationComplete immediately without delay
            if (onGenerationComplete) {
                const fullImageUrl = `data:image/png;base64,${generatedImage}`
                onGenerationComplete(fullImageUrl)
            }
        } else {
            setShowButtons(false)
        }
    }, [generatedImage, onGenerationComplete])

    // Handle generation start and progress
    useEffect(() => {
        if (isGenerating && onGenerationStart) {
            onGenerationStart()
            setProgress(0)
            
            // Start progress animation
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval)
                        return 100
                    }
                    return prev + 2
                })
            }, 60) // Update every 60ms for smooth animation
            
            return () => clearInterval(interval)
        } else {
            setProgress(0)
        }
    }, [isGenerating, onGenerationStart])

    const handleRetry = () => {
        setImgLoaded(false)
        setShowButtons(false)
        if (onRetry) {
            onRetry()
        }
    }

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget
        console.log('Image loaded successfully')
        console.log('Image dimensions:', {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            clientWidth: img.clientWidth,
            clientHeight: img.clientHeight
        })
        setImgLoaded(true)
    }

    return (
        <div className={cn("relative flex flex-col items-center", className)} data-testid="polaroid">
            {/* Polaroid Container */}
            <div className="relative bg-white p-6 w-[475px] h-[550px] flex flex-col shadow-lg rounded-sm">
                {/* Photo Area */}
                <div className="relative w-full h-[400px] overflow-hidden rounded-sm bg-gray-100">
                    {/* Loading State with Image, Spinner, and Progress Bar (for isGenerating prop) */}
                    {isGenerating && !generatedImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                                src={mockImageUrl || '/images/demo/WillShalom.jpg'}
                                alt="Generated try-on preview"
                                fill
                                className="object-contain rounded-sm opacity-50"
                                aria-busy="true"
                                unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-susfit-pink-500)] mx-auto mb-4"></div>
                                    <div className="text-gray-600 font-mono">Generating...</div>
                                    
                                    {/* Progress Bar */}
                                    <div className="mt-4 w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[var(--color-susfit-pink-500)] to-[var(--color-susfit-teal-500)] transition-all duration-300 ease-out"
                                            style={{ width: `${progress}%` }}
                                            data-testid="progress-bar"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-sm"></div>
                        </div>
                    )}

                    {/* Loading State with Image and Shimmer (for isLoading prop) */}
                    {isLoading && !generatedImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                                src={mockImageUrl || '/images/demo/WillShalom.jpg'}
                                alt="Generated try-on preview"
                                fill
                                className="object-contain rounded-sm opacity-50"
                                aria-busy="true"
                                unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                                <div className="text-center">
                                    <div className="animate-pulse rounded-full h-12 w-12 bg-[var(--color-susfit-pink-500)] mx-auto mb-4"></div>
                                    <div className="text-gray-600 font-mono">Loading...</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Generated Image with Fade-in Effect */}
                    {generatedImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                                src={`data:image/png;base64,${generatedImage}`}
                                alt="Generated try-on preview"
                                fill
                                className={`object-contain rounded-sm transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={handleImageLoad}
                                onError={(e) => {
                                    console.error('Image failed to load:', e)
                                    console.error('Generated image length:', generatedImage?.length || 0)
                                }}
                                unoptimized
                            />
                        </div>
                    )}

                    {/* Default Image when no other state is active and no mockImageUrl provided */}
                    {!generatedImage && !isGenerating && !isLoading && mockImageUrl === undefined && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                                src="/images/demo/WillShalom.jpg"
                                alt="Generated try-on preview"
                                fill
                                className="object-contain rounded-sm"
                                unoptimized
                            />
                        </div>
                    )}

                    {/* Text placeholder when mockImageUrl is explicitly provided */}
                    {!generatedImage && !isGenerating && !isLoading && mockImageUrl !== undefined && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-400 font-mono text-center">
                                Ready to generate
                            </div>
                        </div>
                    )}
                </div>

                {/* Polaroid Bottom Border */}
                <div className="h-[70px] bg-white flex items-center justify-center">
                    <div className="text-lg text-gray-600 font-mono">
                        {isGenerating && !generatedImage && "Processing..."}
                        {isLoading && !generatedImage && "Loading..."}
                        {generatedImage && "Complete!"}
                        {!isGenerating && !isLoading && !generatedImage && "Ready to generate"}
                    </div>
                </div>
            </div>

            {/* Buttons */}
            {showButtons && (
                <div className="mt-4 flex gap-2 justify-center">
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

            {/* Additional retry button */}
            {generatedImage && (
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

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500 font-mono text-center">
                    Generated: {generatedImage ? '✅' : '❌'} | Loading: {imgLoaded ? '✅' : '❌'} | isGenerating: {isGenerating ? 'true' : 'false'}
                </div>
            )}
        </div>
    )
}
