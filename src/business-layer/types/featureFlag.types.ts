// Feature Flag Types
// Comprehensive types for feature flag system with environment-based configurations

// Base feature flag value types
export type FeatureFlagValue = boolean | string | number;

// Feature flag categories for organization
export type FeatureFlagCategory = 
  | 'tryon'
  | 'image-processing' 
  | 'ui'
  | 'performance'
  | 'experiment'
  | 'debugging';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Base feature flag interface
export interface FeatureFlag<T extends FeatureFlagValue = FeatureFlagValue> {
  key: string;
  description: string;
  category: FeatureFlagCategory;
  defaultValue: T;
  type: 'boolean' | 'string' | 'number';
  environment?: Environment[];
  enabled: boolean;
  value: T;
  lastUpdated?: string;
  metadata?: Record<string, unknown>;
}

// Feature flag configuration for initialization
export interface FeatureFlagConfig<T extends FeatureFlagValue = FeatureFlagValue> {
  key: string;
  description: string;
  category: FeatureFlagCategory;
  defaultValue: T;
  type: 'boolean' | 'string' | 'number';
  environment?: Environment[];
}

// Specific feature flag interfaces

// Try-on functionality flags
export interface TryonFeatureFlags {
  enableTryon: FeatureFlag<boolean>;
  maxConcurrentRequests: FeatureFlag<number>;
  enableRetryLogic: FeatureFlag<boolean>;
  enableOptimisticUpdates: FeatureFlag<boolean>;
  tryonTimeout: FeatureFlag<number>;
}

// Image processing flags
export interface ImageProcessingFeatureFlags {
  enableCompression: FeatureFlag<boolean>;
  maxFileSize: FeatureFlag<number>;
  supportedFormats: FeatureFlag<string>;
  enableImageOptimization: FeatureFlag<boolean>;
  compressionQuality: FeatureFlag<number>;
}

// UI variation flags
export interface UIFeatureFlags {
  showPolaroid: FeatureFlag<boolean>;
  enablePreview: FeatureFlag<boolean>;
  enableDarkMode: FeatureFlag<boolean>;
  showAdvancedControls: FeatureFlag<boolean>;
  enableAnimations: FeatureFlag<boolean>;
}

// Performance flags
export interface PerformanceFeatureFlags {
  enableQueryCache: FeatureFlag<boolean>;
  cacheTimeoutMs: FeatureFlag<number>;
  enablePrefetching: FeatureFlag<boolean>;
  enableLazyLoading: FeatureFlag<boolean>;
}

// Experiment flags
export interface ExperimentFeatureFlags {
  enableABTesting: FeatureFlag<boolean>;
  experimentVariant: FeatureFlag<string>;
  enableMetrics: FeatureFlag<boolean>;
}

// Debugging flags
export interface DebuggingFeatureFlags {
  enableDevTools: FeatureFlag<boolean>;
  enableVerboseLogging: FeatureFlag<boolean>;
  enableErrorReporting: FeatureFlag<boolean>;
  showDebugInfo: FeatureFlag<boolean>;
}

// Combined feature flags interface
export interface AllFeatureFlags extends 
  TryonFeatureFlags,
  ImageProcessingFeatureFlags,
  UIFeatureFlags,
  PerformanceFeatureFlags,
  ExperimentFeatureFlags,
  DebuggingFeatureFlags {}

// Feature flag collection type
export type FeatureFlagCollection = Record<string, FeatureFlag>;

// Feature flag provider configuration
export interface FeatureFlagProviderConfig {
  flags: FeatureFlagConfig[];
  environment: Environment;
  enableRemoteConfig?: boolean;
  remoteConfigUrl?: string;
  refreshInterval?: number;
  fallbackToDefaults?: boolean;
}

