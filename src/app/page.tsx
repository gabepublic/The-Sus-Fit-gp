"use client"

import type React from "react"
import { useState } from "react"
import {SaucyTicker} from  "@/components/ui/saucy-ticker"
import {HeroImageWithButton} from "@/components/ui/hero-image-with-button"
import { BrutalismCard } from "@/components/ui/brutalism-card"
import { PolaroidPhotoGenerator } from "@/components/ui/polaroid-photo-generator"

export default function SusFitPage() {
    const [isCapturing, setIsCapturing] = useState(false)
    const [leftCardImage, setLeftCardImage] = useState<string | null>(null)
    const [rightCardImage, setRightCardImage] = useState<string | null>(null)
    const [showPolaroid, setShowPolaroid] = useState(false)

    const handlePhotoCapture = () => {
        console.log('Photo capture initiated!')
        setIsCapturing(true)
        setShowPolaroid(true)
        // Simulate photo capture
        setTimeout(() => {
            setIsCapturing(false)
            // In a real app, this would capture from camera
        }, 2000)
     }
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
        setIsCapturing(false)
    }

    const handleRetryGeneration = () => {
        console.log('Retrying generation')
        setIsCapturing(false)
        // Restart the generation process
        setTimeout(() => {
            setIsCapturing(true)
        }, 100)
    }

    const handleLeftCardImageUpload = (imageUrl: string) => {
        setLeftCardImage(imageUrl)
        console.log('Left card image uploaded:', imageUrl)
    }

    const handleRightCardImageUpload = (imageUrl: string) => {
        setRightCardImage(imageUrl)
        console.log('Right card image uploaded:', imageUrl)
    }

    const handleCameraButtonClick = () => {
        console.log('Camera button clicked!')
        handlePhotoCapture()
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
                                className: 'hover:shadow-red-500/50'
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
                                    className="animate-[slideDown_0.5s_ease-out]"
                                />
                            </div>
                        )}

                        {/* SIDE CARDS CONTAINER */}
                        <div className="flex w-[100%] justify-between items-center relative space-y-0 mt-[25vh] pt-16">

                            {/* Left Photo Frame */}
                            <div className="relative -rotate-2 lg:-rotate-16">
                                <BrutalismCard
                                    className="w-80 h-120 p-4 relative"
                                    title="Upload Your Angle"
                                    onImageUpload={handleLeftCardImageUpload}
                                />
                            </div>

                            {/* Right Upload Frame */}
                            <div className="relative rotate-2 lg:rotate-16">
                                <BrutalismCard
                                    className="w-80 h-120 p-4 relative"
                                    buttonPosition="right"
                                    backgroundImage="/images/ScoredGarment.jpg"
                                    title="Select your Fit"
                                    shadowRotation="rotate-0"
                                    onImageUpload={handleRightCardImageUpload}
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

