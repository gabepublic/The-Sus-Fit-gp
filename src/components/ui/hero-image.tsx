"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface HeroImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function HeroImage({ 
  src, 
  alt, 
  className,
  priority = true 
}: HeroImageProps) {
  return (
    <div className={cn(
      "relative w-full flex items-center justify-center",
      "h-[50vh] min-h-[400px] max-h-[800px]",
      className
    )}>
      <div className="relative w-full h-full max-w-5xl">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-contain drop-shadow-2xl"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
        />
      </div>
    </div>
  )
}