// Feature flag context type
export interface FeatureFlagContextValue {
  flags: FeatureFlagCollection;
  getFlag: <T extends FeatureFlagValue>(key: string) => FeatureFlag<T> | undefined;
  isEnabled: (key: string) => boolean;
  getValue: <T extends FeatureFlagValue>(key: string, defaultValue?: T) => T;
  updateFlag: (key: string, value: FeatureFlagValue) => void;
  refreshFlags: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// Feature flag hook return type
export interface UseFeatureFlagReturn<T extends FeatureFlagValue> {
  flag: FeatureFlag<T> | undefined;
  isEnabled: boolean;
  value: T;
  isLoading: boolean;
  error: Error | null;
}

// Feature flag validation schema
export interface FeatureFlagValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: FeatureFlagValue[];
  customValidator?: (value: FeatureFlagValue) => boolean | string;
}

// Feature flag with validation
export interface ValidatedFeatureFlag<T extends FeatureFlagValue = FeatureFlagValue> 
  extends FeatureFlag<T> {
  validation?: FeatureFlagValidation;
}

// Default feature flag configurations
export const DEFAULT_TRYON_FLAGS: FeatureFlagConfig[] = [
  {
    key: 'enableTryon',
    description: 'Enable try-on functionality',
    category: 'tryon',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'maxConcurrentRequests',
    description: 'Maximum concurrent try-on requests',
    category: 'tryon',
    defaultValue: 3,
    type: 'number',
  },
  {
    key: 'enableRetryLogic',
    description: 'Enable retry logic for failed requests',
    category: 'tryon',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'enableOptimisticUpdates',
    description: 'Enable optimistic UI updates',
    category: 'tryon',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'tryonTimeout',
    description: 'Try-on request timeout in milliseconds',
    category: 'tryon',
    defaultValue: 30000,
    type: 'number',
  },
];

export const DEFAULT_IMAGE_PROCESSING_FLAGS: FeatureFlagConfig[] = [
  {
    key: 'enableCompression',
    description: 'Enable image compression',
    category: 'image-processing',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'maxFileSize',
    description: 'Maximum file size in bytes',
    category: 'image-processing',
    defaultValue: 10485760, // 10MB
    type: 'number',
  },
  {
    key: 'supportedFormats',
    description: 'Supported image formats (comma-separated)',
    category: 'image-processing',
    defaultValue: 'jpeg,jpg,png,webp',
    type: 'string',
  },
  {
    key: 'enableImageOptimization',
    description: 'Enable automatic image optimization',
    category: 'image-processing',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'compressionQuality',
    description: 'Image compression quality (0-100)',
    category: 'image-processing',
    defaultValue: 85,
    type: 'number',
  },
];

export const DEFAULT_UI_FLAGS: FeatureFlagConfig[] = [
  {
    key: 'showPolaroid',
    description: 'Show polaroid-style photo frames',
    category: 'ui',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'enablePreview',
    description: 'Enable image preview functionality',
    category: 'ui',
    defaultValue: true,
    type: 'boolean',
  },
  {
    key: 'enableDarkMode',
    description: 'Enable dark mode toggle',
    category: 'ui',
    defaultValue: false,
    type: 'boolean',
    environment: ['development'],
  },
  {
    key: 'showAdvancedControls',
    description: 'Show advanced control options',
    category: 'ui',
    defaultValue: false,
    type: 'boolean',
    environment: ['development', 'staging'],
  },
  {
    key: 'enableAnimations',
    description: 'Enable UI animations',
    category: 'ui',
    defaultValue: true,
    type: 'boolean',
  },
];

// Utility type for extracting flag value type
export type ExtractFlagValue<T> = T extends FeatureFlag<infer U> ? U : never;

// Type guard functions
export const isFeatureFlag = (obj: unknown): obj is FeatureFlag => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'key' in obj &&
    'enabled' in obj &&
    'value' in obj &&
    'defaultValue' in obj
  );
};

export const isBooleanFlag = (flag: FeatureFlag): flag is FeatureFlag<boolean> => {
  return flag.type === 'boolean';
};

export const isStringFlag = (flag: FeatureFlag): flag is FeatureFlag<string> => {
  return flag.type === 'string';
};

export const isNumberFlag = (flag: FeatureFlag): flag is FeatureFlag<number> => {
  return flag.type === 'number';
};