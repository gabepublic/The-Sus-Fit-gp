"use client"

import React, { useState, useCallback, useRef } from "react"
import {SaucyTicker} from  "@/components/ui/saucy-ticker"
import {HeroImageWithButton} from "@/components/ui/hero-image-with-button"
import { BrutalismCard } from "@/components/ui/brutalism-card"
import { PolaroidPhotoGenerator } from "@/components/ui/polaroid-photo-generator"
import { base64ToDataUrl } from "@/utils/image"
import { useToast } from "@/hooks"
import { errorToMessage } from "@/lib/errorToMessage"
import { useImageResize } from "@/hooks/useImageResize"
import { normalizeBase64 } from '@/lib/tryOnSchema';
import { ResizeOptions, ImagesMetadata, ImageMetadata } from '@/lib/imageResizingService';


// Utility function moved outside the component
// const logImageDimensions = (imageDataUrl: string, cardName: string) => {
//     const img = new Image()
//     img.src = imageDataUrl
//     img.onload = () => {
//         console.log(`${cardName} image dimensions:`, { width: img.width, height: img.height })
//     }
// }

// Compression limit constant for base64 conversion
//const B64_LIMIT_KB = 2048 // 2MB limit for compression

// Timeout duration constant (60 seconds)
const TIMEOUT_DURATION_MS = 120000

const DEFAULT_RESIZE_OPTIONS: ResizeOptions = {
    width: 832,
    height: 1248,
    fit: 'contain',
    quality: 80,
    format: 'png',
    compressionLevel: 9,
    withoutEnlargement: true
}

const INITIAL_IMAGE_METADATA: ImageMetadata = {
    size: 0,
    type: '',
    width: 0,
    height: 0,
    format: ''
}

const INITIAL_IMAGES_METADATA: ImagesMetadata = {
    original: INITIAL_IMAGE_METADATA,
    resized: INITIAL_IMAGE_METADATA
}

