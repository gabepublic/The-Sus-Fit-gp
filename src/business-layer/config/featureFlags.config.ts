// Feature Flag Configuration System
// Environment-based configuration loading with validation and caching

import type {
  FeatureFlagConfig,
  FeatureFlagValue,
  Environment,
  FeatureFlagValidation,
  FeatureFlagCategory,
} from '../types/featureFlag.types';
import {
  DEFAULT_TRYON_FLAGS,
  DEFAULT_IMAGE_PROCESSING_FLAGS,
  DEFAULT_UI_FLAGS,
} from '../types/featureFlag.types';

// Configuration cache to avoid repeated environment reads
let configCache: FeatureFlagConfig[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Environment-specific flag configurations
const ENVIRONMENT_SPECIFIC_FLAGS: Record<Environment, Partial<Record<string, FeatureFlagValue>>> = {
  development: {
    enableDarkMode: true,
    showAdvancedControls: true,
    enableDevTools: true,
    enableVerboseLogging: true,
    showDebugInfo: true,
  },
  staging: {
    enableDarkMode: false,
    showAdvancedControls: true,
    enableDevTools: false,
    enableVerboseLogging: false,
    showDebugInfo: false,
    enableABTesting: true,
  },
  production: {
    enableDarkMode: false,
    showAdvancedControls: false,
    enableDevTools: false,
    enableVerboseLogging: false,
    showDebugInfo: false,
    enableErrorReporting: true,
    enableMetrics: true,
  },
  test: {
    enableDarkMode: false,
    showAdvancedControls: false,
    enableDevTools: false,
    enableVerboseLogging: false,
    showDebugInfo: false,
    enableAnimations: false,
  },
};

// Validation rules for different flag types
const VALIDATION_RULES: Record<string, FeatureFlagValidation> = {
  maxConcurrentRequests: {
    required: true,
    min: 1,
    max: 10,
  },
  maxFileSize: {
    required: true,
    min: 1024, // 1KB minimum
    max: 50 * 1024 * 1024, // 50MB maximum
  },
  compressionQuality: {
    required: true,
    min: 1,
    max: 100,
  },
  tryonTimeout: {
    required: true,
    min: 5000, // 5 seconds minimum
    max: 120000, // 2 minutes maximum
  },
  cacheTimeoutMs: {
    required: true,
    min: 1000, // 1 second minimum
    max: 24 * 60 * 60 * 1000, // 24 hours maximum
  },
  supportedFormats: {
    required: true,
    pattern: /^[a-zA-Z,]+$/,
    customValidator: (value: FeatureFlagValue) => {
      if (typeof value !== 'string') return 'Must be a string';
      const formats = value.split(',').map(f => f.trim().toLowerCase());
      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
      const invalidFormats = formats.filter(f => !validFormats.includes(f));
      return invalidFormats.length === 0 || `Invalid formats: ${invalidFormats.join(', ')}`;
    },
  },
  experimentVariant: {
    allowedValues: ['control', 'variant-a', 'variant-b', 'variant-c'],
  },
};

// Parse environment variable value based on type
const parseEnvironmentValue = (
  value: string,
  type: 'boolean' | 'string' | 'number'
): FeatureFlagValue => {
  switch (type) {
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'number':
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    case 'string':
    default:
      return value;
  }
};

// Validate flag value against validation rules
const validateFlagValue = (
  key: string,
  value: FeatureFlagValue,
  validation?: FeatureFlagValidation
): { isValid: boolean; error?: string } => {
  const rules = validation || VALIDATION_RULES[key];
  if (!rules) return { isValid: true };

  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: `${key} is required` };
  }

  // Type-specific validations
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return { isValid: false, error: `${key} must be at least ${rules.min}` };
    }
    if (rules.max !== undefined && value > rules.max) {
      return { isValid: false, error: `${key} must be at most ${rules.max}` };
    }
  }

  if (typeof value === 'string') {
    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: `${key} format is invalid` };
    }
  }

  // Allowed values check
  if (rules.allowedValues && !rules.allowedValues.includes(value)) {
    return { 
      isValid: false, 
      error: `${key} must be one of: ${rules.allowedValues.join(', ')}` 
    };
  }

  // Custom validator
  if (rules.customValidator) {
    const result = rules.customValidator(value);
    if (result !== true) {
      return { isValid: false, error: typeof result === 'string' ? result : `${key} is invalid` };
    }
  }

  return { isValid: true };
};

