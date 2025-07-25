"use client"

import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"
import { useState, useId } from "react"

interface BrutalismCardProps {
  className?: string
  title?: string
  children?: React.ReactNode
  buttonPosition?: "left" | "right"
  backgroundImage?: string
  shadowRotation?: string
  onImageUpload?: (imageUrl: string) => void
}

export function BrutalismCard({
  className,
  title = "Upload Your Angle",
  children,
  buttonPosition = "left",
  backgroundImage = '/images/zestyVogueColor.jpg',
  shadowRotation = "rotate-0",
  onImageUpload
}: BrutalismCardProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputId = useId()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setUploadedImage(imageUrl)
        if (onImageUpload) {
          onImageUpload(imageUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setUploadedImage(imageUrl)
        if (onImageUpload) {
          onImageUpload(imageUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={cn("relative group p-10", className)}>
      {/* Shadow layers - creating the brutalism offset effect */}
      <div className={cn("absolute top-8 left-[9%] w-[91%] h-[93%] bg-[var(--color-susfit-teal)] rounded-sm transform border-2 border-black", shadowRotation)} />
      {/* Main card */}
      <div
        className={cn(
          "relative bg-[#7BB3D9] border-2 border-black rounded-md p-4 transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1 h-full before:absolute before:inset-0",
          isDragging ? "border-dashed border-4 border-[var(--color-susfit-green)]" : "",
          !uploadedImage ? "before:bg-gradient-to-t before:from-white/30 before:via-black/10 before:to-white/20 before:backdrop-blur-[2px] before:rounded-md before:pointer-events-none" : ""
        )}
        style={{
          backgroundImage: uploadedImage ? `url('${uploadedImage}')` : `url('${backgroundImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          type="file"
          id={fileInputId}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Upload icon area - only show if no image uploaded */}
        {!uploadedImage && (
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 z-10">
            <div className="text-[var(--color-susfit-green)] text-6xl">
              <svg
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transform"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </div>
        )}

        {/* Children content */}
        {children}

        {/* Title bar button */}
        <div className={cn("absolute bottom-[15%] w-[calc(100%+16px)] transform",
          buttonPosition === "left" ? "-left-10" : "-right-14")}>
          <div className="relative">
            {/* Shadow/offset effect */}
            <div className={cn("absolute w-full h-full bg-[var(--color-susfit-teal)] rounded-md border-2 border-black",
              buttonPosition === "left" ? "-bottom-2 -right-2" : "-bottom-2 -left-2")} />
            {/* Main button */}
            <label
              htmlFor={fileInputId}
              className="relative w-full bg-[var(--color-susfit-pink)] border-2 border-black px-4 py-2 rounded-md font-bold text-black text-lg block text-center cursor-pointer"
            >
              {title}
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
