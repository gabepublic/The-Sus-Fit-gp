'use client';

// Backward Compatibility Layer
// Maintains compatibility with existing page component state structure while providing migration path

import { useCallback, useEffect, useRef } from 'react';
import { useTryonWorkflow, WorkflowState } from './useTryonWorkflow';
import { useToast } from './index';

/**
 * Legacy page component state interface (exact match from page.tsx)
 */
export interface LegacyPageState {
  isCapturing: boolean;
  leftCardImage: string | null;
  rightCardImage: string | null;
  showPolaroid: boolean;
  userImageFile: File | null;
  apparelImageFile: File | null;
  generatedImage: string | null;
  hasError: boolean;
}

/**
 * Legacy page component handlers interface (exact match from page.tsx)
 */
export interface LegacyPageHandlers {
  handleUserFileUpload: (file: File) => void;
  handleApparelFileUpload: (file: File) => void;
  handleLeftCardImageUpload: (imageUrl: string) => Promise<void>;
  handleRightCardImageUpload: (imageUrl: string) => Promise<void>;
  handleCameraButtonClick: () => Promise<void>;
  handleGenerationStart: () => void;
  handleGenerationComplete: (imageUrl: string) => void;
  handleClosePolaroid: () => void;
  handleRetryGeneration: () => void;
}

/**
 * Migration options for gradual transition
 */
export interface MigrationOptions {
  /** Enable new features while maintaining legacy interface */
  enableNewFeatures?: boolean;
  /** Show deprecation warnings in development */
  showDeprecationWarnings?: boolean;
  /** Custom migration callbacks */
  onStateChange?: (newState: any, legacyState: LegacyPageState) => void;
  /** Enable enhanced error handling */
  enhancedErrorHandling?: boolean;
  /** Enable progress tracking */
  enableProgressTracking?: boolean;
}

/**
 * Default migration options
 */
const DEFAULT_MIGRATION_OPTIONS: Required<MigrationOptions> = {
  enableNewFeatures: true,
  showDeprecationWarnings: process.env.NODE_ENV === 'development',
  onStateChange: () => {},
  enhancedErrorHandling: true,
  enableProgressTracking: true
};

/**
 * Backward compatibility hook that provides exact legacy interface
 * while internally using the new bridge layer architecture
 */
export function useLegacyPageInterface(
  options: MigrationOptions = {}
): LegacyPageState & LegacyPageHandlers & {
  // Additional helper methods for migration
  migration: {
    isUsingNewArchitecture: boolean;
    newWorkflowState: WorkflowState;
    deprecationWarnings: string[];
    migrateToNewInterface: () => any;
  };
} {
  const finalOptions = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
  const { showToast } = useToast();
  const deprecationWarnings = useRef<string[]>([]);

  // Use the new workflow internally
  const workflow = useTryonWorkflow(
    {
      timeoutMs: 60000,
      compressionLimitKB: 2048,
      debug: process.env.NODE_ENV === 'development'
    },
    showToast
  );

  // Track deprecation warnings
  const addDeprecationWarning = useCallback((method: string, suggestion: string) => {
    if (finalOptions.showDeprecationWarnings) {
      const warning = `DEPRECATED: ${method} - ${suggestion}`;
      if (!deprecationWarnings.current.includes(warning)) {
        deprecationWarnings.current.push(warning);
        console.warn(warning);
      }
    }
  }, [finalOptions.showDeprecationWarnings]);

  // Map new state to legacy state format (exact field mapping)
  const legacyState: LegacyPageState = {
    isCapturing: workflow.isCapturing,
    leftCardImage: workflow.leftCardImage,
    rightCardImage: workflow.rightCardImage,
    showPolaroid: workflow.showPolaroid,
    userImageFile: workflow.userImageFile,
    apparelImageFile: workflow.apparelImageFile,
    generatedImage: workflow.generatedImage,
    hasError: workflow.hasError
  };

  // Notify about state changes for migration assistance
  useEffect(() => {
    if (finalOptions.onStateChange) {
      finalOptions.onStateChange(workflow, legacyState);
    }
  }, [workflow, legacyState, finalOptions]);

  // Legacy handlers that map to new workflow methods
  const legacyHandlers: LegacyPageHandlers = {
    handleUserFileUpload: useCallback((file: File) => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleUserFileUpload', 
          'Consider using useBridgeLayer().actions.uploadUserImage for enhanced validation and progress tracking'
        );
      }
      workflow.handleUserFileUpload(file);
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleApparelFileUpload: useCallback((file: File) => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleApparelFileUpload', 
          'Consider using useBridgeLayer().actions.uploadApparelImage for enhanced validation and progress tracking'
        );
      }
      workflow.handleApparelFileUpload(file);
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleLeftCardImageUpload: useCallback(async (imageUrl: string) => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleLeftCardImageUpload', 
          'Consider using useBridgeLayer().actions.uploadUserImage with File objects for better type safety'
        );
      }
      await workflow.handleLeftCardImageUpload(imageUrl);
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleRightCardImageUpload: useCallback(async (imageUrl: string) => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleRightCardImageUpload', 
          'Consider using useBridgeLayer().actions.uploadApparelImage with File objects for better type safety'
        );
      }
      await workflow.handleRightCardImageUpload(imageUrl);
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleCameraButtonClick: useCallback(async () => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleCameraButtonClick', 
          'Consider using useBridgeLayer().actions.generate for enhanced error handling and progress tracking'
        );
      }
      await workflow.startGeneration();
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleGenerationStart: useCallback(() => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleGenerationStart', 
          'This callback is now handled automatically by the workflow. Consider using onGenerationStart in BridgeLayerConfig'
        );
      }
      console.log('Generation started (legacy handler)');
    }, [addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleGenerationComplete: useCallback((imageUrl: string) => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleGenerationComplete', 
          'This callback is now handled automatically by the workflow. Consider using onGenerationComplete in BridgeLayerConfig'
        );
      }
      console.log('Generation complete (legacy handler):', imageUrl);
    }, [addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleClosePolaroid: useCallback(() => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleClosePolaroid', 
          'Consider using useBridgeLayer().actions.hideResult for consistent naming'
        );
      }
      workflow.closePolaroid();
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings]),

    handleRetryGeneration: useCallback(() => {
      if (finalOptions.showDeprecationWarnings) {
        addDeprecationWarning(
          'handleRetryGeneration', 
          'Consider using useBridgeLayer().actions.retry for enhanced retry logic'
        );
      }
      workflow.retryGeneration();
    }, [workflow, addDeprecationWarning, finalOptions.showDeprecationWarnings])
  };

  // Migration helper
  const migrateToNewInterface = useCallback(() => {
    return {
      // Import suggestion
      import: 'import { useBridgeLayer } from "@/hooks/useBridgeLayer"',
      
      // New hook usage
      hookUsage: `
const { state, actions } = useBridgeLayer({
  workflow: { timeoutMs: 60000, compressionLimitKB: 2048 },
  ui: { showDetailedProgress: true },
  callbacks: {
    onGenerationStart: () => console.log('Generation started'),
    onGenerationComplete: (imageUrl) => console.log('Generation complete:', imageUrl)
  }
});`,
      
      // State mapping
      stateMapping: {
        'isCapturing': 'state.isLoading',
        'leftCardImage': 'state.userImagePreview',
        'rightCardImage': 'state.apparelImagePreview', 
        'showPolaroid': 'state.showResult',
        'userImageFile': 'advanced.workflow.userImageFile',
        'apparelImageFile': 'advanced.workflow.apparelImageFile',
        'generatedImage': 'state.resultImage',
        'hasError': '!!state.errorMessage'
      },
      
      // Action mapping
      actionMapping: {
        'handleUserFileUpload': 'actions.uploadUserImage',
        'handleApparelFileUpload': 'actions.uploadApparelImage',
        'handleCameraButtonClick': 'actions.generate',
        'handleClosePolaroid': 'actions.hideResult',
        'handleRetryGeneration': 'actions.retry'
      },
      
      // Enhanced features available
      enhancedFeatures: [
        'Built-in validation with user-friendly error messages',
        'Progress tracking with detailed status updates',
        'Automatic retry logic with exponential backoff',
        'Thumbnail generation and preview management',
        'Drag and drop support',
        'Image processing and optimization',
        'Download and share functionality',
        'Type-safe interfaces throughout'
      ]
    };
  }, []);

  return {
    // Legacy state (exact match)
    ...legacyState,
    
    // Legacy handlers (exact match)
    ...legacyHandlers,
    
    // Migration assistance
    migration: {
      isUsingNewArchitecture: true,
      newWorkflowState: workflow.workflowState,
      deprecationWarnings: deprecationWarnings.current,
      migrateToNewInterface
    }
  };
}