// Load feature flags from environment variables
export const loadEnvironmentFlags = (): Record<string, FeatureFlagValue> => {
  const envFlags: Record<string, FeatureFlagValue> = {};

  Object.entries(process.env).forEach(([key, value]) => {
    if (key.startsWith('FEATURE_FLAG_') && value !== undefined) {
      const flagKey = key.replace('FEATURE_FLAG_', '').toLowerCase();
      
      // Try to determine type from existing default flags
      const allDefaults = [...DEFAULT_TRYON_FLAGS, ...DEFAULT_IMAGE_PROCESSING_FLAGS, ...DEFAULT_UI_FLAGS];
      const defaultFlag = allDefaults.find(f => f.key.toLowerCase() === flagKey);
      const type = defaultFlag?.type || 'string';
      
      const parsedValue = parseEnvironmentValue(value, type);
      
      // Validate the value
      const validation = validateFlagValue(flagKey, parsedValue);
      if (validation.isValid) {
        envFlags[flagKey] = parsedValue;
      } else {
        console.warn(`Invalid environment flag ${flagKey}: ${validation.error}`);
      }
    }
  });

  return envFlags;
};

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  const nodeEnv = process.env.NODE_ENV;
  const customEnv = process.env.FEATURE_FLAG_ENVIRONMENT;
  
  // Use custom environment if specified, otherwise fall back to NODE_ENV
  const env = customEnv || nodeEnv;
  
  switch (env) {
    case 'development':
    case 'staging':
    case 'production':
    case 'test':
      return env;
    default:
      return 'development';
  }
};

// Merge configurations with priority order: environment variables > environment-specific > defaults
export const mergeConfigurations = (
  defaultConfigs: FeatureFlagConfig[],
  environment: Environment,
  envFlags: Record<string, FeatureFlagValue> = {}
): FeatureFlagConfig[] => {
  const environmentOverrides = ENVIRONMENT_SPECIFIC_FLAGS[environment] || {};
  
  return defaultConfigs.map(config => {
    // Start with default config
    const finalConfig = { ...config };
    
    // Apply environment-specific overrides
    const envOverride = environmentOverrides[config.key];
    if (envOverride !== undefined) {
      finalConfig.defaultValue = envOverride;
    }
    
    // Apply environment variable overrides (highest priority)
    const envFlag = envFlags[config.key];
    if (envFlag !== undefined) {
      finalConfig.defaultValue = envFlag;
    }
    
    return finalConfig;
  });
};

// Main configuration loading function with caching
export const loadFeatureFlagConfig = (
  forceRefresh = false,
  customDefaults?: FeatureFlagConfig[]
): FeatureFlagConfig[] => {
  const now = Date.now();
  
  // Return cached config if still valid and not forcing refresh
  if (!forceRefresh && configCache && (now - lastCacheUpdate) < CACHE_TTL) {
    return configCache;
  }
  
  // Load environment flags
  const envFlags = loadEnvironmentFlags();
  const environment = getCurrentEnvironment();
  
  // Use custom defaults or standard defaults
  const defaultConfigs = customDefaults || [
    ...DEFAULT_TRYON_FLAGS,
    ...DEFAULT_IMAGE_PROCESSING_FLAGS,
    ...DEFAULT_UI_FLAGS,
  ];
  
  // Merge all configurations
  const mergedConfigs = mergeConfigurations(defaultConfigs, environment, envFlags);
  
  // Add environment-specific flags that don't exist in defaults
  const existingKeys = new Set(mergedConfigs.map(c => c.key));
  const environmentOverrides = ENVIRONMENT_SPECIFIC_FLAGS[environment] || {};
  
  Object.entries(environmentOverrides).forEach(([key, value]) => {
    if (!existingKeys.has(key) && value !== undefined) {
      // Infer type from value
      const type = typeof value as 'boolean' | 'string' | 'number';
      const category: FeatureFlagCategory = key.startsWith('enable') ? 'ui' : 'experiment';
      
      mergedConfigs.push({
        key,
        description: `Environment-specific flag for ${environment}`,
        category,
        defaultValue: value,
        type,
        environment: [environment],
      });
    }
  });
  
  // Update cache
  configCache = mergedConfigs;
  lastCacheUpdate = now;
  
  return mergedConfigs;
};

// Clear configuration cache (useful for testing or hot reloading)
export const clearConfigCache = (): void => {
  configCache = null;
  lastCacheUpdate = 0;
};

// Validate all configurations
export const validateConfigurations = (configs: FeatureFlagConfig[]): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  configs.forEach(config => {
    const validation = validateFlagValue(config.key, config.defaultValue);
    if (!validation.isValid && validation.error) {
      errors.push(validation.error);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Hot reload support for development
export const enableHotReload = (): void => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Listen for environment changes (this would be extended based on your hot reload setup)
    const checkForUpdates = () => {
      const newConfigs = loadFeatureFlagConfig(true);
      // Trigger re-render of components using feature flags
      window.dispatchEvent(new CustomEvent('featureFlags:updated', { 
        detail: { configs: newConfigs } 
      }));
    };
    
    // Check for updates every 30 seconds in development
    setInterval(checkForUpdates, 30000);
  }
};

// Export utility functions for configuration debugging
export const debugConfiguration = (): {
  environment: Environment;
  envFlags: Record<string, FeatureFlagValue>;
  finalConfigs: FeatureFlagConfig[];
  validation: { isValid: boolean; errors: string[] };
} => {
  const environment = getCurrentEnvironment();
  const envFlags = loadEnvironmentFlags();
  const finalConfigs = loadFeatureFlagConfig(true);
  const validation = validateConfigurations(finalConfigs);
  
  return {
    environment,
    envFlags,
    finalConfigs,
    validation,
  };
};