"use client"

import type React from "react"

import { useState } from "react"
import { Play, Camera, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {SaucyTicker} from  "@/components/ui/saucy-ticker"
import { HeroImage } from "@/components/ui/hero-image"
import { BrutalismCard } from "@/components/ui/brutalism-card"

export default function SusFitPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [leftCardImage, setLeftCardImage] = useState<string | null>(null)
  const [rightCardImage, setRightCardImage] = useState<string | null>(null)

  const handlePhotoCapture = () => {
    setIsCapturing(true)
    // Simulate photo capture
    setTimeout(() => {
      setIsCapturing(false)
      // In a real app, this would capture from camera
      setSelectedPhoto("/placeholder.svg?height=300&width=300")
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetPhoto = () => {
    setSelectedPhoto(null)
  }

  const handleLeftCardImageUpload = (imageUrl: string) => {
    setLeftCardImage(imageUrl)
  }

  const handleRightCardImageUpload = (imageUrl: string) => {
    setRightCardImage(imageUrl)
  }

  return (
    <div className="min-h-screen bg-[var(--color-susfit-yellow-500)]">
      {/* Header */}
      <header className="px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1
            className="title"
          >
            The Sus Fit
          </h1>
          <p className="text-lg text-[#000000] mb-4">we be doin' the most</p>
          <p className="text-sm text-[#000000]"> THE PRODUCT GROUP</p>
        </div>
      </header>

      {/* ticker */}
      <SaucyTicker/>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto px-8 py-12 relative">
        <div className="flex flex-col  justify-center items-center relative space-y-8 lg:space-y-0">

            {/* Hero Image as background */}
            <div className="absolute inset-0 flex justify-center items-center overflow-hidden z-0">
                <HeroImage
                    src="/images/PolaroidCamera.png"
                    alt="Hero Image"
                    className="w-[210%] max-w-none object-contain transform-gpu scale-150"
                />
            </div>

            <div className="flex flex-col   relative z-10 w-[100%]  h-[100%] max-w-6xl">
                {/* Content container with z-index to float above background */}
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

                {/* Side Elements */}
                <div className="flex flex-col md:flex-row justify-between items-center mt-8 space-y-4 md:space-y-0">
                  {/* Left Side - Video Button */}
                  <div className="flex flex-col items-center">
                    <button className="w-16 h-16 bg-[#f9f8f8] border-1 border-[#000000] rounded-lg flex items-center justify-center mb-2 hover:bg-[#000000] hover:text-[#f9f8f8] transition-colors group">
                      <Play className="w-8 h-8 text-[#000000] group-hover:text-[#f9f8f8] fill-current" />
                    </button>
                    <span className="text-sm text-[#000000]">How you do this?</span>
                  </div>

                  {/* Right Side - Snap Button */}
                  <div className="flex space-x-4">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload">
                      <Button
                        className="bg-[#f9f8f8] text-[#000000] border-1 border-[#000000] rounded-full px-6 py-2 hover:bg-[#000000] hover:text-[#f9f8f8] cursor-pointer"
                        variant="outline"
                        asChild
                      >
                        <span className="flex items-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </span>
                      </Button>
                    </label>
                    <Button
                      className="bg-[#f9f8f8] text-[#000000] border-1 border-[#000000] rounded-full px-6 py-2 hover:bg-[#000000] hover:text-[#f9f8f8]"
                      variant="outline"
                      onClick={handlePhotoCapture}
                      disabled={isCapturing}
                    >
                      {isCapturing ? "Capturing..." : "Snap-a-Stunt"}
                    </Button>
                  </div>
                </div>

                {/* Bottom Photo Frame */}
                <div className="flex justify-center mt-12">
                  {/* <Card className="w-96 h-96 bg-[#f9f8f8] border-2 border-[#000000] p-8 relative">
                    {selectedPhoto ? (
                      <div className="w-full h-full relative">
                        <img
                          src={selectedPhoto || "/placeholder.svg"}
                          alt="Captured photo"
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          onClick={resetPhoto}
                          className="absolute top-2 right-2 w-8 h-8 bg-[#000000] text-[#f9f8f8] rounded-full flex items-center justify-center hover:bg-[#f9f8f8] hover:text-[#000000] border-2 border-[#000000] transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative">
                          <div className="w-12 h-12 bg-[#000000] rounded-full absolute -top-8 left-16"></div>
                          <div
                            className="w-48 h-32 bg-[#000000] rounded-3xl transition-transform hover:scale-105"
                            style={{
                              borderRadius: "50% 30% 50% 30%",
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </Card> */}
                </div>
            </div>
         </div>
      </main>

      {/* Social Media Footer */}
      <footer className="flex justify-center py-8">
        <div className="flex space-x-4 bg-[#f9f8f8] border-1 border-[#000000] rounded-full px-6 py-3">
          {/* <a
            href="#"
            className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Instagram className="w-6 h-6 text-white" />
          </a>
          <a
            href="#"
            className="w-12 h-12 bg-[#4460a0] rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Facebook className="w-6 h-6 text-white" />
          </a> */}
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
        <p className="text-sm text-[#000000]"> THE PRODUCT GROUP</p>
      </div>
    </div>
  )
}
