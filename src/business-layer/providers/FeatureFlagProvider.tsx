'use client';

import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FeatureFlagContext } from './FeatureFlagContext';
import { ErrorBoundary } from './ErrorBoundary';
import type {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagCollection,
  FeatureFlagProviderConfig,
  FeatureFlagContextValue,
  FeatureFlagValue,
  Environment,
} from '../types/featureFlag.types';
import {
  DEFAULT_TRYON_FLAGS,
  DEFAULT_IMAGE_PROCESSING_FLAGS,
  DEFAULT_UI_FLAGS,
} from '../types/featureFlag.types';
import { QUERY_KEYS } from '../config/constants';

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  config?: Partial<FeatureFlagProviderConfig>;
  environment?: Environment;
  initialFlags?: FeatureFlagConfig[];
  enableRemoteConfig?: boolean;
  fallbackToDefaults?: boolean;
  onError?: (error: Error) => void;
}

// Default configuration
const DEFAULT_CONFIG: FeatureFlagProviderConfig = {
  flags: [...DEFAULT_TRYON_FLAGS, ...DEFAULT_IMAGE_PROCESSING_FLAGS, ...DEFAULT_UI_FLAGS],
  environment: (process.env.NODE_ENV as Environment) || 'development',
  enableRemoteConfig: false,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  fallbackToDefaults: true,
};

// Utility function to create feature flag from config
const createFeatureFlagFromConfig = (
  config: FeatureFlagConfig,
  environment: Environment
): FeatureFlag => {
  // Check if flag is enabled for current environment
  const isEnabledForEnvironment = !config.environment || 
    config.environment.includes(environment);

  return {
    key: config.key,
    description: config.description,
    category: config.category,
    defaultValue: config.defaultValue,
    type: config.type,
    environment: config.environment,
    enabled: isEnabledForEnvironment,
    value: config.defaultValue,
    lastUpdated: new Date().toISOString(),
  };
};

// Mock function for remote config fetching (to be implemented)
const fetchRemoteFlags = async (url?: string): Promise<FeatureFlagConfig[]> => {
  // TODO: Implement actual remote config fetching
  if (!url) {
    throw new Error('Remote config URL not provided');
  }
  
  // For now, return empty array - this would be replaced with actual API call
  return [];
};

// Environment variable parser for feature flags
const parseEnvironmentFlags = (): Partial<Record<string, FeatureFlagValue>> => {
  const envFlags: Record<string, FeatureFlagValue> = {};
  
  // Parse environment variables with FEATURE_FLAG_ prefix
  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith('FEATURE_FLAG_') && value !== undefined) {
      const flagKey = key.replace('FEATURE_FLAG_', '').toLowerCase();
      
      // Try to parse as boolean
      if (value === 'true' || value === 'false') {
        envFlags[flagKey] = value === 'true';
      }
      // Try to parse as number
      else if (!isNaN(Number(value))) {
        envFlags[flagKey] = Number(value);
      }
      // Treat as string
      else {
        envFlags[flagKey] = value;
      }
    }
  });
  
  return envFlags;
};

