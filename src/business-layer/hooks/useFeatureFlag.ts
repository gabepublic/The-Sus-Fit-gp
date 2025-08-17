// Feature Flag Hooks
// Custom React hooks for accessing feature flags with type safety and error handling

import { useMemo } from 'react';
import { useFeatureFlagContext } from '../providers/FeatureFlagContext';
import type {
  FeatureFlag,
  FeatureFlagValue,
  UseFeatureFlagReturn,
} from '../types/featureFlag.types';

// Development logging utility
const logFlagUsage = (key: string, value: FeatureFlagValue, source: 'flag' | 'default') => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[FeatureFlag] ${key}: ${JSON.stringify(value)} (${source})`);
  }
};

/**
 * Hook to get a specific feature flag with type safety
 * @param key - Feature flag key
 * @param defaultValue - Fallback value if flag is not found or disabled
 * @returns Feature flag data with loading state and error handling
 */
export function useFeatureFlag<T extends FeatureFlagValue>(
  key: string,
  defaultValue?: T
): UseFeatureFlagReturn<T> {
  const context = useFeatureFlagContext();

  return useMemo(() => {
    const flag = context.getFlag<T>(key);
    const isLoading = context.isLoading;
    const error = context.error;

    // Determine the final value
    let value: T;
    let isEnabled = false;
    let source: 'flag' | 'default' = 'default';

    if (flag && flag.enabled) {
      value = flag.value as T;
      isEnabled = Boolean(flag.value);
      source = 'flag';
    } else {
      value = defaultValue as T;
      isEnabled = Boolean(defaultValue);
      source = 'default';
    }

    // Log usage in development
    logFlagUsage(key, value, source);

    return {
      flag,
      isEnabled,
      value,
      isLoading,
      error,
    };
  }, [key, defaultValue, context]);
}

/**
 * Hook specifically for boolean feature flags
 * @param key - Feature flag key
 * @param defaultValue - Default boolean value (defaults to false)
 * @returns Boolean flag state with loading/error info
 */
export function useFeatureFlagEnabled(
  key: string,
  defaultValue = false
): UseFeatureFlagReturn<boolean> {
  return useFeatureFlag<boolean>(key, defaultValue);
}

/**
 * Hook for string feature flags
 * @param key - Feature flag key
 * @param defaultValue - Default string value
 * @returns String flag value with loading/error info
 */
export function useFeatureFlagString(
  key: string,
  defaultValue = ''
): UseFeatureFlagReturn<string> {
  return useFeatureFlag<string>(key, defaultValue);
}

/**
 * Hook for number feature flags
 * @param key - Feature flag key
 * @param defaultValue - Default number value
 * @returns Number flag value with loading/error info
 */
export function useFeatureFlagNumber(
  key: string,
  defaultValue = 0
): UseFeatureFlagReturn<number> {
  return useFeatureFlag<number>(key, defaultValue);
}

/**
 * Hook to get multiple feature flags at once
 * @param keys - Array of feature flag keys
 * @param defaultValues - Optional object with default values for each key
 * @returns Object containing all requested flags
 */
export function useFeatureFlags<T extends Record<string, FeatureFlagValue>>(
  keys: string[],
  defaultValues?: Partial<T>
): {
  flags: Record<string, FeatureFlag | undefined>;
  values: Record<string, FeatureFlagValue>;
  isLoading: boolean;
  error: Error | null;
  isAnyEnabled: boolean;
  areAllEnabled: boolean;
} {
  const context = useFeatureFlagContext();

  return useMemo(() => {
    const flags: Record<string, FeatureFlag | undefined> = {};
    const values: Record<string, FeatureFlagValue> = {};
    let enabledCount = 0;

    keys.forEach(key => {
      const flag = context.getFlag(key);
      const defaultValue = defaultValues?.[key];
      
      flags[key] = flag;
      
      if (flag && flag.enabled) {
        values[key] = flag.value;
        if (flag.value) enabledCount++;
        logFlagUsage(key, flag.value, 'flag');
      } else {
        const fallbackValue = defaultValue ?? false;
        values[key] = fallbackValue;
        if (fallbackValue) enabledCount++;
        logFlagUsage(key, fallbackValue, 'default');
      }
    });

    return {
      flags,
      values,
      isLoading: context.isLoading,
      error: context.error,
      isAnyEnabled: enabledCount > 0,
      areAllEnabled: enabledCount === keys.length,
    };
  }, [keys, defaultValues, context]);
}

/**
 * Hook to check if any of the provided flags are enabled
 * @param keys - Array of feature flag keys to check
 * @returns True if any flag is enabled
 */
export function useAnyFeatureFlagEnabled(keys: string[]): {
  isEnabled: boolean;
  enabledFlags: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const { values, isLoading, error } = useFeatureFlags(keys);

  return useMemo(() => {
    const enabledFlags = keys.filter(key => Boolean(values[key]));
    
    return {
      isEnabled: enabledFlags.length > 0,
      enabledFlags,
      isLoading,
      error,
    };
  }, [keys, values, isLoading, error]);
}

/**
 * Hook to check if all provided flags are enabled
 * @param keys - Array of feature flag keys to check
 * @returns True if all flags are enabled
 */
export function useAllFeatureFlagsEnabled(keys: string[]): {
  isEnabled: boolean;
  disabledFlags: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const { values, isLoading, error } = useFeatureFlags(keys);

  return useMemo(() => {
    const disabledFlags = keys.filter(key => !Boolean(values[key]));
    
    return {
      isEnabled: disabledFlags.length === 0,
      disabledFlags,
      isLoading,
      error,
    };
  }, [keys, values, isLoading, error]);
}

/**
 * Hook for conditional feature flag usage with fallback behavior
 * @param key - Feature flag key
 * @param enabledValue - Value to return when flag is enabled
 * @param disabledValue - Value to return when flag is disabled
 * @returns The appropriate value based on flag state
 */
export function useFeatureFlagValue<T>(
  key: string,
  enabledValue: T,
  disabledValue: T
): {
  value: T;
  isEnabled: boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const { isEnabled, isLoading, error } = useFeatureFlagEnabled(key);

  return useMemo(() => ({
    value: isEnabled ? enabledValue : disabledValue,
    isEnabled,
    isLoading,
    error,
  }), [isEnabled, enabledValue, disabledValue, isLoading, error]);
}

/**
 * Hook to refresh feature flags manually
 * @returns Function to refresh flags and loading state
 */
export function useFeatureFlagRefresh(): {
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  error: Error | null;
} {
  const context = useFeatureFlagContext();

  return useMemo(() => ({
    refresh: context.refreshFlags,
    isRefreshing: context.isLoading,
    error: context.error,
  }), [context]);
}

/**
 * Development helper hook to get all available flags
 * Only works in development mode
 */
export function useAllFeatureFlags(): {
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  error: Error | null;
} | null {
  const context = useFeatureFlagContext();

  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return {
      flags: context.flags,
      isLoading: context.isLoading,
      error: context.error,
    };
  }, [context]);
}

/**
 * Hook for A/B testing scenarios
 * @param experimentKey - The experiment feature flag key
 * @param variants - Object mapping variant names to their values
 * @param defaultVariant - Default variant to use if flag is not found
 * @returns The variant value and metadata
 */
export function useExperimentVariant<T>(
  experimentKey: string,
  variants: Record<string, T>,
  defaultVariant: string
): {
  variant: string;
  value: T;
  isInExperiment: boolean;
  isLoading: boolean;
  error: Error | null;
} {
  const { flag, value: flagValue, isEnabled, isLoading, error } = useFeatureFlagString(
    experimentKey,
    defaultVariant
  );

  return useMemo(() => {
    const flagExists = Boolean(flag);
    const variant = flagExists && isEnabled && flagValue in variants ? flagValue : defaultVariant;
    const value = variants[variant] || variants[defaultVariant];

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Experiment] ${experimentKey}: variant=${variant}, value=${JSON.stringify(value)}, flagExists=${flagExists}`);
    }

    return {
      variant,
      value,
      isInExperiment: flagExists && isEnabled && flagValue in variants,
      isLoading,
      error,
    };
  }, [experimentKey, variants, defaultVariant, flag, flagValue, isEnabled, isLoading, error]);
}