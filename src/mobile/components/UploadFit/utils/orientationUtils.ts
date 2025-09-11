/**
 * @fileoverview Orientation Utilities for UploadFit
 * @module @/mobile/components/UploadFit/utils/orientationUtils
 * @version 1.0.0
 */

import type {
  ImageOrientation,
  AspectRatio
} from '../types';

import {
  IMAGE_ORIENTATION,
  PORTRAIT_REQUIREMENTS,
  detectImageOrientation,
  isPortraitOrientation,
  meetsPortraitRequirements
} from '../types';

/**
 * Calculates aspect ratio from dimensions
 * 
 * @param width Image width
 * @param height Image height
 * @returns Aspect ratio (width/height)
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  if (height === 0) return 0;
  return width / height;
};

/**
 * Formats aspect ratio as a readable string
 * 
 * @param aspectRatio Numeric aspect ratio
 * @param precision Number of decimal places
 * @returns Formatted aspect ratio string
 */
export const formatAspectRatio = (aspectRatio: number, precision: number = 2): string => {
  return aspectRatio.toFixed(precision);
};

/**
 * Converts aspect ratio to ratio string (e.g., "3:4")
 * 
 * @param aspectRatio Numeric aspect ratio
 * @returns Ratio string representation
 */
export const aspectRatioToString = (aspectRatio: number): AspectRatio => {
  // Common aspect ratios
  const commonRatios: Array<{ ratio: number; string: AspectRatio }> = [
    { ratio: 3/4, string: '3:4' },
    { ratio: 4/3, string: '4:3' },
    { ratio: 9/16, string: '9:16' },
    { ratio: 16/9, string: '16:9' },
    { ratio: 1/1, string: '1:1' },
    { ratio: 2/3, string: '2:3' },
    { ratio: 3/2, string: '3:2' }
  ];

  // Find closest match within tolerance
  const tolerance = 0.05;
  for (const { ratio, string } of commonRatios) {
    if (Math.abs(aspectRatio - ratio) < tolerance) {
      return string;
    }
  }

  // If no common ratio matches, create a custom ratio
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  // Convert to approximate integer ratio
  const width = Math.round(aspectRatio * 100);
  const height = 100;
  const divisor = gcd(width, height);
  
  return `${width / divisor}:${height / divisor}` as AspectRatio;
};

/**
 * Gets orientation-specific recommendations for fit uploads
 * 
 * @param orientation Current image orientation
 * @param aspectRatio Current aspect ratio
 * @returns Array of recommendation strings
 */
export const getOrientationRecommendations = (
  orientation: ImageOrientation,
  aspectRatio: number
): string[] => {
  const recommendations: string[] = [];

  switch (orientation) {
    case IMAGE_ORIENTATION.PORTRAIT:
      recommendations.push('Perfect! Portrait orientation is ideal for fit uploads');
      
      if (aspectRatio >= PORTRAIT_REQUIREMENTS.MIN_ASPECT_RATIO && 
          aspectRatio <= PORTRAIT_REQUIREMENTS.MAX_ASPECT_RATIO) {
        recommendations.push('Your image has an ideal aspect ratio for fit analysis');
      } else if (aspectRatio < PORTRAIT_REQUIREMENTS.MIN_ASPECT_RATIO) {
        recommendations.push('Your image is quite narrow - consider a slightly wider shot');
      } else if (aspectRatio > PORTRAIT_REQUIREMENTS.MAX_ASPECT_RATIO) {
        recommendations.push('Your image is close to square - a taller shot would be better');
      }
      break;

    case IMAGE_ORIENTATION.LANDSCAPE:
      recommendations.push('Consider rotating your image 90° for better fit analysis');
      recommendations.push('Portrait orientation captures your full outfit better');
      recommendations.push('Landscape images may crop important parts of your fit');
      break;

    case IMAGE_ORIENTATION.SQUARE:
      recommendations.push('Square images work, but portrait is preferred');
      recommendations.push('Try taking a taller photo to capture more of your outfit');
      break;
  }

  return recommendations;
};

/**
 * Gets fit-specific orientation tips
 * 
 * @param orientation Current image orientation
 * @returns Array of tip strings specific to fit uploads
 */
export const getFitOrientationTips = (orientation: ImageOrientation): string[] => {
  const tips: string[] = [];

  switch (orientation) {
    case IMAGE_ORIENTATION.PORTRAIT:
      tips.push('Great choice! Make sure your full outfit is visible from head to toe');
      tips.push('Step back if any part of your outfit is cut off');
      tips.push('Good lighting will help show the details of your fit');
      break;

    case IMAGE_ORIENTATION.LANDSCAPE:
      tips.push('Rotate your phone to portrait mode for better results');
      tips.push('Portrait orientation shows your complete outfit');
      tips.push('Full-body shots work best for fit analysis');
      break;

    case IMAGE_ORIENTATION.SQUARE:
      tips.push('Try stepping back to capture more of your outfit');
      tips.push('Portrait mode will show your fit better than square');
      tips.push('Make sure your full outfit is visible');
      break;
  }

  return tips;
};

