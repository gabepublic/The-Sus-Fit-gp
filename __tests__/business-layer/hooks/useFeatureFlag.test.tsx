/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeatureFlagProvider } from '../../../src/business-layer/providers/FeatureFlagProvider';
import {
  useFeatureFlag,
  useFeatureFlagEnabled,
  useFeatureFlagString,
  useFeatureFlagNumber,
  useFeatureFlags,
  useAnyFeatureFlagEnabled,
  useAllFeatureFlagsEnabled,
  useFeatureFlagValue,
  useFeatureFlagRefresh,
  useAllFeatureFlags,
  useExperimentVariant,
} from '../../../src/business-layer/hooks/useFeatureFlag';
import type { FeatureFlagConfig } from '../../../src/business-layer/types/featureFlag.types';

// Mock console.debug to avoid noise in tests
jest.spyOn(console, 'debug').mockImplementation(() => {});

describe('useFeatureFlag Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    queryClient.clear();
  });

  const mockFlags: FeatureFlagConfig[] = [
    {
      key: 'booleanFlag',
      description: 'Boolean test flag',
      category: 'experiment',
      defaultValue: true,
      type: 'boolean',
    },
    {
      key: 'stringFlag',
      description: 'String test flag',
      category: 'ui',
      defaultValue: 'test-value',
      type: 'string',
    },
    {
      key: 'numberFlag',
      description: 'Number test flag',
      category: 'performance',
      defaultValue: 42,
      type: 'number',
    },
    {
      key: 'disabledFlag',
      description: 'Disabled test flag',
      category: 'experiment',
      defaultValue: false,
      type: 'boolean',
    },
    {
      key: 'experimentFlag',
      description: 'Experiment variant flag',
      category: 'experiment',
      defaultValue: 'variant-a',
      type: 'string',
    },
  ];

  const renderWithProvider = (children: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FeatureFlagProvider initialFlags={mockFlags} environment="test">
          {children}
        </FeatureFlagProvider>
      </QueryClientProvider>
    );
  };

  describe('useFeatureFlag', () => {
    it('should return flag value when flag exists and is enabled', () => {
      const TestComponent = () => {
        const { flag, isEnabled, value, isLoading, error } = useFeatureFlag('booleanFlag', false);
        
        return (
          <div>
            <div data-testid="flag-key">{flag?.key || 'none'}</div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="value">{value.toString()}</div>
            <div data-testid="is-loading">{isLoading.toString()}</div>
            <div data-testid="error">{error?.message || 'none'}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('flag-key')).toHaveTextContent('booleanFlag');
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('value')).toHaveTextContent('true');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should return default value when flag does not exist', () => {
      const TestComponent = () => {
        const { flag, isEnabled, value } = useFeatureFlag('nonexistentFlag', 'default');
        
        return (
          <div>
            <div data-testid="flag-exists">{flag ? 'true' : 'false'}</div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="value">{value.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('flag-exists')).toHaveTextContent('false');
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true'); // Default value is truthy
      expect(screen.getByTestId('value')).toHaveTextContent('default');
    });

    it('should return default value when flag is disabled', () => {
      const TestComponent = () => {
        const { isEnabled, value } = useFeatureFlag('disabledFlag', true);
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="value">{value.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('value')).toHaveTextContent('false'); // Flag value, not default
    });
  });

  describe('useFeatureFlagEnabled', () => {
    it('should return boolean flag state correctly', () => {
      const TestComponent = () => {
        const { isEnabled, value } = useFeatureFlagEnabled('booleanFlag');
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="value">{value.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('value')).toHaveTextContent('true');
    });

    it('should use default value for missing flags', () => {
      const TestComponent = () => {
        const { isEnabled, value } = useFeatureFlagEnabled('nonexistentFlag', true);
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="value">{value.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('value')).toHaveTextContent('true');
    });
  });

  describe('useFeatureFlagString', () => {
    it('should return string flag value correctly', () => {
      const TestComponent = () => {
        const { value } = useFeatureFlagString('stringFlag', 'default');
        
        return <div data-testid="value">{value}</div>;
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('test-value');
    });

    it('should return default string for missing flags', () => {
      const TestComponent = () => {
        const { value } = useFeatureFlagString('nonexistentFlag', 'fallback');
        
        return <div data-testid="value">{value}</div>;
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('fallback');
    });
  });

  describe('useFeatureFlagNumber', () => {
    it('should return number flag value correctly', () => {
      const TestComponent = () => {
        const { value } = useFeatureFlagNumber('numberFlag', 0);
        
        return <div data-testid="value">{value}</div>;
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('42');
    });

    it('should return default number for missing flags', () => {
      const TestComponent = () => {
        const { value } = useFeatureFlagNumber('nonexistentFlag', 100);
        
        return <div data-testid="value">{value}</div>;
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('100');
    });
  });

  describe('useFeatureFlags', () => {
    it('should return multiple flags correctly', () => {
      const TestComponent = () => {
        const { flags, values, isAnyEnabled, areAllEnabled } = useFeatureFlags(
          ['booleanFlag', 'stringFlag', 'disabledFlag'],
          { disabledFlag: true }
        );
        
        return (
          <div>
            <div data-testid="boolean-value">{values.booleanFlag?.toString()}</div>
            <div data-testid="string-value">{values.stringFlag?.toString()}</div>
            <div data-testid="disabled-value">{values.disabledFlag?.toString()}</div>
            <div data-testid="any-enabled">{isAnyEnabled.toString()}</div>
            <div data-testid="all-enabled">{areAllEnabled.toString()}</div>
            <div data-testid="flags-count">{Object.keys(flags).length}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('boolean-value')).toHaveTextContent('true');
      expect(screen.getByTestId('string-value')).toHaveTextContent('test-value');
      expect(screen.getByTestId('disabled-value')).toHaveTextContent('false');
      expect(screen.getByTestId('any-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('all-enabled')).toHaveTextContent('false'); // disabledFlag is false
      expect(screen.getByTestId('flags-count')).toHaveTextContent('3');
    });

    it('should handle empty flag array', () => {
      const TestComponent = () => {
        const { flags, values, isAnyEnabled, areAllEnabled } = useFeatureFlags([]);
        
        return (
          <div>
            <div data-testid="flags-count">{Object.keys(flags).length}</div>
            <div data-testid="values-count">{Object.keys(values).length}</div>
            <div data-testid="any-enabled">{isAnyEnabled.toString()}</div>
            <div data-testid="all-enabled">{areAllEnabled.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('flags-count')).toHaveTextContent('0');
      expect(screen.getByTestId('values-count')).toHaveTextContent('0');
      expect(screen.getByTestId('any-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('all-enabled')).toHaveTextContent('true'); // All 0 flags are enabled
    });
  });

  describe('useAnyFeatureFlagEnabled', () => {
    it('should return true when any flag is enabled', () => {
      const TestComponent = () => {
        const { isEnabled, enabledFlags } = useAnyFeatureFlagEnabled(['booleanFlag', 'disabledFlag']);
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="enabled-flags">{enabledFlags.join(',')}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('enabled-flags')).toHaveTextContent('booleanFlag');
    });

    it('should return false when no flags are enabled', () => {
      const TestComponent = () => {
        const { isEnabled, enabledFlags } = useAnyFeatureFlagEnabled(['disabledFlag', 'nonexistentFlag']);
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="enabled-flags">{enabledFlags.join(',')}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('enabled-flags')).toHaveTextContent('');
    });
  });

  describe('useAllFeatureFlagsEnabled', () => {
    it('should return true when all flags are enabled', () => {
      const TestComponent = () => {
        const { isEnabled, disabledFlags } = useAllFeatureFlagsEnabled(['booleanFlag', 'stringFlag']);
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="disabled-flags">{disabledFlags.join(',')}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('disabled-flags')).toHaveTextContent('');
    });

    it('should return false when some flags are disabled', () => {
      const TestComponent = () => {
        const { isEnabled, disabledFlags } = useAllFeatureFlagsEnabled(['booleanFlag', 'disabledFlag']);
        
        return (
          <div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
            <div data-testid="disabled-flags">{disabledFlags.join(',')}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('disabled-flags')).toHaveTextContent('disabledFlag');
    });
  });

  describe('useFeatureFlagValue', () => {
    it('should return enabled value when flag is enabled', () => {
      const TestComponent = () => {
        const { value, isEnabled } = useFeatureFlagValue('booleanFlag', 'enabled', 'disabled');
        
        return (
          <div>
            <div data-testid="value">{value}</div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('enabled');
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
    });

    it('should return disabled value when flag is disabled', () => {
      const TestComponent = () => {
        const { value, isEnabled } = useFeatureFlagValue('disabledFlag', 'enabled', 'disabled');
        
        return (
          <div>
            <div data-testid="value">{value}</div>
            <div data-testid="is-enabled">{isEnabled.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('disabled');
      expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
    });
  });

  describe('useFeatureFlagRefresh', () => {
    it('should provide refresh functionality', async () => {
      const TestComponent = () => {
        const { refresh, isRefreshing } = useFeatureFlagRefresh();
        const [refreshed, setRefreshed] = React.useState(false);
        
        const handleRefresh = async () => {
          await refresh();
          setRefreshed(true);
        };
        
        return (
          <div>
            <button onClick={handleRefresh} data-testid="refresh-button">
              Refresh
            </button>
            <div data-testid="is-refreshing">{isRefreshing.toString()}</div>
            <div data-testid="refreshed">{refreshed.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('is-refreshing')).toHaveTextContent('false');
      expect(screen.getByTestId('refreshed')).toHaveTextContent('false');

      await act(async () => {
        screen.getByTestId('refresh-button').click();
      });

      expect(screen.getByTestId('refreshed')).toHaveTextContent('true');
    });
  });

  describe('useAllFeatureFlags', () => {
    it('should return all flags in development mode', () => {
      // Mock NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';

      const TestComponent = () => {
        const allFlags = useAllFeatureFlags();
        
        return (
          <div>
            <div data-testid="flags-available">{allFlags ? 'true' : 'false'}</div>
            <div data-testid="flags-count">{allFlags ? Object.keys(allFlags.flags).length : 0}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('flags-available')).toHaveTextContent('true');
      expect(screen.getByTestId('flags-count')).toHaveTextContent('5'); // All mock flags

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('should return null in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      const TestComponent = () => {
        const allFlags = useAllFeatureFlags();
        
        return (
          <div data-testid="flags-available">{allFlags ? 'true' : 'false'}</div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('flags-available')).toHaveTextContent('false');

      (process.env as any).NODE_ENV = originalEnv;
    });
  });

  describe('useExperimentVariant', () => {
    it('should return correct variant and value', () => {
      const variants = {
        'control': 'Original Design',
        'variant-a': 'New Design A',
        'variant-b': 'New Design B',
      };

      const TestComponent = () => {
        const { variant, value, isInExperiment } = useExperimentVariant(
          'experimentFlag',
          variants,
          'control'
        );
        
        return (
          <div>
            <div data-testid="variant">{variant}</div>
            <div data-testid="value">{value}</div>
            <div data-testid="in-experiment">{isInExperiment.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('variant')).toHaveTextContent('variant-a');
      expect(screen.getByTestId('value')).toHaveTextContent('New Design A');
      expect(screen.getByTestId('in-experiment')).toHaveTextContent('true');
    });

    it('should fallback to default variant for invalid values', () => {
      const variants = {
        'control': 'Original Design',
        'variant-a': 'New Design A',
      };

      const TestComponent = () => {
        const { variant, value, isInExperiment } = useExperimentVariant(
          'nonexistentFlag',
          variants,
          'control'
        );
        
        return (
          <div>
            <div data-testid="variant">{variant}</div>
            <div data-testid="value">{value}</div>
            <div data-testid="in-experiment">{isInExperiment.toString()}</div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('variant')).toHaveTextContent('control');
      expect(screen.getByTestId('value')).toHaveTextContent('Original Design');
      expect(screen.getByTestId('in-experiment')).toHaveTextContent('false');
    });

    it('should fallback when flag value is not in variants', () => {
      const variants = {
        'control': 'Original Design',
        'variant-a': 'New Design A',
      };

      // experimentFlag has value 'variant-a' but let's test with a different value
      const customFlags: FeatureFlagConfig[] = [
        {
          key: 'invalidExperimentFlag',
          description: 'Invalid experiment flag',
          category: 'experiment',
          defaultValue: 'invalid-variant',
          type: 'string',
        },
      ];

      const TestComponent = () => {
        const { variant, value, isInExperiment } = useExperimentVariant(
          'invalidExperimentFlag',
          variants,
          'control'
        );
        
        return (
          <div>
            <div data-testid="variant">{variant}</div>
            <div data-testid="value">{value}</div>
            <div data-testid="in-experiment">{isInExperiment.toString()}</div>
          </div>
        );
      };

      render(
        <QueryClientProvider client={queryClient}>
          <FeatureFlagProvider initialFlags={customFlags} environment="test">
            <TestComponent />
          </FeatureFlagProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('variant')).toHaveTextContent('control');
      expect(screen.getByTestId('value')).toHaveTextContent('Original Design');
      expect(screen.getByTestId('in-experiment')).toHaveTextContent('false');
    });
  });

  describe('Hook error handling', () => {
    it('should handle context not available gracefully', () => {
      // Mock console.error to avoid noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        useFeatureFlag('testFlag');
        return <div data-testid="error">none</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFeatureFlagContext must be used within a FeatureFlagProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Development logging', () => {
    it('should log flag usage in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      
      const debugSpy = jest.spyOn(console, 'debug');

      const TestComponent = () => {
        useFeatureFlag('booleanFlag', false);
        return <div>Test</div>;
      };

      renderWithProvider(<TestComponent />);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FeatureFlag] booleanFlag: true (flag)')
      );

      (process.env as any).NODE_ENV = originalEnv;
    });
  });
});