/**
 * @jest-environment jsdom
 */
import {
  loadEnvironmentFlags,
  getCurrentEnvironment,
  mergeConfigurations,
  loadFeatureFlagConfig,
  clearConfigCache,
  validateConfigurations,
  debugConfiguration,
} from '../../../src/business-layer/config/featureFlags.config';
import type { FeatureFlagConfig, Environment } from '../../../src/business-layer/types/featureFlag.types';

// Mock process.env
const originalEnv = process.env;

describe('Feature Flag Configuration', () => {
  beforeEach(() => {
    // Reset environment and cache before each test
    jest.resetModules();
    clearConfigCache();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    clearConfigCache();
  });

  describe('loadEnvironmentFlags', () => {
    it('should parse boolean environment variables correctly', () => {
      process.env.FEATURE_FLAG_ENABLETRYON = 'true';
      process.env.FEATURE_FLAG_ENABLECOMPRESSION = 'false';

      const flags = loadEnvironmentFlags();

      expect(flags.enabletryon).toBe(true);
      expect(flags.enablecompression).toBe(false);
    });

    it('should parse number environment variables correctly', () => {
      process.env.FEATURE_FLAG_MAXFILESIZE = '1024';
      process.env.FEATURE_FLAG_MAXCONCURRENTREQUESTS = '5';

      const flags = loadEnvironmentFlags();

      expect(flags.maxfilesize).toBe(1024);
      expect(flags.maxconcurrentrequests).toBe(5);
    });

    it('should parse string environment variables correctly', () => {
      process.env.FEATURE_FLAG_SUPPORTEDFORMATS = 'jpeg,png,webp';
      process.env.FEATURE_FLAG_CUSTOMSTRING = 'test-value';

      const flags = loadEnvironmentFlags();

      expect(flags.supportedformats).toBe('jpeg,png,webp');
      expect(flags.customstring).toBe('test-value');
    });

    it('should ignore non-feature flag environment variables', () => {
      process.env.NOT_A_FLAG = 'ignored';
      process.env.FEATURE_FLAG_ENABLETRYON = 'true';

      const flags = loadEnvironmentFlags();

      expect(flags.not_a_flag).toBeUndefined();
      expect(flags.enabletryon).toBe(true);
    });

    it('should handle invalid values gracefully', () => {
      process.env.FEATURE_FLAG_MAXFILESIZE = 'not_a_number';

      const flags = loadEnvironmentFlags();

      expect(flags.maxfilesize).toBe(0); // Falls back to 0 for invalid numbers
    });

    it('should convert keys to lowercase', () => {
      process.env.FEATURE_FLAG_ENABLETRYON = 'true';

      const flags = loadEnvironmentFlags();

      expect(flags.enabletryon).toBe(true);
      expect(flags.ENABLETRYON).toBeUndefined();
    });
  });

  describe('getCurrentEnvironment', () => {
    it('should return NODE_ENV when no custom environment is set', () => {
      (process.env as any).NODE_ENV = 'production';
      delete process.env.FEATURE_FLAG_ENVIRONMENT;

      const env = getCurrentEnvironment();

      expect(env).toBe('production');
    });

    it('should return custom environment when FEATURE_FLAG_ENVIRONMENT is set', () => {
      (process.env as any).NODE_ENV = 'development';
      process.env.FEATURE_FLAG_ENVIRONMENT = 'staging';

      const env = getCurrentEnvironment();

      expect(env).toBe('staging');
    });

    it('should default to development for unknown environments', () => {
      (process.env as any).NODE_ENV = 'unknown';

      const env = getCurrentEnvironment();

      expect(env).toBe('development');
    });

    it('should handle valid environment values', () => {
      const validEnvs: Environment[] = ['development', 'staging', 'production', 'test'];

      validEnvs.forEach(envValue => {
        (process.env as any).NODE_ENV = envValue;
        expect(getCurrentEnvironment()).toBe(envValue);
      });
    });
  });

  describe('mergeConfigurations', () => {
    const mockDefaultConfigs: FeatureFlagConfig[] = [
      {
        key: 'enableFeature',
        description: 'Enable the feature',
        category: 'ui',
        defaultValue: false,
        type: 'boolean',
      },
      {
        key: 'maxSize',
        description: 'Maximum size',
        category: 'performance',
        defaultValue: 1000,
        type: 'number',
      },
    ];

    it('should apply environment-specific overrides', () => {
      const merged = mergeConfigurations(mockDefaultConfigs, 'development');

      const enableFeature = merged.find(c => c.key === 'enableFeature');
      expect(enableFeature?.defaultValue).toBe(false); // No override for this in development
    });

    it('should apply environment variable overrides with highest priority', () => {
      const envFlags = { enableFeature: true, maxSize: 2000 };
      const merged = mergeConfigurations(mockDefaultConfigs, 'production', envFlags);

      const enableFeature = merged.find(c => c.key === 'enableFeature');
      const maxSize = merged.find(c => c.key === 'maxSize');

      expect(enableFeature?.defaultValue).toBe(true);
      expect(maxSize?.defaultValue).toBe(2000);
    });

    it('should preserve original config when no overrides exist', () => {
      const merged = mergeConfigurations(mockDefaultConfigs, 'production');

      expect(merged).toHaveLength(2);
      expect(merged[0].key).toBe('enableFeature');
      expect(merged[0].defaultValue).toBe(false);
      expect(merged[1].key).toBe('maxSize');
      expect(merged[1].defaultValue).toBe(1000);
    });

    it('should handle empty configurations', () => {
      const merged = mergeConfigurations([], 'development');

      expect(merged).toEqual([]);
    });
  });

  describe('loadFeatureFlagConfig', () => {
    it('should load and merge configurations correctly', () => {
      process.env.FEATURE_FLAG_ENABLETRYON = 'false';
      
      const configs = loadFeatureFlagConfig();

      expect(configs).toBeDefined();
      expect(configs.length).toBeGreaterThan(0);
      
      const tryonFlag = configs.find(c => c.key === 'enableTryon');
      expect(tryonFlag?.defaultValue).toBe(true); // Original default value
    });

    it('should use cache on subsequent calls', () => {
      const firstCall = loadFeatureFlagConfig();
      const secondCall = loadFeatureFlagConfig();

      expect(firstCall).toBe(secondCall); // Same reference due to caching
    });

    it('should force refresh when requested', () => {
      const firstCall = loadFeatureFlagConfig();
      const secondCall = loadFeatureFlagConfig(true); // Force refresh

      expect(firstCall).not.toBe(secondCall); // Different references
      expect(firstCall).toEqual(secondCall); // But same content
    });

    it('should accept custom default configurations', () => {
      const customDefaults: FeatureFlagConfig[] = [
        {
          key: 'customFlag',
          description: 'Custom flag',
          category: 'experiment',
          defaultValue: 'test',
          type: 'string',
        },
      ];

      const configs = loadFeatureFlagConfig(false, customDefaults);

      expect(configs.find(c => c.key === 'customFlag')).toBeDefined();
    });
  });

  describe('validateConfigurations', () => {
    it('should validate correct configurations', () => {
      const validConfigs: FeatureFlagConfig[] = [
        {
          key: 'maxConcurrentRequests',
          description: 'Max requests',
          category: 'performance',
          defaultValue: 5,
          type: 'number',
        },
      ];

      const validation = validateConfigurations(validConfigs);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should catch validation errors', () => {
      const invalidConfigs: FeatureFlagConfig[] = [
        {
          key: 'maxConcurrentRequests',
          description: 'Max requests',
          category: 'performance',
          defaultValue: 15, // Exceeds max of 10
          type: 'number',
        },
      ];

      const validation = validateConfigurations(invalidConfigs);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate string patterns', () => {
      const configs: FeatureFlagConfig[] = [
        {
          key: 'supportedFormats',
          description: 'Supported formats',
          category: 'image-processing',
          defaultValue: 'invalid@format',
          type: 'string',
        },
      ];

      const validation = validateConfigurations(configs);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('supportedFormats'))).toBe(true);
    });
  });

  describe('debugConfiguration', () => {
    it('should return complete debug information', () => {
      process.env.FEATURE_FLAG_ENABLETRYON = 'true';
      (process.env as any).NODE_ENV = 'development';

      const debug = debugConfiguration();

      expect(debug.environment).toBe('development');
      expect(debug.envFlags).toBeDefined();
      expect(debug.finalConfigs).toBeDefined();
      expect(debug.validation).toBeDefined();
      expect(debug.envFlags.enabletryon).toBe(true);
    });

    it('should include validation results', () => {
      const debug = debugConfiguration();

      expect(debug.validation).toHaveProperty('isValid');
      expect(debug.validation).toHaveProperty('errors');
      expect(Array.isArray(debug.validation.errors)).toBe(true);
    });
  });

  describe('clearConfigCache', () => {
    it('should clear the configuration cache', () => {
      // Load config to populate cache
      const firstLoad = loadFeatureFlagConfig();
      
      // Clear cache
      clearConfigCache();
      
      // Load again - should create new instance
      const secondLoad = loadFeatureFlagConfig();

      expect(firstLoad).not.toBe(secondLoad); // Different references after cache clear
    });
  });

  describe('Environment-specific behavior', () => {
    it('should apply development-specific flags', () => {
      (process.env as any).NODE_ENV = 'development';
      
      const configs = loadFeatureFlagConfig();
      
      // Development should have specific flags enabled
      const devFlags = configs.filter(c => 
        c.environment && c.environment.includes('development')
      );
      
      expect(devFlags.length).toBeGreaterThan(0);
    });

    it('should apply production-specific flags', () => {
      (process.env as any).NODE_ENV = 'production';
      
      const configs = loadFeatureFlagConfig();
      
      // Should not include development-only flags
      const prodConfigs = configs.filter(c => 
        !c.environment || c.environment.includes('production')
      );
      
      expect(prodConfigs.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle missing environment variables gracefully', () => {
      // Clear all feature flag env vars
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('FEATURE_FLAG_')) {
          delete process.env[key];
        }
      });

      expect(() => loadEnvironmentFlags()).not.toThrow();
      expect(() => loadFeatureFlagConfig()).not.toThrow();
    });

    it('should handle malformed environment values', () => {
      process.env.FEATURE_FLAG_MALFORMED = ''; // Empty string
      process.env.FEATURE_FLAG_NULL = 'null';
      process.env.FEATURE_FLAG_UNDEFINED = 'undefined';

      expect(() => loadEnvironmentFlags()).not.toThrow();
      
      const flags = loadEnvironmentFlags();
      expect(flags.malformed).toBe('');
      expect(flags.null).toBe('null');
      expect(flags.undefined).toBe('undefined');
    });
  });
});