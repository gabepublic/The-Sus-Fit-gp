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
      
      {/* Hero Image Section */}
      <HeroImage src="/images/PolaroidCamera.png" alt="Hero Image" />
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-12 relative">
        <div className="flex flex-col lg:flex-row justify-center items-center relative space-y-8 lg:space-y-0">
          {/* Left Photo Frame */}
          <div className="relative -rotate-3 lg:-rotate-12 lg:mr-8">
            <BrutalismCard className="w-64 h-64 bg-[#f9f8f8] border-2 border-[#000000] p-4 relative">
              <span className="absolute -top-6 left-4 text-sm text-[#000000] rotate-3 lg:rotate-12">My angle</span>
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-[#000000] rounded-full absolute top-4 left-4"></div>
                  <div
                    className="w-32 h-24 bg-[#000000] rounded-3xl mt-12 transition-transform hover:scale-105"
                    style={{
                      borderRadius: "50% 20% 50% 20%",
                    }}
                  ></div>
                </div>
              </div>
            </BrutalismCard>
          </div>

          {/* Camera Device */}


          {/* Right Photo Frame */}
          <div className="relative rotate-3 lg:rotate-12 lg:ml-8">
            {/* <Card className="w-64 h-64 bg-[#f9f8f8] border-2 border-[#000000] p-4 relative">
              <span className="absolute -top-6 right-4 text-sm text-[#000000] -rotate-3 lg:-rotate-12">My fit</span>
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  <div className="w-8 h-8 bg-[#000000] rounded-full absolute top-4 right-4"></div>
                  <div
                    className="w-32 h-24 bg-[#000000] rounded-3xl mt-12 transition-transform hover:scale-105"
                    style={{
                      borderRadius: "20% 50% 20% 50%",
                    }}
                  ></div>
                </div>
              </div>
            </Card> */}
          </div>
        </div>

        {/* Side Elements */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-8 space-y-4 md:space-y-0">
          {/* Left Side - Video Button */}
          <div className="flex flex-col items-center">
            <button className="w-16 h-16 bg-[#f9f8f8] border-2 border-[#000000] rounded-lg flex items-center justify-center mb-2 hover:bg-[#000000] hover:text-[#f9f8f8] transition-colors group">
              <Play className="w-8 h-8 text-[#000000] group-hover:text-[#f9f8f8] fill-current" />
            </button>
            <span className="text-sm text-[#000000]">How you do this?</span>
          </div>

          {/* Right Side - Snap Button */}
          <div className="flex space-x-4">
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload">
              <Button
                className="bg-[#f9f8f8] text-[#000000] border-2 border-[#000000] rounded-full px-6 py-2 hover:bg-[#000000] hover:text-[#f9f8f8] cursor-pointer"
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
              className="bg-[#f9f8f8] text-[#000000] border-2 border-[#000000] rounded-full px-6 py-2 hover:bg-[#000000] hover:text-[#f9f8f8]"
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
      </main>

      {/* Social Media Footer */}
      <footer className="flex justify-center py-8">
        <div className="flex space-x-4 bg-[#f9f8f8] border-2 border-[#000000] rounded-full px-6 py-3">
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
            className="w-12 h-12 bg-[#f9f8f8] border-2 border-[#000000] rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
          >
            <div className="w-6 h-6 border-2 border-[#000000] rounded-full"></div>
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