/**
 * Checks if dimensions meet minimum requirements for fit uploads
 * 
 * @param width Image width
 * @param height Image height
 * @returns Object with requirement check results
 */
export const checkFitUploadRequirements = (width: number, height: number) => {
  const aspectRatio = calculateAspectRatio(width, height);
  const orientation = detectImageOrientation(width, height);
  const meetsPortrait = meetsPortraitRequirements(width, height);
  
  return {
    width,
    height,
    aspectRatio,
    orientation,
    isPortrait: isPortraitOrientation(orientation),
    meetsMinWidth: width >= PORTRAIT_REQUIREMENTS.MIN_WIDTH,
    meetsMinHeight: height >= PORTRAIT_REQUIREMENTS.MIN_HEIGHT,
    meetsAspectRatio: aspectRatio >= PORTRAIT_REQUIREMENTS.MIN_ASPECT_RATIO && 
                     aspectRatio <= PORTRAIT_REQUIREMENTS.MAX_ASPECT_RATIO,
    meetsAllRequirements: meetsPortrait,
    recommendations: getOrientationRecommendations(orientation, aspectRatio),
    tips: getFitOrientationTips(orientation)
  };
};

/**
 * Suggests optimal crop dimensions for fit uploads
 * 
 * @param width Current image width
 * @param height Current image height
 * @returns Suggested crop dimensions
 */
export const suggestOptimalCrop = (width: number, height: number) => {
  const currentRatio = calculateAspectRatio(width, height);
  const targetRatio = PORTRAIT_REQUIREMENTS.PREFERRED_ASPECT_RATIO;

  if (currentRatio > targetRatio) {
    // Image is too wide, suggest reducing width
    const newWidth = Math.round(height * targetRatio);
    const cropX = Math.round((width - newWidth) / 2);
    
    return {
      shouldCrop: true,
      cropType: 'width',
      newDimensions: { width: newWidth, height },
      cropOffset: { x: cropX, y: 0 },
      recommendation: 'Consider cropping the sides to focus on your outfit'
    };
  } else if (currentRatio < targetRatio) {
    // Image is too narrow, suggest reducing height
    const newHeight = Math.round(width / targetRatio);
    const cropY = Math.round((height - newHeight) / 2);
    
    return {
      shouldCrop: true,
      cropType: 'height',
      newDimensions: { width, height: newHeight },
      cropOffset: { x: 0, y: cropY },
      recommendation: 'Consider cropping the top/bottom to improve proportions'
    };
  }

  return {
    shouldCrop: false,
    cropType: null,
    newDimensions: { width, height },
    cropOffset: { x: 0, y: 0 },
    recommendation: 'Your image proportions are already ideal!'
  };
};

/**
 * Gets device orientation recommendations
 * 
 * @returns Array of device-specific tips
 */
export const getDeviceOrientationTips = (): string[] => {
  return [
    'Hold your phone vertically (portrait mode) for best results',
    'Make sure you have enough space to capture your full outfit',
    'Step back or ask someone else to take the photo if needed',
    'Use the rear camera for better image quality',
    'Ensure good lighting - natural light works best'
  ];
};

/**
 * Validates orientation against specific requirements
 * 
 * @param orientation Image orientation
 * @param requirements Custom requirements object
 * @returns Validation result with specific feedback
 */
export const validateOrientationRequirements = (
  orientation: ImageOrientation,
  requirements: {
    allowedOrientations?: ImageOrientation[];
    enforcePortrait?: boolean;
    preferredRatio?: number;
  } = {}
) => {
  const {
    allowedOrientations = [IMAGE_ORIENTATION.PORTRAIT],
    enforcePortrait = true,
    preferredRatio = PORTRAIT_REQUIREMENTS.PREFERRED_ASPECT_RATIO
  } = requirements;

  const isAllowed = allowedOrientations.includes(orientation);
  const isPortraitRequired = enforcePortrait && orientation !== IMAGE_ORIENTATION.PORTRAIT;
  
  return {
    isValid: isAllowed && !isPortraitRequired,
    orientation,
    isAllowed,
    violatesPortraitRequirement: isPortraitRequired,
    feedback: isAllowed 
      ? getOrientationRecommendations(orientation, preferredRatio)
      : [`Orientation "${orientation}" is not allowed. Allowed: ${allowedOrientations.join(', ')}`],
    tips: getFitOrientationTips(orientation)
  };
};