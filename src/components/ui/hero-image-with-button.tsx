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

    const calculateButtonPositionAndSize = useCallback(() => {
        if (!overlayButton) return

        const baseLeftPercent = parseFloat(overlayButton.position.leftPercent.replace('%', ''))

        // Try image-based calculation first
        if (containerRef.current && imageRef.current) {
            const image = imageRef.current
            const renderedImageHeight = image.clientHeight


            if (renderedImageHeight > 0) {
                let positionAdjustment = 0
                let scale = 1

                if (renderedImageHeight < 500) {
                    // Small camera image (laptop - 471px)
                    positionAdjustment = 3.4   // Move button RIGHT
                    scale = 0.67               // Scale button DOWN
                } else if (renderedImageHeight < 600) {
                    // Medium camera image (desktop - between 500-600px)
                    positionAdjustment = 1.0  // Move button LEFT (negative)
                    scale = 0.8                // Scale down slightly
                } else {
                    // Large camera image (27" monitor - 634px+)
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
        return () => clearTimeout(timeoutId)
    }, [overlayButton, calculateButtonPositionAndSize])

    // Recalculate on window resize
    useEffect(() => {
        const handleResize = () => {
            calculateButtonPositionAndSize()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [overlayButton, calculateButtonPositionAndSize])

    // Always render button when overlayButton is provided, but apply disabled state
    const shouldShowButton = overlayButton && isButtonReady

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
                            disabled={overlayButton.disabled}
                            data-test="generate-button"
                            className={cn(
                                "absolute z-20 rounded-full",
                                "transition-all duration-150 ease-in-out",
                                overlayButton.disabled 
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
