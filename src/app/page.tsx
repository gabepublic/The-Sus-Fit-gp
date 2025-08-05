"use client"

import React, { useState, useCallback, useRef } from "react"
import {SaucyTicker} from  "@/components/ui/saucy-ticker"
import {HeroImageWithButton} from "@/components/ui/hero-image-with-button"
import { BrutalismCard } from "@/components/ui/brutalism-card"
import { PolaroidPhotoGenerator } from "@/components/ui/polaroid-photo-generator"
import { fileToBase64, compressBase64, CompressionFailedError } from "@/utils/image"

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

export default function SusFitPage() {
    const [isCapturing, setIsCapturing] = useState(false)
    const [leftCardImage, setLeftCardImage] = useState<string | null>(null)
    const [rightCardImage, setRightCardImage] = useState<string | null>(null)
    const [showPolaroid, setShowPolaroid] = useState(false)
    const [userImageFile, setUserImageFile] = useState<File | null>(null)
    const [apparelImageFile, setApparelImageFile] = useState<File | null>(null)
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    
    // Refs for upload panels to enable focus management
    const leftCardRef = useRef<HTMLDivElement>(null)
    const rightCardRef = useRef<HTMLDivElement>(null)

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
        setIsCapturing(false)
    }

    const handleClosePolaroid = () => {
        console.log('Closing Polaroid')
        setShowPolaroid(false)
    }

    const handleRetryGeneration = () => {
        console.log('Retrying generation')
        
        // Reset all relevant states
        setGeneratedImage(null)
        setIsCapturing(false)
        setShowPolaroid(false)
        
        // Focus the left upload panel for accessibility
        setTimeout(() => {
            leftCardRef.current?.focus()
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
        
        // Clear any previous errors
        setShowError(false)
        setErrorMessage('')
        
        // Validate that both images are uploaded first
        if (!userImageFile || !apparelImageFile) {
            const missingItems = []
            if (!userImageFile) missingItems.push('model photo')
            if (!apparelImageFile) missingItems.push('apparel photo')
            
            const message = `Please upload ${missingItems.join(' and ')} before generating your fit.`
            setErrorMessage(message)
            setShowError(true)
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                setShowError(false)
                setErrorMessage('')
            }, 5000)
            
            return
        }
        
        // Set loading state and show polaroid
        setIsCapturing(true)
        setShowPolaroid(true)
        
        // Create AbortController for 30-second timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)
        
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
            
            // Store the generated image in state
            setGeneratedImage(img_generated)
            
            // The PolaroidPhotoGenerator will handle the generation animation
            // and automatically call onGenerationComplete when done
            
        } catch (error) {
            console.error('Error in handleCameraButtonClick:', error)
            
            // Clear timeout to prevent memory leaks
            clearTimeout(timeoutId)
            
            // Handle compression failures specifically
            if (error instanceof CompressionFailedError) {
                console.error('Image compression failed - file too large even after compression')
                setErrorMessage('Your image is still too large after compression. Please upload a smaller file.')
                setShowError(true)
                return
            }
            
            // Handle AbortError (timeout)
            if (error instanceof Error && error.name === 'AbortError') {
                console.error('API request timed out after 30 seconds')
                setErrorMessage('Request timed out. Please try again.')
                setShowError(true)
                return
            }
            
            // Handle other errors
            setErrorMessage('Failed to generate image. Please try again.')
            setShowError(true)
        } finally {
            // Always reset loading state
            setIsCapturing(false)
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
                            <div className="absolute left-1/2 top-[75%] transform -translate-x-1/2 z-50 transition-all duration-500 ease-out">
                                <PolaroidPhotoGenerator
                                    isGenerating={isCapturing}
                                    onGenerationStart={handleGenerationStart}
                                    onGenerationComplete={handleGenerationComplete}
                                    onClose={handleClosePolaroid}
                                    onRetry={handleRetryGeneration}
                                    mockImageUrl={"/images/demo/WillShalom.jpg"}
                                    generatedImage={generatedImage || undefined}
                                    isLoading={isCapturing}
                                    className="animate-[slideDown_0.5s_ease-out]"
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

                         {/* ERROR MESSAGE */}
            {showError && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-[slideDown_0.3s_ease-out]">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{errorMessage}</span>
                    </div>
                </div>
            )}

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

            {/* Custom slide down animation */}
            <style jsx>{`
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateX(0%) translateY(-200px) ;
          }
          100% {
            opacity: 1;
            transform: translateX(0%) translateY(0) ;
          }
        }
      `}</style>
        </div>
    )
}

