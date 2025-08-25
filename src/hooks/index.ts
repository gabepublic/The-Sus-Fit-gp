// Re-export hooks for convenient imports
export { useToast } from '../components/ToastProvider';

// Bridge Layer Hooks - Main interface for UI components
export {
  useBridgeLayer,
  useSimpleTryon,
  useTryonWithProgress,
  type BridgeLayerConfig,
  type SimplifiedTryonState,
  type SimplifiedTryonActions
} from './useBridgeLayer';

// Workflow Coordination Hook
export {
  useTryonWorkflow,
  WorkflowState,
  type WorkflowConfig,
  type TryonWorkflowState,
  type TryonWorkflowActions,
  type WorkflowError
} from './useTryonWorkflow';

// Image Upload Hooks
export {
  useImageUpload,
  useSingleImageUpload,
  useDropzoneUpload,
  UploadState,
  type UploadConfig,
  type UploadedFile,
  type UploadError,
  type FileValidationResult,
  type UploadProgress,
  type DragDropState
} from './useImageUpload';

// Backward Compatibility Layer
export {
  useLegacyPageInterface,
  usePageComponentState,
  useEnhancedPageState,
  type LegacyPageState,
  type LegacyPageHandlers,
  type MigrationOptions
} from './useBackwardCompatibility';
