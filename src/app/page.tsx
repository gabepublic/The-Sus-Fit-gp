"use client"

import React, { useState, useCallback, useRef } from "react"
import {SaucyTicker} from  "@/components/ui/saucy-ticker"
import {HeroImageWithButton} from "@/components/ui/hero-image-with-button"
import { BrutalismCard } from "@/components/ui/brutalism-card"
import { PolaroidPhotoGenerator } from "@/components/ui/polaroid-photo-generator"
import { fileToBase64, compressBase64, CompressionFailedError } from "@/utils/image"
import { useToast } from "@/hooks"
import { errorToMessage } from "@/lib/errorToMessage"

// Utility function to resize image to 1024x1536
const resizeImageTo1024x1536 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }
            
            // Set canvas dimensions to target size
            canvas.width = 1024
            canvas.height = 1536
            
            // Draw the image resized to fit the canvas
            ctx.drawImage(img, 0, 0, 1024, 1536)
            
            // Convert to data URL
            const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.9)
            resolve(resizedImageUrl)
        }
        
        img.onerror = () => {
            reject(new Error('Failed to load image for resizing'))
        }
        
        img.src = imageUrl
    })
}

// Utility function moved outside the component
const logImageDimensions = (imageUrl: string, cardName: string) => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
        console.log(`${cardName} image dimensions:`, { width: img.width, height: img.height })
    }
}

// Compression limit constant for base64 conversion
const B64_LIMIT_KB = 2048 // 2MB limit for compression

// Timeout duration constant (60 seconds)
const TIMEOUT_DURATION_MS = 60000

