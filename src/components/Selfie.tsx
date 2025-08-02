'use client';

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { requestAnime, TimeoutError } from '@/utils/animeRequest';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { downloadImage } from '@/utils/downloadImage';
import { useToast } from '@/hooks/use-toast';
import { stopMediaStream as stopMediaStreamUtil } from '@/utils/stopMediaStream';
import { resetImageState } from '@/utils/resetImageState';
import { useRestartCamera } from '@/hooks/useRestartCamera';

// Button state constants for reuse in future subtasks
export const BUTTON_STATES = {
  INITIAL: {
    take: { disabled: false, variant: 'default' as const },
    download: { disabled: true, variant: 'secondary' as const },
    retake: { disabled: true, variant: 'secondary' as const },
    generate: { disabled: true, variant: 'secondary' as const }
  },
  AFTER_CAPTURE: {
    take: { disabled: true, variant: 'secondary' as const },
    download: { disabled: false, variant: 'default' as const },
    retake: { disabled: false, variant: 'default' as const },
    generate: { disabled: false, variant: 'default' as const }
  }
} as const;

// Define the ref interface for external access
export interface SelfieRef {
  resetCamera: () => Promise<void>;
}

// Define props interface for the component
interface SelfieProps {
  onSelect?: (type: 'anime' | 'original') => void;
}

