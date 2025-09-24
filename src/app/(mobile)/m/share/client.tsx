'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SharingView } from '@/mobile/components/Share/SharingView';
import type { SharePlatform } from '@/mobile/components/Share/ShareButton.types';

interface ShareViewClientProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}


/**
 * ShareViewClient Component
 *
 * This is the main client-side component for the sharing view. It handles:
 * - Retrieving shared image data from URL parameters or session storage
 * - Displaying the generated try-on image in a PhotoFrame
 * - Managing error states when no image is available
 * - Preparing for future share button integration
 *
 * The component follows the brutalist design system with yellow backgrounds
 * and will integrate with share buttons in subsequent tasks.
 *
 * @param props.searchParams - URL search parameters that may contain image data
 * @returns JSX element for the sharing view
 */
export default function ShareViewClient({ searchParams }: ShareViewClientProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load shared image from various sources
   * Priority order:
   * 1. URL search parameters (imageUrl)
   * 2. Session storage (generatedImage from Try It On workflow)
   * 3. Local storage fallback
   */
  const loadSharedImage = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Check URL parameters first
      const imageFromUrl = urlSearchParams.get('imageUrl') || searchParams?.imageUrl;
      if (imageFromUrl && typeof imageFromUrl === 'string') {
        setImageUrl(imageFromUrl);
        setIsLoading(false);
        return;
      }

      // Check session storage for generated image from Try It On workflow
      if (typeof window !== 'undefined') {
        console.log('🔍 ShareView: Looking for image in sessionStorage...');
        const sessionImage = sessionStorage.getItem('generatedImage');
        console.log('📱 SessionStorage generatedImage:', sessionImage);
        if (sessionImage) {
          try {
            const parsedImage = JSON.parse(sessionImage);
            console.log('🎯 Parsed image:', parsedImage);
            if (parsedImage && typeof parsedImage === 'string') {
              console.log('✅ ShareView: Image found in sessionStorage:', parsedImage.substring(0, 50) + '...');
              setImageUrl(parsedImage);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse session storage image:', parseError);
          }
        } else {
          console.log('❌ ShareView: No generatedImage in sessionStorage');
        }

        // Fallback to localStorage
        const localImage = localStorage.getItem('lastGeneratedImage');
        if (localImage) {
          setImageUrl(localImage);
          setIsLoading(false);
          return;
        }
      }

      // No image found
      setError('No image available to share. Please generate a try-on first.');
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading shared image:', err);
      setError('Failed to load image for sharing.');
      setIsLoading(false);
    }
  }, [urlSearchParams, searchParams]);

  /**
   * Handle navigation back to Try It On view when no image is available
   */
  const handleBackToTryOn = useCallback(() => {
    router.push('/m/tryon');
  }, [router]);

  /**
   * Handle image load success
   */
  const handleImageLoad = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle image load error
   */
  const handleImageError = useCallback(() => {
    setError('Failed to load image. Please try generating a new try-on.');
  }, []);

  /**
   * Retry loading the image
   */
  const handleRetry = useCallback(() => {
    loadSharedImage();
  }, [loadSharedImage]);

  /**
   * Handle sharing start
   */
  const handleShareStart = useCallback((platform: SharePlatform) => {
    console.log(`Starting share to ${platform}`);
  }, []);

  /**
   * Handle sharing success
   */
  const handleShareComplete = useCallback((platform: SharePlatform, success: boolean) => {
    if (success) {
      console.log(`Successfully shared to ${platform}`);
    } else {
      console.log(`Failed to share to ${platform}`);
    }
  }, []);

  /**
   * Handle sharing error
   */
  const handleShareError = useCallback((platform: SharePlatform, error: string) => {
    console.error(`Share error for ${platform}:`, error);
  }, []);

  // Load image on component mount
  useEffect(() => {
    loadSharedImage();
  }, [loadSharedImage]);

  /**
   * Set and clean up background colors to match Upload Fit pattern
   */
  useEffect(() => {
    // Store original backgrounds for cleanup
    const originalBodyBackground = document.body.style.backgroundColor || '';
    const originalBodyBackgroundImage = document.body.style.backgroundImage || '';
    const mobileLayout = document.querySelector('.mobile-layout') as HTMLElement;
    const mobileHeader = document.querySelector('.mobile-header') as HTMLElement;
    const originalLayoutBackground = mobileLayout?.style.backgroundColor || '';
    const originalHeaderBackground = mobileHeader?.style.backgroundColor || '';
    const originalHeaderBorder = mobileHeader?.style.borderBottom || '';

    // Set yellow background for Share View to match Upload views
    document.body.style.backgroundColor = '#faba01'; // Yellow background
    document.body.style.backgroundImage = 'none';

    if (mobileLayout) {
      mobileLayout.style.backgroundColor = 'transparent';
    }

    if (mobileHeader) {
      mobileHeader.style.backgroundColor = 'transparent';
      mobileHeader.style.backdropFilter = 'none';
      mobileHeader.style.borderBottom = 'none';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.backgroundColor = originalBodyBackground;
      document.body.style.backgroundImage = originalBodyBackgroundImage;
      if (mobileLayout) {
        mobileLayout.style.backgroundColor = originalLayoutBackground;
      }
      if (mobileHeader) {
        mobileHeader.style.backgroundColor = originalHeaderBackground;
        mobileHeader.style.backdropFilter = '';
        mobileHeader.style.borderBottom = originalHeaderBorder;
      }
    };
  }, []);

  return (
    <>
      {error && !imageUrl ? (
        // Error state - no image to share
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#faba01',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: '"Courier New", monospace',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '400px',
            padding: '40px 20px',
            backgroundColor: '#fff',
            border: '3px solid #000',
            boxShadow: '8px 8px 0px #FF69B4'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              margin: '0 0 20px 0',
              textShadow: '2px 2px 0px #FF69B4'
            }}>
              No Image to Share
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#D32F2F',
              marginBottom: '30px',
              fontWeight: 'bold'
            }}>
              {error}
            </p>
            <button
              style={{
                backgroundColor: '#000',
                color: '#faba01',
                border: '3px solid #000',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                letterSpacing: '1px',
                boxShadow: '5px 5px 0px #FF69B4'
              }}
              onClick={handleBackToTryOn}
              type="button"
            >
              Try It On First
            </button>
          </div>
        </div>
      ) : (
        // Normal state - display SharingView with image and sharing options
        <SharingView
          imageUrl={imageUrl}
          imageAlt="Your virtual try-on result"
          loading={isLoading}
          error={error || undefined}
          shareData={{
            title: 'My Virtual Try-On Result',
            description: 'Check out my virtual try-on!',
            hashtags: ['fashion', 'style', 'tryon', 'virtualfashion']
          }}
          onImageLoad={handleImageLoad}
          onImageError={handleImageError}
          onRetry={handleRetry}
          onShareStart={handleShareStart}
          onShareComplete={handleShareComplete}
          onShareError={handleShareError}
          testId="share-view"
        />
      )}
    </>
  );
}