export default function SusFitPage() {
    const [isCapturing, setIsCapturing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [leftCardImage, setLeftCardImage] = useState<string | null>(null)   // USED; Original uploaded image before resizing
    const [rightCardImage, setRightCardImage] = useState<string | null>(null)   // USED; Original uploaded image before resizing
    const [leftCardImageB64, setLeftCardImageB64] = useState<string | null>(null)       // USED; resized image in base64 format
    const [rightCardImageB64, setRightCardImageB64] = useState<string | null>(null)     // USED; resized image in base64 format
    const [userImagesMetadata, setUserImagesMetadata] = useState<ImagesMetadata | null>(null)   // USED
    const [apparelImagesMetadata, setApparelImagesMetadata] = useState<ImagesMetadata | null>(null)   // USED

    const [showPolaroid, setShowPolaroid] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)  // USED; AI generated image
    const [hasError, setHasError] = useState(false)
    const { resizeImage } = useImageResize();
    
    // Refs for upload panels to enable focus management
    const leftCardRef = useRef<HTMLDivElement>(null)
    const rightCardRef = useRef<HTMLDivElement>(null)
    
    // Toast hook for error notifications
    const { showToast } = useToast()

    // Memoized callback functions to prevent re-rendering issues
    const handleUserFileUpload = useCallback((file: File) => {
        console.log('Left-card User file uploaded:', file)
        const imagesMetadata = {
            original: {
                name: file.name,
                size: file.size,
                type: file.type,
                width: 0,
                height: 0,
                format: file.type.split('/')[1]
            },
            resized: {
                size: 0,
                type: 'image/png',
                width: 0,
                height: 0,
                format: 'png'
            }
        }
        console.log('UserImagesMetadata:', imagesMetadata)
        setUserImagesMetadata(imagesMetadata);
    }, [])

    const handleApparelFileUpload = useCallback((file: File) => {
        console.log('Right-card Apparel file uploaded:', file)
        const imagesMetadata = {
            original: {
                name: file.name,
                size: file.size,
                type: file.type,
                width: 0,
                height: 0,
                format: file.type.split('/')[1]
            },
            resized: {
                size: 0,
                type: 'image/png',
                width: 0,
                height: 0,
                format: 'png'
            }
        }
        console.log('ApparelImagesMetadata:', imagesMetadata)
        setApparelImagesMetadata(imagesMetadata)
    }, [])

    const handleGenerationStart = () => {
        console.log('Generation started...')
    }

    const handleGenerationComplete = (imageUrl: string) => {
        console.log('Generation complete:', imageUrl)
        // This is now handled directly in the API response
        // No need to reset isCapturing here anymore
    }

    const handleClosePolaroid = () => {
        console.log('Closing Polaroid')
        setShowPolaroid(false)
        setGeneratedImage(null) // Reset generated image state when closing
        setHasError(false) // Reset error state when closing
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

    const handleLeftCardImageUpload = async (imageDataUrl: string): Promise<string> => {
        // imageDataUrl is Data URL format: data:[<mediatype>][;base64],<data>
        try {
            console.log('Left-card User image DataURL: (original):', imageDataUrl.substring(0, 50) + '...')
            setLeftCardImage(imageDataUrl)   // save the original image to state for future resizing!!
            //logImageDimensions(imageDataUrl, 'Left-card (original)')

            let resizedImageDataUrl = imageDataUrl
            // Extract base64 from dataURL
            const imageB64 = normalizeBase64(imageDataUrl)
            setLeftCardImageB64(imageB64)
            
            // ******** Resize image using the resizeImage hook ********
            const resizeOptions = DEFAULT_RESIZE_OPTIONS
            const result = await resizeImage(imageB64, resizeOptions);
            console.log('handleLeftCardImageUpload: result', result);
            
            let imgsMetadata = userImagesMetadata
            let originalImageMetadata = INITIAL_IMAGE_METADATA
            if (!imgsMetadata) {
                imgsMetadata = INITIAL_IMAGES_METADATA
            } else {
                // preserve the original image metadata because it has the original filename
                originalImageMetadata = imgsMetadata.original
            }
            if (result.success && result.resizedB64) {
                setLeftCardImageB64(result.resizedB64)
                const originalMetadata = result.metadata?.original
                const resizedMetadata = result.metadata?.resized
                if (originalMetadata) {
                    if (originalImageMetadata) {
                        originalImageMetadata.width = originalMetadata.width
                        originalImageMetadata.height = originalMetadata.height
                        originalImageMetadata.hasAlpha = originalMetadata.hasAlpha
                        originalImageMetadata.channels = originalMetadata.channels
                        originalImageMetadata.space = originalMetadata.space
                    } else {
                        imgsMetadata.original = originalMetadata
                    }
                }
                let imgFormat = 'png'
                if (resizedMetadata) {
                    imgsMetadata.resized = resizedMetadata
                    imgFormat = resizedMetadata.format
                }
                setUserImagesMetadata(imgsMetadata)
                if (imgFormat) {
                    resizedImageDataUrl = await base64ToDataUrl(result.resizedB64, "image/" + imgFormat)
                }
            }
            return resizedImageDataUrl
        } catch (error) {
            console.error('Error resizing left-card User image:', error)
            return imageDataUrl
        }
    }

    const handleRightCardImageUpload = async (imageDataUrl: string): Promise<string> => {
        try {
            console.log('Right-card Apparel image DataURL (original):', imageDataUrl.substring(0, 50) + '...')
            setRightCardImage(imageDataUrl)   // save the original image to state for future resizing!!
            //logImageDimensions(imageDataUrl, 'Right-card (original)')

            let resizedImageDataUrl = imageDataUrl
            // Extract base64 from dataURL
            const imageB64 = normalizeBase64(imageDataUrl)
            setRightCardImageB64(imageB64)
            
            // ******** Resize image using the resizeImage hook ********
            const resizeOptions = DEFAULT_RESIZE_OPTIONS
            const result = await resizeImage(imageB64, resizeOptions);
            
            let imgsMetadata = apparelImagesMetadata
            let originalImageMetadata = INITIAL_IMAGE_METADATA
            if (!imgsMetadata) {
                imgsMetadata = INITIAL_IMAGES_METADATA
            } else {
                // preserve the original image metadata because it has the original filename
                originalImageMetadata = imgsMetadata.original
            }
            if (result.success && result.resizedB64) {
                setRightCardImageB64(result.resizedB64)
                const originalMetadata = result.metadata?.original
                const resizedMetadata = result.metadata?.resized
                if (originalMetadata) {
                    if (originalImageMetadata) {
                        originalImageMetadata.width = originalMetadata.width
                        originalImageMetadata.height = originalMetadata.height
                        originalImageMetadata.hasAlpha = originalMetadata.hasAlpha
                        originalImageMetadata.channels = originalMetadata.channels
                        originalImageMetadata.space = originalMetadata.space
                    } else {
                        imgsMetadata.original = originalMetadata
                    }
                }
                let imgFormat = 'png'
                if (resizedMetadata) {
                    imgsMetadata.resized = resizedMetadata
                    imgFormat = resizedMetadata.format
                }
                setApparelImagesMetadata(imgsMetadata)
                if (imgFormat) {
                    resizedImageDataUrl = await base64ToDataUrl(result.resizedB64, "image/" + imgFormat)
                    //logImageDimensions(resizedImageDataUrl, 'Right card (resized)')
                }
            }
            return resizedImageDataUrl
        } catch (error) {
            console.error('Error resizing right-card Apparel image:', error)
            return imageDataUrl
        }
    }

    const handleCameraButtonClick = async () => {
        console.log('Camera button clicked!')
        
        // Validate that both images are uploaded first
        if (!leftCardImageB64 || !rightCardImageB64) {
            let message = ''
            if (!leftCardImageB64 && !rightCardImageB64) {
                message = 'Please upload model photo and apparel photo before generating your fit.'
            } else if (!leftCardImageB64) {
                message = 'Please upload model photo'
            } else if (!rightCardImageB64) {
                message = 'Please upload apparel photo'
            }
            
            showToast(message, 'warning')
            return
        }
        
        // Set loading state and show polaroid
        setIsCapturing(true)
        setIsGenerating(false)
        setShowPolaroid(true)
        setHasError(false)
        
        // Create AbortController for 30-second timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION_MS)
        
        try {
            const modelB64 = leftCardImageB64 || ''
            const apparelB64 = rightCardImageB64 || ''
            
            console.log('Images base64:', {
                modelB64: modelB64.substring(0, 50) + '...',
                apparelB64: apparelB64?.substring(0, 50) + '...'
            })
            
            setIsCapturing(false)
            setIsGenerating(true)
    
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
            //setIsCapturing(false)
            setIsGenerating(false)
            console.log('Set isCapturing to false - image should now display')
            
        } catch (error) {
            console.error('Error in handleCameraButtonClick:', error)
            
            // Clear timeout to prevent memory leaks
            clearTimeout(timeoutId)
            
            // Set error state
            setHasError(true)
            
            // Handle compression failures specifically
            // if (error instanceof CompressionFailedError) {
            //     console.error('Image compression failed - file too large even after compression')
            //     showToast('Your image is still too large after compression. Please upload a smaller file.', 'error')
            //     setIsCapturing(false)
            //     return
            // }
            
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
                                disabled: isCapturing || !leftCardImageB64 || !rightCardImageB64
                            }}
                        />
                    </div>

                    <div id="content-container" className="flex flex-col relative z-10 w-[100%] h-[75%] max-w-6xl">

                        {/* POLAROID PHOTO GENERATOR - POSITIONED ABOVE SIDE CARDS */}
                        {showPolaroid && (
                            <div className="absolute left-1/2 top-[75%] transform -translate-x-1/2 z-50">
                                <PolaroidPhotoGenerator
                                    isGenerating={isGenerating}
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

