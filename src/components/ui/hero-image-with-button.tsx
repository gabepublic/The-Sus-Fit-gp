"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useEffect, useState, useRef, useCallback } from "react"

interface OverlayButtonProps {
    onClick: () => void
    position: { leftPercent: string; topPercent: string }
    className?: string
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
}

interface HeroImageProps {
    src: string
    alt: string
    className?: string
    priority?: boolean
    overlayButton?: OverlayButtonProps | null
}

export function HeroImageWithButton({
                                        src,
                                        alt,
                                        className,
                                        priority = true,
                                        overlayButton
                                    }: HeroImageProps) {
    const [adjustedLeftPercent, setAdjustedLeftPercent] = useState(
        overlayButton?.position.leftPercent || '41.65%'
    )
    const [buttonScale, setButtonScale] = useState(1)
    const [isButtonReady, setIsButtonReady] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    const buttonSizes = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    }

    // NEED to Refactor this!!
    const calculateButtonPositionAndSize = useCallback(() => {
        if (!overlayButton) return

        const baseLeftPercent = parseFloat(overlayButton.position.leftPercent.replace('%', ''))

        // Try image-based calculation first
        if (containerRef.current && imageRef.current) {
            const image = imageRef.current
            const renderedImageHeight = image.clientHeight
            const renderedImageWidth = image.clientWidth

            console.log('renderedImageWidth : renderedImageHeight', renderedImageWidth, ':', renderedImageHeight)
            if (renderedImageHeight > 0) {
                let positionAdjustment = 0
                let scale = 1

                if (renderedImageHeight < 401) {    // // 0-399px
                    console.log('renderedImageHeight < 401')
                    positionAdjustment = -3.0   // Move button RIGHT
                    scale = 0.6               // Scale button DOWN
                } else if (renderedImageHeight < 512) {     //400-511pxpx 
                    // Small camera image (laptop - 471px)
                    //positionAdjustment = 3.4   // Move button RIGHT
                    //scale = 0.67
                    console.log('renderedImageHeight < 512')
                    positionAdjustment = -3.0   // Move button RIGHT
                    scale = 0.6               // Scale button DOWN
                } else if (renderedImageHeight < 600) {    // 512-600px`
                    // Medium camera image (desktop - between 500-600px)
                    console.log('renderedImageHeight < 600')
                    positionAdjustment = 0  // Move button LEFT (negative)
                    scale = 1.0                // Scale down slightly
                } else {  // 600px+
                    // Large camera image (27" monitor - 634px+)
                    console.log('renderedImageHeight > 600')
                    positionAdjustment = 0     // Keep current position (perfect)
                    scale = 1.0                // Keep full scale
                }

                const newLeftPercent = baseLeftPercent + positionAdjustment
                setAdjustedLeftPercent(`${newLeftPercent}%`)
                setButtonScale(scale)
                setIsButtonReady(true) // Show button after calculations

                // console.log('Height-based position & scale:', {
                //     renderedImageHeight,
                //     category: renderedImageHeight < 500 ? 'SMALL' : renderedImageHeight < 600 ? 'MEDIUM' : 'LARGE',
                //     baseLeftPercent,
                //     positionAdjustment,
                //     newLeftPercent: newLeftPercent.toFixed(2),
                //     buttonScale: scale,
                //     finalScale: (1.5 * scale).toFixed(2)
                // })
                return
            }
        }

        // Fallback: screen width
        if (typeof window !== 'undefined') {
            const screenWidth = window.innerWidth
            console.log('screenWidth', screenWidth)
            let positionAdjustment = 0
            let scale = 1

            if (screenWidth < 1400) {
                positionAdjustment = 6.0
                scale = 0.67
            } else if (screenWidth < 1800) {
                positionAdjustment = -3.0  // Desktop adjustment
                scale = 0.8
            }

            const newLeftPercent = baseLeftPercent + positionAdjustment
            setAdjustedLeftPercent(`${newLeftPercent}%`)
            setButtonScale(scale)
            // Set button ready even in fallback case
            setIsButtonReady(true)
        } else {
            // Ultimate fallback: set button ready with default values
            setAdjustedLeftPercent(overlayButton.position.leftPercent)
            setButtonScale(1)
            setIsButtonReady(true)
        }
    }, [overlayButton])


    // Calculate position when image loads
    const handleImageLoad = () => {
        setTimeout(() => {
            calculateButtonPositionAndSize()
        }, 250)
    }

    // Initial calculation on mount
    useEffect(() => {
        calculateButtonPositionAndSize()
        const timeoutId = setTimeout(calculateButtonPositionAndSize, 100)
        
        // Fallback: ensure button becomes ready after a maximum delay
        const fallbackTimeoutId = setTimeout(() => {
            if (!isButtonReady) {
                console.log('Button readiness fallback triggered')
                setIsButtonReady(true)
            }
        }, 1000) // 1 second fallback - reduced for faster test execution
        
        return () => {
            clearTimeout(timeoutId)
            clearTimeout(fallbackTimeoutId)
        }
    }, [overlayButton, calculateButtonPositionAndSize, isButtonReady])

    // Recalculate on window resize
    useEffect(() => {
        const handleResize = () => {
            calculateButtonPositionAndSize()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [overlayButton, calculateButtonPositionAndSize])

    // Always render button when overlayButton is provided, but apply disabled state
    const shouldShowButton = overlayButton

    return (
        <div className={cn(
            "relative w-full flex items-center justify-center",
            "h-[50vh] min-h-[400px] max-h-[800px]",
            className
        )}>
            <div ref={containerRef} className="relative w-full h-full max-w-5xl">
                <Image
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    fill
                    priority={priority}
                    className="object-contain drop-shadow-2xl"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                    onLoad={handleImageLoad}
                />

                {/* Overlay Button - Only render when both images are uploaded */}
                {shouldShowButton && (
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: 'scale(1.5)', // Keep this as it was
                            transformOrigin: 'center center'
                        }}
                    >
                        <button
                            onClick={overlayButton.onClick}
                            disabled={overlayButton.disabled || !isButtonReady}
                            data-test="generate-button"
                            className={cn(
                                "absolute z-[200] rounded-full pointer-events-auto",
                                "transition-all duration-150 ease-in-out",
                                (overlayButton.disabled || !isButtonReady)
                                    ? "cursor-not-allowed opacity-50" 
                                    : "hover:scale-110 active:scale-95 cursor-pointer",
                                buttonSizes[overlayButton.size || 'md'],
                                overlayButton.className
                            )}
                            style={{
                                left: adjustedLeftPercent,
                                top: overlayButton.position.topPercent,
                                transform: `translate(-50%, -50%) scale(${buttonScale})`,
                                background: `
                                    radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 60%),
                                    #D80E0E
                                `,
                                border: '2px solid #BF1212',
                                boxShadow: `
                                    0 15px 25px rgba(0, 0, 0, 0.4),
                                    0 0 0 4px rgba(240, 228, 228, 0.5)
                                `,
                            }}
                            aria-label="Camera capture button"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
