"use client"

import React, { useRef } from "react"
import {SaucyTicker} from  "@/components/ui/saucy-ticker"
import {HeroImageWithButton} from "@/components/ui/hero-image-with-button"
import { BrutalismCard } from "@/components/ui/brutalism-card"
import { PolaroidPhotoGenerator } from "@/components/ui/polaroid-photo-generator"
import { usePageComponentState } from "@/hooks"


export default function SusFitPage() {
    // Replace all local state management with bridge layer hook
    const {
        isCapturing,
        leftCardImage,
        rightCardImage,
        showPolaroid,
        userImageFile,
        apparelImageFile,
        generatedImage,
        hasError,
        handleUserFileUpload,
        handleApparelFileUpload,
        handleLeftCardImageUpload,
        handleRightCardImageUpload,
        handleCameraButtonClick,
        handleGenerationStart,
        handleGenerationComplete,
        handleClosePolaroid,
        handleRetryGeneration
    } = usePageComponentState()
    
    // Refs for upload panels to enable focus management
    const leftCardRef = useRef<HTMLDivElement>(null)
    const rightCardRef = useRef<HTMLDivElement>(null)

    // Debug effect to log when File objects change (keeping for debugging)
    React.useEffect(() => {
        console.log('File objects updated:', {
            userImageFile: userImageFile ? `File: ${userImageFile.name} (${userImageFile.size} bytes)` : 'null',
            apparelImageFile: apparelImageFile ? `File: ${apparelImageFile.name} (${apparelImageFile.size} bytes)` : 'null'
        })
    }, [userImageFile, apparelImageFile])

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