const Selfie = forwardRef<SelfieRef, SelfieProps>((props, ref) => {
  // React refs for video and stream handling
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Toast hook for notifications
  const { toast } = useToast();
  
  // Custom hook for restarting camera
  const restartCamera = useRestartCamera(videoRef as React.RefObject<HTMLVideoElement>);
  
  // Error state for camera access issues
  const [camError, setCamError] = useState<string | null>(null);
  
  // Selfie state for captured image data
  const [selfieBlob, setSelfieBlob] = useState<Blob | undefined>(undefined);
  const [selfieUrl, setSelfieUrl] = useState<string>('');
  
  // Anime state for generated image data
  const [animeUrl, setAnimeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Zoom state for image zoom functionality
  const [selfieZoomed, setSelfieZoomed] = useState(false);
  const [animeZoomed, setAnimeZoomed] = useState(false);
  
  // Flag to prevent multiple cleanup operations
  const cleanupRef = useRef<boolean>(false);
  
  // Ref to track previous selfie URL for cleanup
  const prevSelfieUrlRef = useRef<string>('');

  // Zoom toggle functions
  const toggleSelfieZoom = () => {
    setSelfieZoomed(prev => !prev);
  };

  const toggleAnimeZoom = () => {
    setAnimeZoomed(prev => !prev);
  };

  // Manage body overflow when zoomed
  useEffect(() => {
    if (selfieZoomed || animeZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [selfieZoomed, animeZoomed]);

  // Get current button states based on selfie capture status and loading state
  const getButtonStates = () => {
    const baseStates = selfieUrl ? BUTTON_STATES.AFTER_CAPTURE : BUTTON_STATES.INITIAL;
    
    // If loading, disable most buttons but keep retake enabled to allow cancellation
    if (loading) {
      return {
        take: { disabled: true, variant: 'secondary' as const },
        download: { disabled: true, variant: 'secondary' as const },
        retake: { disabled: false, variant: 'default' as const }, // Allow retake during loading
        generate: { disabled: true, variant: 'secondary' as const }
      };
    }
    
    // Override generate button state based on selfieBlob availability
    const states = { ...baseStates };
    if (!selfieBlob) {
      states.generate = { disabled: true, variant: 'secondary' as const };
    }
    
    console.log('getButtonStates:', { 
      selfieUrl: !!selfieUrl, 
      selfieBlob: !!selfieBlob, 
      loading, 
      generateDisabled: states.generate.disabled 
    });
    
    return states;
  };

  // Function to handle download selection
  const handleDownload = (type: 'anime' | 'original') => {
    if (type === 'anime') {
      if (animeUrl) {
        downloadImage(animeUrl, 'anime-selfie.png');
      } else {
        toast({
          variant: "destructive",
          title: "No anime image available",
          description: "Please generate an anime portrait first.",
        });
      }
    } else {
      if (selfieUrl) {
        downloadImage(selfieUrl, 'original-selfie.png');
      } else {
        toast({
          variant: "destructive",
          title: "No original image available",
          description: "Please take a selfie first.",
        });
      }
    }
  };

  // Function to handle retake button click
  const onRetakeClick = async () => {
    try {
      // 1) Stop current MediaStream and clean up video element using imported utility
      stopMediaStreamUtil(streamRef.current, videoRef.current);
      
      // 2) Reset image state (revoke object URLs and clear React state)
      resetImageState({
        selfieUrl,
        animeUrl,
        setters: {
          setSelfieUrl: () => setSelfieUrl(''),
          setAnimeUrl: () => setAnimeUrl(''),
          setSelfieBlob: () => setSelfieBlob(undefined)
          // setAnimeBlob is optional and not needed in this component
        }
      });
      
      // 3) Clear any errors
      setError(undefined);
      setCamError(null);
      
      // 4) Restart camera stream with proper waiting
      await restartCamera();
      
      // 5) Update stream reference to match the new stream
      if (videoRef.current && videoRef.current.srcObject) {
        streamRef.current = videoRef.current.srcObject as MediaStream;
      }
      
      // 6) Reset button states to initial values
      // This is handled automatically by getButtonStates() based on selfieUrl being empty
      
      console.log('Retake completed: MediaStream stopped, state reset, camera restarted');
    } catch (error) {
      console.error('Error during retake:', error);
      setCamError('Failed to restart camera. Please refresh the page and try again.');
      toast({
        variant: "destructive",
        title: "Retake failed",
        description: "Unable to restart camera. Please refresh the page and try again.",
      });
    }
  };

  // Function to capture selfie from video stream
  const onTakeClick = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current;
      if (!video || !video.srcObject) {
        console.error('Video element or stream not available');
        reject(new Error('Video element or stream not available'));
        return;
      }

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // If video dimensions are not available, try to get them from the stream
    let finalWidth = videoWidth;
    let finalHeight = videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.log('Video dimensions not available, using fallback dimensions');
      // Use fallback dimensions for testing or when video hasn't loaded yet
      finalWidth = 640;
      finalHeight = 480;
    }
    
    console.log('Video dimensions:', finalWidth, finalHeight);

    // Create off-screen canvas with video dimensions
    const canvas = document.createElement('canvas');
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    
      // Get 2D context (willReadFrequently: false for better performance)
      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) {
        console.error('Failed to get canvas context');
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, finalWidth, finalHeight);
      
      // Convert canvas to blob with high-quality JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Store blob in React state
            setSelfieBlob(blob);
            
            // Create object URL and store in React state
            const objectUrl = URL.createObjectURL(blob);
            setSelfieUrl(objectUrl);
            
            console.log('Selfie captured and stored:', { 
              blobSize: blob.size, 
              blobType: blob.type,
              objectUrl 
            });
          } else {
            console.error('Failed to create blob from canvas');
          }
          
          // Canvas reference is automatically cleaned up by garbage collection
          // after blob generation completes
        },
        'image/jpeg', // MIME type
        0.95 // Quality (0.95 = 95% quality)
      );
    });
  };

  // Function to stop all MediaStream tracks safely
  const stopMediaStream = () => {
    if (streamRef.current && !cleanupRef.current) {
      cleanupRef.current = true;
      
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          // Check if track is still active before stopping
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      } catch (error) {
        console.error('Error stopping MediaStream tracks:', error);
      } finally {
        streamRef.current = null;
        cleanupRef.current = false;
      }
    }
  };

  // Function to reset camera (for retake functionality)
  const resetCamera = async () => {
    // Stop current stream
    stopMediaStream();
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear any errors
    setCamError(null);
    
    // Reset cleanup flag
    cleanupRef.current = false;
    
    // Request new camera access
    await requestCameraAccess();
  };

  // Expose resetCamera function via ref
  useImperativeHandle(ref, () => ({
    resetCamera
  }), []);

  // Function to request camera access
  const requestCameraAccess = async () => {
    try {
      // Clear any previous errors
      setCamError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      // Store stream reference
      streamRef.current = stream;
      
      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Handle autoplay with fallback for iOS
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // iOS autoplay fallback - user will need to tap to start
            console.log('Autoplay prevented, user interaction required');
          });
        }
        
        // Use onloadedmetadata for older Safari compatibility
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {
              console.log('Playback failed after metadata loaded');
            });
          }
        };
      }
    } catch (error: unknown) {
      console.error('Camera access error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCamError('Camera access denied. Please allow camera permissions to use this feature.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCamError('No camera found. Please connect a camera and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setCamError('Camera is already in use by another application. Please close other camera apps and try again.');
        } else {
          setCamError('Unable to access camera. Please check your device settings and try again.');
        }
      } else {
        setCamError('Unable to access camera. Please check your device settings and try again.');
      }
    }
  };

  // Function to generate anime from selfie
  const onGenerateAnime = async () => {
    console.log('onGenerateAnime called, selfieBlob exists:', !!selfieBlob);
    if (!selfieBlob) return;
    
    console.log('onGenerateAnime proceeding, setting loading to true');
    
    // Set loading state immediately when button is clicked
    setLoading(true);
    setError(undefined);
    setAnimeUrl('');
    
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      console.log('Calling requestAnime...');
      const url = await requestAnime(selfieBlob, controller.signal);
      console.log('requestAnime succeeded, setting animeUrl');
      setAnimeUrl(url);
    } catch (err) {
      console.log('requestAnime failed:', err);
      if (err instanceof TimeoutError) {
        setError('Anime generation timed out. Please try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred.');
      }
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Set up video attributes and request camera access
  useEffect(() => {
    const setupVideo = async () => {
      // Set up video attributes for iOS compatibility
      if (videoRef.current) {
        videoRef.current.setAttribute('playsInline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
      }

      // Request camera access
      await requestCameraAccess();
    };

    setupVideo();

    // Cleanup function to stop tracks when component unmounts
    return () => {
      stopMediaStreamUtil(streamRef.current, videoRef.current);
    };
  }, []);

  // Cleanup object URLs when selfieUrl changes or component unmounts
  useEffect(() => {
    // Clean up previous URL when selfieUrl changes
    if (prevSelfieUrlRef.current && prevSelfieUrlRef.current !== selfieUrl) {
      URL.revokeObjectURL(prevSelfieUrlRef.current);
      console.log('Previous object URL revoked:', prevSelfieUrlRef.current);
    }
    
    // Update the ref to track current URL
    prevSelfieUrlRef.current = selfieUrl;
    
    // Cleanup function for component unmount
    return () => {
      if (selfieUrl) {
        URL.revokeObjectURL(selfieUrl);
        console.log('Object URL revoked on component unmount:', selfieUrl);
      }
    };
  }, [selfieUrl]);

  // Ensure video is playing when selfieUrl is cleared (retake scenario)
  useEffect(() => {
    if (!selfieUrl && videoRef.current && streamRef.current) {
      // When selfie is cleared, ensure video is playing
      const ensureVideoPlaying = () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log('Video play failed in useEffect:', error);
            });
          }
        }
      };
      
      // Small delay to ensure DOM update completes
      setTimeout(ensureVideoPlaying, 50);
    }
  }, [selfieUrl]);

  return (
    <section className="flex flex-col items-center justify-center w-full h-full gap-4 p-4 relative" role="group" aria-label="Selfie comparison">
      {/* Error Alert */}
      {camError && (
        <Alert variant="destructive" className="w-full max-w-sm md:max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{camError}</span>
            <Button 
              onClick={requestCameraAccess}
              size="sm"
              variant="outline"
              className="w-fit"
            >
              Retry Camera Access
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {/* Anime Error Alert */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-sm md:max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Spinner overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-50" data-testid="spinner-container">
          <Loader2 data-testid="spinner" className="animate-spin w-12 h-12 text-primary" />
        </div>
      )}
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'white', padding: '10px', border: '1px solid black', zIndex: 9999 }}>
          Loading: {loading ? 'true' : 'false'}
        </div>
      )}
      {/* Selfie or video preview */}
      {selfieUrl ? (
        <figure>
          <img 
            src={selfieUrl}
            alt="Captured selfie preview"
            className="rounded-lg w-full h-auto max-w-sm md:max-w-md bg-black"
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Preview</figcaption>
        </figure>
      ) : (
        <figure>
          <video 
            ref={videoRef}
            id="camera-stream" 
            className="rounded-lg w-full h-auto max-w-sm md:max-w-md bg-black"
            playsInline
            muted
            aria-label="Camera stream for taking selfie"
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Camera Stream</figcaption>
        </figure>
      )}
      <Card>
        <CardContent>
          <div id="result-wrapper" className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <figure>
              {selfieUrl ? (
                <img 
                  id="selfie-img" 
                  className={`aspect-square object-cover rounded-lg w-full h-auto max-w-sm md:max-w-md zoomable ${selfieZoomed ? 'zoomed' : ''}`}
                  src={selfieUrl} 
                  alt="Original captured selfie"
                  onClick={toggleSelfieZoom}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSelfieZoom();
                    }
                  }}
                />
              ) : (
                <img 
                  id="selfie-img" 
                  className="aspect-square object-cover rounded-lg w-full h-auto max-w-sm md:max-w-md"
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzExNi41NjkgMTMwIDEzMCAxMTYuNTY5IDEzMCAxMDBDMTMwIDgzLjQzMTUgMTE2LjU2OSA3MCAxMDAgNzBDODMuNDMxNSA3MCA3MCA4My40MzE1IDcwIDEwMEM3MCAxMTYuNTY5IDgzLjQzMTUgMTMwIDEwMCAxMzBaIiBmaWxsPSIjRDlEQ0YwIi8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzEwNS41MjMgMTEwIDExMCAxMDUuNTIzIDExMCAxMDBDMTEwIDk0LjQ3NzIgMTA1LjUyMyA5MCAxMDAgOTBDOTQuNDc3MiA5MCA5MCA5NC40NzcyIDkwIDEwMEM5MCAxMDUuNTIzIDk0LjQ3NzIgMTEwIDEwMCAxMTBaIiBmaWxsPSIjOUI5QkEwIi8+Cjwvc3ZnPgo="
                  alt="No selfie captured yet"
                  role="button"
                  tabIndex={0}
                  onClick={toggleSelfieZoom}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSelfieZoom();
                    }
                  }}
                />
              )}
              {selfieUrl && (
                <figcaption className="text-center text-sm text-gray-500 mt-2">Original</figcaption>
              )}
            </figure>
            <figure>
              {animeUrl ? (
                <img 
                  id="anime-img" 
                  className={`aspect-square object-cover rounded-lg w-full h-auto max-w-sm md:max-w-md zoomable ${animeZoomed ? 'zoomed' : ''}`}
                  src={animeUrl} 
                  alt="Anime portrait generated from selfie"
                  onClick={toggleAnimeZoom}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAnimeZoom();
                    }
                  }}
                />
              ) : (
                <img 
                  id="anime-img" 
                  className="aspect-square object-cover rounded-lg w-full h-auto max-w-sm md:max-w-md"
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzExNi41NjkgMTMwIDEzMCAxMTYuNTY5IDEzMCAxMDBDMTMwIDgzLjQzMTUgMTE2LjU2OSA3MCAxMDAgNzBDODMuNDMxNSA3MCA3MCA4My40MzE1IDcwIDEwMEM3MCAxMTYuNTY5IDgzLjQzMTUgMTMwIDEwMCAxMzBaIiBmaWxsPSIjRkY5OENGIi8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzEwNS41MjMgMTEwIDExMCAxMDUuNTIzIDExMCAxMDBDMTEwIDk0LjQ3NzIgMTA1LjUyMyA5MCAxMDAgOTBDOTQuNDc3MiA5MCA5MCA5NC40NzcyIDkwIDEwMEM5MCAxMDUuNTIzIDk0LjQ3NzIgMTEwIDEwMCAxMTBaIiBmaWxsPSIjRkY2QjM1Ii8+Cjwvc3ZnPgo="
                  alt="Anime portrait not yet generated"
                  role="button"
                  tabIndex={0}
                  onClick={toggleAnimeZoom}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleAnimeZoom();
                    }
                  }}
                />
              )}
              {animeUrl && (
                <figcaption className="text-center text-sm text-gray-500 mt-2">Anime</figcaption>
              )}
            </figure>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button 
          id="take-btn" 
          aria-label="Take photo"
          disabled={getButtonStates().take.disabled}
          variant={getButtonStates().take.variant}
          aria-live="polite"
          onClick={onTakeClick}
        >
          Take
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              id="download-btn" 
              aria-label="Download"
              disabled={getButtonStates().download.disabled}
              variant={getButtonStates().download.variant}
              aria-live="polite"
            >
              Download
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => handleDownload('original')}
              aria-label="download-original"
              disabled={!selfieUrl}
            >
              Download Original
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDownload('anime')}
              aria-label="download-anime"
              disabled={!animeUrl}
            >
              Download Anime
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          id="retake-btn" 
          aria-label="Retake"
          disabled={getButtonStates().retake.disabled}
          variant={getButtonStates().retake.variant}
          aria-live="polite"
          onClick={onRetakeClick}
        >
          Retake
        </Button>
        {/* Generate Anime Button */}
        <Button
          id="generate-anime-btn"
          aria-label="Generate anime portrait"
          disabled={getButtonStates().generate.disabled}
          variant={getButtonStates().generate.variant}
          onClick={onGenerateAnime}
          aria-busy={loading}
          data-testid="generate-anime-btn"
          data-selfie-blob={selfieBlob ? 'exists' : 'missing'}
          data-loading={loading ? 'true' : 'false'}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4 mr-2" data-testid="spinner" />
              Generating...
            </>
          ) : (
            'Generate Anime'
          )}
        </Button>
      </div>
    </section>
  );
});

Selfie.displayName = 'Selfie';

export default Selfie; 