/**
 * Direct replacement hook for existing page.tsx
 * Drop-in replacement that requires no code changes
 */
export function usePageComponentState() {
  const compatibility = useLegacyPageInterface();
  
  // Return only the exact state and handlers that page.tsx expects
  return {
    isCapturing: compatibility.isCapturing,
    leftCardImage: compatibility.leftCardImage,
    rightCardImage: compatibility.rightCardImage,
    showPolaroid: compatibility.showPolaroid,
    userImageFile: compatibility.userImageFile,
    apparelImageFile: compatibility.apparelImageFile,
    generatedImage: compatibility.generatedImage,
    hasError: compatibility.hasError,
    
    handleUserFileUpload: compatibility.handleUserFileUpload,
    handleApparelFileUpload: compatibility.handleApparelFileUpload,
    handleLeftCardImageUpload: compatibility.handleLeftCardImageUpload,
    handleRightCardImageUpload: compatibility.handleRightCardImageUpload,
    handleCameraButtonClick: compatibility.handleCameraButtonClick,
    handleGenerationStart: compatibility.handleGenerationStart,
    handleGenerationComplete: compatibility.handleGenerationComplete,
    handleClosePolaroid: compatibility.handleClosePolaroid,
    handleRetryGeneration: compatibility.handleRetryGeneration
  };
}

/**
 * Enhanced hook that adds new features while maintaining compatibility
 */
export function useEnhancedPageState(migrationOptions: MigrationOptions = {}) {
  const compatibility = useLegacyPageInterface(migrationOptions);
  
  return {
    // All legacy functionality
    ...compatibility,
    
    // Additional enhanced features
    enhanced: {
      progress: compatibility.migration.newWorkflowState === WorkflowState.GENERATING ? 
        (compatibility as any).progress || 0 : 0,
      
      canGenerate: !compatibility.isCapturing && 
                   !!compatibility.userImageFile && 
                   !!compatibility.apparelImageFile,
      
      canRetry: compatibility.hasError,
      
      validationErrors: [] as string[], // Could be expanded to show validation details
      
      // New enhanced actions
      reset: () => (compatibility as any).resetWorkflow?.(),
      clearError: () => (compatibility as any).clearError?.(),
      
      // Migration helper
      getMigrationGuide: compatibility.migration.migrateToNewInterface
    }
  };
}