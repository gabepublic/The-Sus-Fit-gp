'use client';

import React from 'react';
import type { 
  FeatureFlagContextValue
} from '../types/featureFlag.types';

// Create the Feature Flag Context
export const FeatureFlagContext = React.createContext<FeatureFlagContextValue | null>(null);

// Context display name for debugging
FeatureFlagContext.displayName = 'FeatureFlagContext';

// Hook to use the feature flag context
export const useFeatureFlagContext = (): FeatureFlagContextValue => {
  const context = React.useContext(FeatureFlagContext);
  
  if (!context) {
    throw new Error(
      'useFeatureFlagContext must be used within a FeatureFlagProvider. ' +
      'Make sure to wrap your component tree with <FeatureFlagProvider>.'
    );
  }
  
  return context;
};

// Utility hook to check if context is available (for optional usage)
export const useFeatureFlagContextOptional = (): FeatureFlagContextValue | null => {
  return React.useContext(FeatureFlagContext);
};