const FeatureFlagProviderContent: React.FC<FeatureFlagProviderProps> = ({
  children,
  config = {},
  environment = DEFAULT_CONFIG.environment,
  initialFlags = DEFAULT_CONFIG.flags,
  enableRemoteConfig = DEFAULT_CONFIG.enableRemoteConfig,
  fallbackToDefaults = DEFAULT_CONFIG.fallbackToDefaults,
  onError,
}) => {
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
    flags: initialFlags,
    environment,
    enableRemoteConfig,
    fallbackToDefaults,
  }), [config, environment, initialFlags, enableRemoteConfig, fallbackToDefaults]);

  // Query for remote feature flags (if enabled)
  const {
    data: remoteFlags = [],
    isLoading: isLoadingRemote,
    error: remoteError,
    refetch: refetchRemoteFlags,
  } = useQuery({
    queryKey: [...QUERY_KEYS.FEATURE_FLAGS, 'remote', mergedConfig.remoteConfigUrl],
    queryFn: () => fetchRemoteFlags(mergedConfig.remoteConfigUrl),
    enabled: enableRemoteConfig && !!mergedConfig.remoteConfigUrl,
    staleTime: mergedConfig.refreshInterval,
    retry: 2,
    retryDelay: 1000,
  });

  // Combine local and remote flags with environment overrides
  const combinedFlags = useMemo((): FeatureFlagCollection => {
    const envFlags = parseEnvironmentFlags();
    const allConfigs = [...mergedConfig.flags, ...remoteFlags];
    const flagMap: FeatureFlagCollection = {};

    // Create flags from configurations
    allConfigs.forEach((flagConfig) => {
      const flag = createFeatureFlagFromConfig(flagConfig, environment);
      
      // Override with environment variable if available
      const envValue = envFlags[flagConfig.key.toLowerCase()];
      if (envValue !== undefined) {
        flag.value = envValue;
      }
      
      flagMap[flagConfig.key] = flag;
    });

    return flagMap;
  }, [mergedConfig.flags, remoteFlags, environment]);

  // Context value implementation
  const contextValue = useMemo((): FeatureFlagContextValue => {
    const getFlag = <T extends FeatureFlagValue>(key: string): FeatureFlag<T> | undefined => {
      const flag = combinedFlags[key];
      return flag as FeatureFlag<T> | undefined;
    };

    const isEnabled = (key: string): boolean => {
      const flag = combinedFlags[key];
      return flag ? flag.enabled && Boolean(flag.value) : false;
    };

    const getValue = <T extends FeatureFlagValue>(key: string, defaultValue?: T): T => {
      const flag = combinedFlags[key];
      if (!flag || !flag.enabled) {
        return defaultValue as T;
      }
      return flag.value as T;
    };

    const updateFlag = (key: string, value: FeatureFlagValue): void => {
      const flag = combinedFlags[key];
      if (flag) {
        flag.value = value;
        flag.lastUpdated = new Date().toISOString();
      }
    };

    const refreshFlags = async (): Promise<void> => {
      if (enableRemoteConfig) {
        await refetchRemoteFlags();
      }
    };

    return {
      flags: combinedFlags,
      getFlag,
      isEnabled,
      getValue,
      updateFlag,
      refreshFlags,
      isLoading: isLoadingRemote,
      error: remoteError instanceof Error ? remoteError : null,
    };
  }, [combinedFlags, isLoadingRemote, remoteError, refetchRemoteFlags, enableRemoteConfig]);

  // Handle errors
  React.useEffect(() => {
    if (remoteError && onError) {
      onError(remoteError instanceof Error ? remoteError : new Error('Unknown feature flag error'));
    }
  }, [remoteError, onError]);

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Main provider component with error boundary
export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = (props) => {
  const { onError, fallbackToDefaults = true } = props;

  const handleError = useCallback((error: Error) => {
    console.error('FeatureFlagProvider Error:', error);
    onError?.(error);
  }, [onError]);

  // Fallback component for error boundary
  const ErrorFallback = useCallback(({ error, resetError }: { error: Error; resetError: () => void }) => {
    if (!fallbackToDefaults) {
      return (
        <div className="feature-flag-error">
          <h3>Feature Flag Error</h3>
          <p>{error.message}</p>
          <button onClick={resetError}>Retry</button>
        </div>
      );
    }

    // Render children with default flags only
    return (
      <FeatureFlagProviderContent
        {...props}
        enableRemoteConfig={false}
        config={{ ...props.config, enableRemoteConfig: false }}
      />
    );
  }, [fallbackToDefaults, props]);

  return (
    <ErrorBoundary onError={handleError} fallback={ErrorFallback}>
      <FeatureFlagProviderContent {...props} />
    </ErrorBoundary>
  );
};

// Export types for convenience
export type { FeatureFlagProviderProps };