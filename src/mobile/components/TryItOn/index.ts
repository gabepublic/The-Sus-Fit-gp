/**
 * @fileoverview TryItOn Module - Main entry point for the Try It On View component system
 * @module @/mobile/components/TryItOn
 * @version 1.0.0
 *
 * This module provides a complete implementation of the Try It On View component,
 * following established mobile component architecture patterns.
 *
 * COMPONENT FEATURES:
 * - Integration with useTryonWorkflow hook
 * - Mock data support for development
 * - Smooth fade-in transformation animations
 * - Brutalist design system consistency
 * - Comprehensive error handling
 * - Full accessibility compliance
 * - Mobile-optimized performance
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Core state and configuration types
  TryItOnState,
  TryItOnViewState,
  TryItOnConfig,
  TryItOnError,
  TryItOnAction,
  TryItOnResult,
  TryItOnMockData,

  // Component prop types
  TryItOnProps,
  TryItOnContainerProps,
  TryItOnWithErrorBoundaryProps,
  BaseTryItOnProps,

  // Hook return types
  UseTryItOnReturn,

  // Workflow integration types (re-exported)
  WorkflowState,
  WorkflowError,
  WorkflowConfig,
  TryonWorkflowState,
  TryonWorkflowActions,

  // Convenience type aliases
  State,
  Config,
  Hook,
  Result,
  Error
} from './types';

// =============================================================================
// CONSTANT EXPORTS
// =============================================================================

export {
  // Action constants
  TRYITON_ACTIONS,

  // Configuration defaults
  DEFAULT_TRYITON_CONFIG,

  // Status messages
  TRYITON_STATUS_MESSAGES,

  // Workflow state enum
  WorkflowState
} from './types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

export {
  // Type guards
  isTryItOnViewState,
  isTryItOnError,

  // Error factory
  createTryItOnError
} from './types';

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

// Main presentation component
export { TryItOn } from './components/TryItOn';

// Container components
export { TryItOnContainer } from './containers/TryItOnContainer';
export { TryItOnWithErrorBoundary } from './containers/TryItOnWithErrorBoundary';

// Default export for convenience
export { TryItOnWithErrorBoundary as default } from './containers/TryItOnWithErrorBoundary';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

// Custom hooks will be exported here when implemented
// export { useTryItOnLogic } from './hooks/useTryItOnLogic';

// =============================================================================
// MODULE METADATA
// =============================================================================

// Version info for the TryItOn module
export const TRYITON_VERSION = '1.0.0';
export const TRYITON_MODULE_NAME = 'TryItOn';

// Module metadata for debugging and monitoring
export const TRYITON_METADATA = {
  version: TRYITON_VERSION,
  name: TRYITON_MODULE_NAME,
  isolated: false, // Integrates with shared components
  dependencies: [
    'PhotoFrame',
    'Button',
    'ProgressIndicator',
    'ErrorDisplay',
    'ErrorBoundary',
    'useTryonWorkflow'
  ],
  route: '/m/tryon',
  description: 'Try It On View component system with virtual try-on workflow integration',
  features: [
    'Virtual try-on generation',
    'Mock data support',
    'Fade-in transformation animation',
    'Brutalist design system',
    'Error boundary protection',
    'Accessibility compliance',
    'Mobile optimization'
  ]
} as const;

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Development utilities available in non-production environments
 */
export const TRYITON_DEV_UTILS = process.env.NODE_ENV === 'development' ? {
  metadata: TRYITON_METADATA,
  version: TRYITON_VERSION,

  /**
   * Log component hierarchy for debugging
   */
  logComponentHierarchy: () => {
    console.group('🎭 TryItOn Component Hierarchy');
    console.log('TryItOnWithErrorBoundary (wrapper)');
    console.log('  └── ErrorBoundary');
    console.log('    └── Suspense');
    console.log('      └── TryItOnContainer (logic)');
    console.log('        └── TryItOn (presentation)');
    console.log('          ├── PhotoFrame');
    console.log('          ├── Button (Try It On)');
    console.log('          ├── Button (Share)');
    console.log('          ├── ProgressIndicator');
    console.log('          └── ErrorDisplay');
    console.groupEnd();
  },

  /**
   * Log integration points for debugging
   */
  logIntegrationPoints: () => {
    console.group('🔗 TryItOn Integration Points');
    console.log('Hooks:');
    console.log('  └── useTryonWorkflow (workflow management)');
    console.log('Shared Components:');
    console.log('  ├── PhotoFrame (image display)');
    console.log('  ├── Button (actions)');
    console.log('  ├── ProgressIndicator (loading states)');
    console.log('  ├── ErrorDisplay (error handling)');
    console.log('  └── ErrorBoundary (error protection)');
    console.log('Navigation:');
    console.log('  └── Next.js App Router (/m/share)');
    console.groupEnd();
  }
} : undefined;