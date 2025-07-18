"use client"

import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

interface BrutalismCardProps {
  className?: string
  title?: string
  children?: React.ReactNode
}

export function BrutalismCard({ 
  className,
  title = "Upload Your Angle",
  children 
}: BrutalismCardProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* Shadow layers - creating the brutalism offset effect */}
      <div className="absolute top-2 left-2 w-full h-full bg-[var(--color-susfit-teal)] rounded-lg transform rotate-1" />
      
      {/* Main card */}
      <div className="relative bg-[#7BB3D9] border-4 border-black rounded-lg p-4 transform transition-transform group-hover:translate-x-1 group-hover:translate-y-1">
        {/* Upload icon area */}
        <div className="flex items-center justify-center mb-2 h-24">
          <div className="text-[var(--color-susfit-green)] text-6xl">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="transform rotate-12"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
        </div>
        
        {/* Title bar */}
        <div className="bg-[var(--color-susfit-pink)] border-2 border-black px-4 py-2 transform -rotate-1 relative">
          <span className="text-black font-bold text-lg">{title}</span>
        </div>
        
        {/* Additional content area */}
        {children}
      </div>
    </div>
  )
}
