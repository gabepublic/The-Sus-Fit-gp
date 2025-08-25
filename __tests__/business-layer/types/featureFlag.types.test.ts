/**
 * @jest-environment jsdom
 */
import {
  isFeatureFlag,
  isBooleanFlag,
  isStringFlag,
  isNumberFlag,
  DEFAULT_TRYON_FLAGS,
  DEFAULT_IMAGE_PROCESSING_FLAGS,
  DEFAULT_UI_FLAGS,
} from '../../../src/business-layer/types/featureFlag.types';
import type {
  FeatureFlag,
  FeatureFlagConfig,
  FeatureFlagValue,
  FeatureFlagCategory,
  Environment,
} from '../../../src/business-layer/types/featureFlag.types';

describe('Feature Flag Types and Utilities', () => {
  describe('Type Guards', () => {
    describe('isFeatureFlag', () => {
      it('should return true for valid feature flag objects', () => {
        const validFlag: FeatureFlag = {
          key: 'testFlag',
          description: 'Test flag',
          category: 'experiment',
          defaultValue: true,
          type: 'boolean',
          enabled: true,
          value: true,
          lastUpdated: new Date().toISOString(),
        };

        expect(isFeatureFlag(validFlag)).toBe(true);
      });

      it('should return false for objects missing required properties', () => {
        const invalidFlag1 = {
          key: 'testFlag',
          // missing other required properties
        };

        const invalidFlag2 = {
          description: 'Test flag',
          enabled: true,
          value: true,
          // missing key and defaultValue
        };

        expect(isFeatureFlag(invalidFlag1)).toBe(false);
        expect(isFeatureFlag(invalidFlag2)).toBe(false);
      });

      it('should return false for primitive values', () => {
        expect(isFeatureFlag(null)).toBe(false);
        expect(isFeatureFlag(undefined)).toBe(false);
        expect(isFeatureFlag('string')).toBe(false);
        expect(isFeatureFlag(123)).toBe(false);
        expect(isFeatureFlag(true)).toBe(false);
        expect(isFeatureFlag([])).toBe(false);
      });

      it('should return false for empty objects', () => {
        expect(isFeatureFlag({})).toBe(false);
      });
    });

    describe('isBooleanFlag', () => {
      it('should return true for boolean flags', () => {
        const booleanFlag: FeatureFlag<boolean> = {
          key: 'boolFlag',
          description: 'Boolean flag',
          category: 'ui',
          defaultValue: true,
          type: 'boolean',
          enabled: true,
          value: false,
        };

        expect(isBooleanFlag(booleanFlag)).toBe(true);
      });

      it('should return false for non-boolean flags', () => {
        const stringFlag: FeatureFlag<string> = {
          key: 'stringFlag',
          description: 'String flag',
          category: 'ui',
          defaultValue: 'test',
          type: 'string',
          enabled: true,
          value: 'value',
        };

        const numberFlag: FeatureFlag<number> = {
          key: 'numberFlag',
          description: 'Number flag',
          category: 'performance',
          defaultValue: 42,
          type: 'number',
          enabled: true,
          value: 100,
        };

        expect(isBooleanFlag(stringFlag)).toBe(false);
        expect(isBooleanFlag(numberFlag)).toBe(false);
      });
    });

    describe('isStringFlag', () => {
      it('should return true for string flags', () => {
        const stringFlag: FeatureFlag<string> = {
          key: 'stringFlag',
          description: 'String flag',
          category: 'ui',
          defaultValue: 'default',
          type: 'string',
          enabled: true,
          value: 'current',
        };

        expect(isStringFlag(stringFlag)).toBe(true);
      });

      it('should return false for non-string flags', () => {
        const booleanFlag: FeatureFlag<boolean> = {
          key: 'boolFlag',
          description: 'Boolean flag',
          category: 'ui',
          defaultValue: true,
          type: 'boolean',
          enabled: true,
          value: false,
        };

        expect(isStringFlag(booleanFlag)).toBe(false);
      });
    });

    describe('isNumberFlag', () => {
      it('should return true for number flags', () => {
        const numberFlag: FeatureFlag<number> = {
          key: 'numberFlag',
          description: 'Number flag',
          category: 'performance',
          defaultValue: 42,
          type: 'number',
          enabled: true,
          value: 100,
        };

        expect(isNumberFlag(numberFlag)).toBe(true);
      });

      it('should return false for non-number flags', () => {
        const stringFlag: FeatureFlag<string> = {
          key: 'stringFlag',
          description: 'String flag',
          category: 'ui',
          defaultValue: 'test',
          type: 'string',
          enabled: true,
          value: 'value',
        };

        expect(isNumberFlag(stringFlag)).toBe(false);
      });
    });
  });

  describe('Default Flag Configurations', () => {
    describe('DEFAULT_TRYON_FLAGS', () => {
      it('should contain expected tryon flags', () => {
        expect(DEFAULT_TRYON_FLAGS).toBeDefined();
        expect(Array.isArray(DEFAULT_TRYON_FLAGS)).toBe(true);
        expect(DEFAULT_TRYON_FLAGS.length).toBeGreaterThan(0);

        const flagKeys = DEFAULT_TRYON_FLAGS.map(flag => flag.key);
        expect(flagKeys).toContain('enableTryon');
        expect(flagKeys).toContain('maxConcurrentRequests');
        expect(flagKeys).toContain('enableRetryLogic');
        expect(flagKeys).toContain('enableOptimisticUpdates');
        expect(flagKeys).toContain('tryonTimeout');
      });

      it('should have valid flag configurations', () => {
        DEFAULT_TRYON_FLAGS.forEach(flag => {
          expect(flag).toHaveProperty('key');
          expect(flag).toHaveProperty('description');
          expect(flag).toHaveProperty('category');
          expect(flag).toHaveProperty('defaultValue');
          expect(flag).toHaveProperty('type');
          
          expect(typeof flag.key).toBe('string');
          expect(typeof flag.description).toBe('string');
          expect(typeof flag.category).toBe('string');
          expect(['boolean', 'string', 'number']).toContain(flag.type);
          expect(flag.category).toBe('tryon');
        });
      });

      it('should have consistent types and values', () => {
        DEFAULT_TRYON_FLAGS.forEach(flag => {
          const valueType = typeof flag.defaultValue;
          switch (flag.type) {
            case 'boolean':
              expect(valueType).toBe('boolean');
              break;
            case 'string':
              expect(valueType).toBe('string');
              break;
            case 'number':
              expect(valueType).toBe('number');
              break;
          }
        });
      });
    });

    describe('DEFAULT_IMAGE_PROCESSING_FLAGS', () => {
      it('should contain expected image processing flags', () => {
        expect(DEFAULT_IMAGE_PROCESSING_FLAGS).toBeDefined();
        expect(Array.isArray(DEFAULT_IMAGE_PROCESSING_FLAGS)).toBe(true);
        expect(DEFAULT_IMAGE_PROCESSING_FLAGS.length).toBeGreaterThan(0);

        const flagKeys = DEFAULT_IMAGE_PROCESSING_FLAGS.map(flag => flag.key);
        expect(flagKeys).toContain('enableCompression');
        expect(flagKeys).toContain('maxFileSize');
        expect(flagKeys).toContain('supportedFormats');
        expect(flagKeys).toContain('enableImageOptimization');
        expect(flagKeys).toContain('compressionQuality');
      });

      it('should have valid flag configurations', () => {
        DEFAULT_IMAGE_PROCESSING_FLAGS.forEach(flag => {
          expect(flag.category).toBe('image-processing');
          expect(['boolean', 'string', 'number']).toContain(flag.type);
        });
      });

      it('should have reasonable default values', () => {
        const maxFileSizeFlag = DEFAULT_IMAGE_PROCESSING_FLAGS.find(f => f.key === 'maxFileSize');
        const compressionQualityFlag = DEFAULT_IMAGE_PROCESSING_FLAGS.find(f => f.key === 'compressionQuality');
        
        expect(maxFileSizeFlag?.defaultValue).toBeGreaterThan(0);
        expect(compressionQualityFlag?.defaultValue).toBeGreaterThanOrEqual(1);
        expect(compressionQualityFlag?.defaultValue).toBeLessThanOrEqual(100);
      });
    });

    describe('DEFAULT_UI_FLAGS', () => {
      it('should contain expected UI flags', () => {
        expect(DEFAULT_UI_FLAGS).toBeDefined();
        expect(Array.isArray(DEFAULT_UI_FLAGS)).toBe(true);
        expect(DEFAULT_UI_FLAGS.length).toBeGreaterThan(0);

        const flagKeys = DEFAULT_UI_FLAGS.map(flag => flag.key);
        expect(flagKeys).toContain('showPolaroid');
        expect(flagKeys).toContain('enablePreview');
        expect(flagKeys).toContain('enableAnimations');
      });

      it('should have valid flag configurations', () => {
        DEFAULT_UI_FLAGS.forEach(flag => {
          expect(flag.category).toBe('ui');
        });
      });

      it('should include environment-specific flags', () => {
        const envSpecificFlags = DEFAULT_UI_FLAGS.filter(flag => flag.environment);
        expect(envSpecificFlags.length).toBeGreaterThan(0);
        
        envSpecificFlags.forEach(flag => {
          expect(Array.isArray(flag.environment)).toBe(true);
          expect(flag.environment!.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Combined flag uniqueness', () => {
      it('should have unique keys across all default flag sets', () => {
        const allFlags = [
          ...DEFAULT_TRYON_FLAGS,
          ...DEFAULT_IMAGE_PROCESSING_FLAGS,
          ...DEFAULT_UI_FLAGS,
        ];

        const keys = allFlags.map(flag => flag.key);
        const uniqueKeys = [...new Set(keys)];

        expect(keys.length).toBe(uniqueKeys.length);
      });
    });
  });

  describe('Type Definitions', () => {
    describe('FeatureFlagValue', () => {
      it('should accept boolean values', () => {
        const boolValue: FeatureFlagValue = true;
        const boolValue2: FeatureFlagValue = false;
        
        expect(typeof boolValue).toBe('boolean');
        expect(typeof boolValue2).toBe('boolean');
      });

      it('should accept string values', () => {
        const stringValue: FeatureFlagValue = 'test';
        const emptyString: FeatureFlagValue = '';
        
        expect(typeof stringValue).toBe('string');
        expect(typeof emptyString).toBe('string');
      });

      it('should accept number values', () => {
        const numberValue: FeatureFlagValue = 42;
        const zeroValue: FeatureFlagValue = 0;
        const negativeValue: FeatureFlagValue = -1;
        
        expect(typeof numberValue).toBe('number');
        expect(typeof zeroValue).toBe('number');
        expect(typeof negativeValue).toBe('number');
      });
    });

    describe('FeatureFlagCategory', () => {
      it('should include all expected categories', () => {
        const categories: FeatureFlagCategory[] = [
          'tryon',
          'image-processing',
          'ui',
          'performance',
          'experiment',
          'debugging',
        ];

        // This test ensures the type accepts all expected values
        categories.forEach(category => {
          expect(typeof category).toBe('string');
        });
      });
    });

    describe('Environment', () => {
      it('should include all expected environments', () => {
        const environments: Environment[] = [
          'development',
          'staging',
          'production',
          'test',
        ];

        environments.forEach(env => {
          expect(typeof env).toBe('string');
        });
      });
    });

    describe('FeatureFlagConfig', () => {
      it('should create valid config objects', () => {
        const config: FeatureFlagConfig = {
          key: 'testFlag',
          description: 'Test flag description',
          category: 'experiment',
          defaultValue: true,
          type: 'boolean',
        };

        expect(config.key).toBe('testFlag');
        expect(config.description).toBe('Test flag description');
        expect(config.category).toBe('experiment');
        expect(config.defaultValue).toBe(true);
        expect(config.type).toBe('boolean');
      });

      it('should support optional environment property', () => {
        const configWithEnv: FeatureFlagConfig = {
          key: 'envFlag',
          description: 'Environment-specific flag',
          category: 'debugging',
          defaultValue: false,
          type: 'boolean',
          environment: ['development', 'test'],
        };

        expect(configWithEnv.environment).toEqual(['development', 'test']);
      });
    });

    describe('FeatureFlag', () => {
      it('should create valid feature flag objects', () => {
        const flag: FeatureFlag<boolean> = {
          key: 'testFlag',
          description: 'Test flag',
          category: 'ui',
          defaultValue: true,
          type: 'boolean',
          enabled: true,
          value: false,
          lastUpdated: '2023-01-01T00:00:00.000Z',
        };

        expect(flag.key).toBe('testFlag');
        expect(flag.enabled).toBe(true);
        expect(flag.value).toBe(false);
        expect(flag.defaultValue).toBe(true);
      });

      it('should support optional properties', () => {
        const flagWithOptionals: FeatureFlag = {
          key: 'optionalFlag',
          description: 'Flag with optional properties',
          category: 'performance',
          defaultValue: 100,
          type: 'number',
          enabled: true,
          value: 200,
          environment: ['production'],
          metadata: { source: 'remote', version: '1.0' },
        };

        expect(flagWithOptionals.environment).toEqual(['production']);
        expect(flagWithOptionals.metadata).toEqual({ source: 'remote', version: '1.0' });
      });
    });
  });

  describe('Complex Type Interactions', () => {
    it('should handle generic FeatureFlag types correctly', () => {
      const stringFlag: FeatureFlag<string> = {
        key: 'stringFlag',
        description: 'String flag',
        category: 'ui',
        defaultValue: 'default',
        type: 'string',
        enabled: true,
        value: 'current',
      };

      const numberFlag: FeatureFlag<number> = {
        key: 'numberFlag',
        description: 'Number flag',
        category: 'performance',
        defaultValue: 0,
        type: 'number',
        enabled: true,
        value: 42,
      };

      // Type checking ensures value matches the generic type
      expect(typeof stringFlag.value).toBe('string');
      expect(typeof numberFlag.value).toBe('number');
    });

    it('should work with FeatureFlagCollection type', () => {
      const collection: Record<string, FeatureFlag> = {
        flag1: {
          key: 'flag1',
          description: 'First flag',
          category: 'ui',
          defaultValue: true,
          type: 'boolean',
          enabled: true,
          value: true,
        },
        flag2: {
          key: 'flag2',
          description: 'Second flag',
          category: 'performance',
          defaultValue: 100,
          type: 'number',
          enabled: false,
          value: 50,
        },
      };

      expect(Object.keys(collection)).toHaveLength(2);
      expect(collection.flag1.value).toBe(true);
      expect(collection.flag2.value).toBe(50);
    });
  });

  describe('Validation and Edge Cases', () => {
    it('should handle empty strings as valid values', () => {
      const emptyStringFlag: FeatureFlag<string> = {
        key: 'emptyFlag',
        description: 'Empty string flag',
        category: 'ui',
        defaultValue: '',
        type: 'string',
        enabled: true,
        value: '',
      };

      expect(emptyStringFlag.value).toBe('');
      expect(emptyStringFlag.defaultValue).toBe('');
    });

    it('should handle zero as valid number value', () => {
      const zeroFlag: FeatureFlag<number> = {
        key: 'zeroFlag',
        description: 'Zero value flag',
        category: 'performance',
        defaultValue: 0,
        type: 'number',
        enabled: true,
        value: 0,
      };

      expect(zeroFlag.value).toBe(0);
      expect(zeroFlag.defaultValue).toBe(0);
    });

    it('should handle false as valid boolean value', () => {
      const falseFlag: FeatureFlag<boolean> = {
        key: 'falseFlag',
        description: 'False value flag',
        category: 'ui',
        defaultValue: false,
        type: 'boolean',
        enabled: true,
        value: false,
      };

      expect(falseFlag.value).toBe(false);
      expect(falseFlag.defaultValue).toBe(false);
    });
  });
});