export default function SusFitPage() {
    const [isCapturing, setIsCapturing] = useState(false)
    const [leftCardImage, setLeftCardImage] = useState<string | null>(null)
    const [rightCardImage, setRightCardImage] = useState<string | null>(null)
    const [showPolaroid, setShowPolaroid] = useState(false)
    const [userImageFile, setUserImageFile] = useState<File | null>(null)
    const [apparelImageFile, setApparelImageFile] = useState<File | null>(null)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [hasError, setHasError] = useState(false)
    
    // Refs for upload panels to enable focus management
    const leftCardRef = useRef<HTMLDivElement>(null)
    const rightCardRef = useRef<HTMLDivElement>(null)
    
    // Toast hook for error notifications
    const { showToast } = useToast()

    // Debug effect to log when File objects change
    React.useEffect(() => {
        console.log('File objects updated:', {
            userImageFile: userImageFile ? `File: ${userImageFile.name} (${userImageFile.size} bytes)` : 'null',
            apparelImageFile: apparelImageFile ? `File: ${apparelImageFile.name} (${apparelImageFile.size} bytes)` : 'null'
        })
    }, [userImageFile, apparelImageFile])

    // Memoized callback functions to prevent re-rendering issues
    const handleUserFileUpload = useCallback((file: File) => {
        setUserImageFile(file)
    }, [])

    const handleApparelFileUpload = useCallback((file: File) => {
        setApparelImageFile(file)
    }, [])


    const handleGenerationStart = () => {
        console.log('Generation started')
    }

    const handleGenerationComplete = (imageUrl: string) => {
        console.log('Generation complete:', imageUrl)
        // This is now handled directly in the API response
        // No need to reset isCapturing here anymore
    }

    const handleClosePolaroid = () => {
        console.log('Closing Polaroid')
        setShowPolaroid(false)
    }

    const handleRetryGeneration = () => {
        console.log('Retry generation clicked')
        setHasError(false)
        setGeneratedImage(null)
        // Use setTimeout to hide polaroid after a delay
        setTimeout(() => {
            setShowPolaroid(false)
        }, 100)
    }

    const handleLeftCardImageUpload = async (imageUrl: string) => {
        try {
            console.log('Left card image uploaded: (original):', imageUrl)
            logImageDimensions(imageUrl, 'Left card (original)')
            
            // Resize the image to 1024x1536
            const resizedImageUrl = await resizeImageTo1024x1536(imageUrl)
            
            setLeftCardImage(resizedImageUrl)
            console.log('Left card image resized to 1024x1536:', resizedImageUrl)
            logImageDimensions(resizedImageUrl, 'Left card (resized)')
            
            // Create a File object from the base64 data URL as backup
            // This ensures we have a File object even if onFileUpload doesn't work
            try {
                const response = await fetch(imageUrl)
                const blob = await response.blob()
                const file = new File([blob], 'user-image.jpg', { type: 'image/jpeg' })
                console.log('Created backup File object for left card:', file.name, file.size)
                setUserImageFile(file)
            } catch (fileError) {
                console.error('Failed to create backup File object:', fileError)
            }
        } catch (error) {
            console.error('Error resizing image:', error)
            // Fallback to original image if resizing fails
            setLeftCardImage(imageUrl)
            console.log('Using original image due to resize error')
        }
    }

    const handleRightCardImageUpload = async (imageUrl: string) => {
        try {
            console.log('Right card image uploaded (original):', imageUrl)
            logImageDimensions(imageUrl, 'Right card (original)')
            
            // Resize the image to 1024x1536
            const resizedImageUrl = await resizeImageTo1024x1536(imageUrl)
            
            setRightCardImage(resizedImageUrl)
            console.log('Right card image resized to 1024x1536:', resizedImageUrl)
            logImageDimensions(resizedImageUrl, 'Right card (resized)')
            
            // Create a File object from the base64 data URL as backup
            // This ensures we have a File object even if onFileUpload doesn't work
            try {
                const response = await fetch(imageUrl)
                const blob = await response.blob()
                const file = new File([blob], 'apparel-image.jpg', { type: 'image/jpeg' })
                console.log('Created backup File object for right card:', file.name, file.size)
                setApparelImageFile(file)
            } catch (fileError) {
                console.error('Failed to create backup File object:', fileError)
            }
        } catch (error) {
            console.error('Error resizing image:', error)
            // Fallback to original image if resizing fails
            setRightCardImage(imageUrl)
            console.log('Using original image due to resize error')
        }
    }

    const handleCameraButtonClick = async () => {
        console.log('Camera button clicked!')
        
        // Validate that both images are uploaded first
        if (!userImageFile || !apparelImageFile) {
            let message = ''
            if (!userImageFile && !apparelImageFile) {
                message = 'Please upload model photo and apparel photo before generating your fit.'
            } else if (!userImageFile) {
                message = 'Please upload model photo'
            } else if (!apparelImageFile) {
                message = 'Please upload apparel photo'
            }
            
            showToast(message, 'warning')
            return
        }
        
        // Set loading state and show polaroid
        setIsCapturing(true)
        setShowPolaroid(true)
        setHasError(false)
        
        // Create AbortController for 30-second timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION_MS)
        
        try {
            // Convert and compress both images concurrently with higher limit
            const [modelB64, apparelB64] = await Promise.all([
                fileToBase64(userImageFile).then(b64 => compressBase64(b64, B64_LIMIT_KB)),
                fileToBase64(apparelImageFile).then(b64 => compressBase64(b64, B64_LIMIT_KB))
            ])
            
            console.log('Successfully converted images to base64:', {
                modelB64: modelB64.substring(0, 50) + '...',
                apparelB64: apparelB64.substring(0, 50) + '...'
            })
            
            // Dispatch /api/tryon request with 30s timeout
            const response = await fetch('/api/tryon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    modelImage: modelB64, 
                    apparelImages: [apparelB64] 
                }),
                signal: controller.signal
            })
            
            // Clear timeout to prevent memory leaks
            clearTimeout(timeoutId)
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API request failed: ${response.status} - ${errorText}`)
            }
            
            const { img_generated } = await response.json()
            console.log('Successfully received generated image from API')
            console.log('Generated image length:', img_generated?.length || 0)
            console.log('Generated image preview:', img_generated?.substring(0, 50) + '...')
            
            // Store the generated image in state
            setGeneratedImage(img_generated)
            console.log('Set generatedImage state to:', img_generated ? 'base64 string' : 'null')
            
            // Set isCapturing to false immediately when we have the image
            // This will hide the loading spinner and show the generated image
            setIsCapturing(false)
            console.log('Set isCapturing to false - image should now display')
            
        } catch (error) {
            console.error('Error in handleCameraButtonClick:', error)
            
            // Clear timeout to prevent memory leaks
            clearTimeout(timeoutId)
            
            // Set error state
            setHasError(true)
            
            // Handle compression failures specifically
            if (error instanceof CompressionFailedError) {
                console.error('Image compression failed - file too large even after compression')
                showToast('Your image is still too large after compression. Please upload a smaller file.', 'error')
                setIsCapturing(false)
                return
            }
            
            // Handle AbortError (timeout)
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('AbortError'))) {
                console.error(`API request timed out after ${TIMEOUT_DURATION_MS}ms`)
                showToast(errorToMessage('TIMEOUT'), 'error')
                setIsCapturing(false)
                return
            }
            
            // Handle API errors with status codes
            if (error instanceof Error && error.message.includes('API request failed:')) {
                const statusMatch = error.message.match(/API request failed: (\d+)/)
                const status = statusMatch ? parseInt(statusMatch[1]) : undefined
                showToast(errorToMessage(status), 'error')
                setIsCapturing(false)
                return
            }
            
            // Handle other errors
            showToast(errorToMessage(), 'error')
            setIsCapturing(false)
        } finally {
            // Don't reset isCapturing here - let the PolaroidPhotoGenerator handle completion
            // The component will call onGenerationComplete when the animation is done
        }
    }

    return (
        <div className="min-h-screen bg-[var(--color-susfit-yellow-500)]">
            {/* Header */}
            <header className="px-8 py-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="title">The Sus Fit</h1>
                    <p className="text-lg text-[#000000] mb-4">we be doin&apos; the most</p>
                    <p className="text-sm text-[#000000]">
                        a <b>Those People production</b>
                    </p>
                </div>
            </header>

            {/* Ticker */}
            <SaucyTicker />

            {/* Main Content */}
            <main className="max-w-8xl mx-auto px-8 py-12 relative min-h-[140vh]">
                <div className="flex flex-col justify-center items-center relative space-y-8 lg:space-y-0">

                    {/* Hero Image as background */}
                    <div id="hero-image-container" className="absolute top-[-1rem] left-0 right-0 flex justify-center items-center overflow-hidden z-100">
                        <HeroImageWithButton
                            src="/images/PolaroidCamera.png"
                            alt="Hero Image"
                            className="w-[210%] max-w-none object-contain transform-gpu scale-150 pl-4"
                            overlayButton={{
                                onClick: handleCameraButtonClick,
                                position: {
                                    leftPercent: '41.65%',
                                    topPercent: '52%'
                                },
                                size: 'md',
                                className: 'hover:shadow-red-500/50',
                                disabled: isCapturing || !userImageFile || !apparelImageFile
                            }}
                        />
                    </div>

                    <div id="content-container" className="flex flex-col relative z-10 w-[100%] h-[75%] max-w-6xl">

                        {/* POLAROID PHOTO GENERATOR - POSITIONED ABOVE SIDE CARDS */}
                        {showPolaroid && (
                            <div className="absolute left-1/2 top-[75%] transform -translate-x-1/2 z-50">
                                <PolaroidPhotoGenerator
                                    isGenerating={isCapturing}
                                    onGenerationStart={handleGenerationStart}
                                    onGenerationComplete={handleGenerationComplete}
                                    onClose={handleClosePolaroid}
                                    onRetry={handleRetryGeneration}
                                    mockImageUrl={"/images/demo/WillShalom.jpg"}
                                    generatedImage={generatedImage || undefined}
                                    isLoading={isCapturing}
                                    hasError={hasError}
                                />
                            </div>
                        )}

                        {/* SIDE CARDS CONTAINER */}
                        <div className="flex w-[100%] justify-between items-center relative space-y-0 mt-[25vh] pt-16">
                            {/* Left Photo Frame */}
                            <div className="relative -rotate-2 lg:-rotate-16" ref={leftCardRef} tabIndex={-1}>
                                 <BrutalismCard
                                     className="w-80 h-120 p-4 relative"
                                     title="Upload Your Angle"
                                     onImageUpload={handleLeftCardImageUpload}
                                                                           onFileUpload={handleUserFileUpload}
                                 />
                            </div>

                            {/* Right Upload Frame */}
                             <div className="relative rotate-2 lg:rotate-16" ref={rightCardRef} tabIndex={-1}>
                                 <BrutalismCard
                                     className="w-80 h-120 p-4 relative"
                                     buttonPosition="right"
                                     backgroundImage="/images/ScoredGarment.jpg"
                                     title="Select your Fit"
                                     shadowRotation="rotate-0"
                                     onImageUpload={handleRightCardImageUpload}
                                                                           onFileUpload={handleApparelFileUpload}
                                 />
                             </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Social Media Footer */}
            <footer className="flex justify-center py-8 mt-20">
                <div className="flex space-x-4 bg-[#f9f8f8] border-1 border-[#000000] rounded-full px-6 py-3">
                    <a
                        href="#"
                        className="w-12 h-12 bg-[#000000] rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        <span className="text-white font-bold text-lg">t</span>
                    </a>
                    <a
                        href="#"
                        className="w-12 h-12 bg-[#f9f8f8] border-1 border-[#000000] rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        <div className="w-6 h-6 border-1 border-[#000000] rounded-full"></div>
                    </a>
                    <a
                        href="#"
                        className="w-12 h-12 bg-[#000000] rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        <span className="text-white font-bold text-lg">P</span>
                    </a>
                </div>
            </footer>

                         {/* Bottom Copyright */}
             <div className="text-center pb-8">
                 <p className="text-sm text-[#000000]">THE PRODUCT GROUP</p>
             </div>

                         {/* DEBUG INFO */}
              {process.env.NODE_ENV === 'development' && (
                                     <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded text-xs font-mono z-[9999]">
                       <div>Left Image: {leftCardImage ? '✅' : '❌'}</div>
                       <div>Right Image: {rightCardImage ? '✅' : '❌'}</div>
                       <div>Show Polaroid: {showPolaroid ? '✅' : '❌'}</div>
                       <div>Capturing: {isCapturing ? '✅' : '❌'}</div>
                       <div>Generated Image: {generatedImage ? '✅' : '❌'}</div>
                   </div>
              )}

            
        </div>
    )
}

