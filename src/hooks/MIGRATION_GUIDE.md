# Bridge Layer Migration Guide

This guide shows how to migrate from the existing page.tsx state management to the new bridge layer architecture.

## Option 1: Zero-Change Migration (Immediate)

Replace your current state management with a drop-in replacement:

```typescript
// Before (current page.tsx)
const [isCapturing, setIsCapturing] = useState(false)
const [leftCardImage, setLeftCardImage] = useState<string | null>(null)
const [rightCardImage, setRightCardImage] = useState<string | null>(null)
// ... all other state

const handleUserFileUpload = useCallback((file: File) => {
  setUserImageFile(file)
}, [])
// ... all other handlers

// After (drop-in replacement)
import { usePageComponentState } from '@/hooks'

const {
  isCapturing,
  leftCardImage,
  rightCardImage,
  showPolaroid,
  userImageFile,
  apparelImageFile,
  generatedImage,
  hasError,
  handleUserFileUpload,
  handleApparelFileUpload,
  handleLeftCardImageUpload,
  handleRightCardImageUpload,
  handleCameraButtonClick,
  handleGenerationStart,
  handleGenerationComplete,
  handleClosePolaroid,
  handleRetryGeneration
} = usePageComponentState()
```

## Option 2: Enhanced Migration (Recommended)

Get additional features while maintaining compatibility:

```typescript
import { useEnhancedPageState } from '@/hooks'

const {
  // All existing state and handlers work exactly the same
  isCapturing,
  leftCardImage,
  rightCardImage,
  showPolaroid,
  userImageFile,
  apparelImageFile,
  generatedImage,
  hasError,
  handleUserFileUpload,
  handleApparelFileUpload,
  handleLeftCardImageUpload,
  handleRightCardImageUpload,
  handleCameraButtonClick,
  handleGenerationStart,
  handleGenerationComplete,
  handleClosePolaroid,
  handleRetryGeneration,
  
  // New enhanced features
  enhanced: {
    progress,           // 0-100 generation progress
    canGenerate,        // Boolean for enable/disable generate button
    canRetry,          // Boolean for enable/disable retry button
    validationErrors,   // Array of validation messages
    reset,             // Function to reset all state
    clearError,        // Function to clear error state
    getMigrationGuide  // Function that returns migration help
  }
} = useEnhancedPageState({
  enableNewFeatures: true,
  showDeprecationWarnings: true, // Shows helpful migration tips in console
  enableProgressTracking: true,
  enhancedErrorHandling: true
})
```

## Option 3: Full Bridge Layer (Future-proof)

For new components or complete migration:

```typescript
import { useBridgeLayer } from '@/hooks'

const { state, actions } = useBridgeLayer({
  workflow: {
    timeoutMs: 60000,
    compressionLimitKB: 2048,
    autoRetry: true,
    maxRetries: 3
  },
  upload: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateThumbnails: true,
    enableDragDrop: true
  },
  ui: {
    showDetailedProgress: true,
    enableShare: true,
    enableDownload: true
  },
  callbacks: {
    onGenerationStart: () => console.log('Generation started'),
    onGenerationComplete: (imageUrl) => console.log('Complete:', imageUrl),
    onError: (error) => console.error('Error:', error),
    onSuccess: (message) => console.log('Success:', message)
  }
})

// Clean, semantic state
const {
  isLoading,           // Replaces isCapturing
  isReady,            // Can generate (both images uploaded)
  showResult,         // Replaces showPolaroid
  resultImage,        // Replaces generatedImage
  errorMessage,       // Replaces hasError (with actual message)
  successMessage,     // New: success feedback
  hasUserImage,       // Boolean state
  hasApparelImage,    // Boolean state
  userImagePreview,   // Replaces leftCardImage
  apparelImagePreview, // Replaces rightCardImage
  progress,           // 0-100 progress
  progressMessage,    // User-friendly progress text
  canGenerate,        // Boolean for UI state
  canRetry,          // Boolean for UI state
  canReset           // Boolean for UI state
} = state

// Clean, semantic actions
const {
  uploadUserImage,    // Replaces handleUserFileUpload + handleLeftCardImageUpload
  uploadApparelImage, // Replaces handleApparelFileUpload + handleRightCardImageUpload
  removeUserImage,    // New: remove uploaded image
  removeApparelImage, // New: remove uploaded image
  generate,          // Replaces handleCameraButtonClick
  retry,             // Replaces handleRetryGeneration
  reset,             // New: reset everything
  hideResult,        // Replaces handleClosePolaroid
  clearError,        // New: clear error state
  downloadResult,    // New: download generated image
  shareResult        // New: share generated image
} = actions
```

## Option 4: Specialized Hooks

For specific use cases:

```typescript
// For simple components that just need basic functionality
import { useSimpleTryon } from '@/hooks'

const {
  isLoading,
  result,
  error,
  canGenerate,
  uploadUserImage,
  uploadApparelImage,
  generate,
  reset
} = useSimpleTryon()

// For components that need detailed progress tracking
import { useTryonWithProgress } from '@/hooks'

const {
  // All state and actions from useBridgeLayer
  ...state,
  ...actions,
  
  // Additional progress information
  uploadProgress: {
    user: 100,      // 0-100 user image upload progress
    apparel: 50     // 0-100 apparel image upload progress
  },
  overallProgress: 75  // 0-100 overall completion
} = useTryonWithProgress()
```

## Migration Strategy

### Phase 1: Drop-in Replacement (Immediate)
- Use `usePageComponentState()` to replace existing state management
- No code changes required in components
- Immediate benefits: better error handling, automatic retries, progress tracking

### Phase 2: Enhanced Features (Short-term)
- Use `useEnhancedPageState()` to access new features
- Add progress bars, better error messages, enhanced UI states
- Gradual adoption of new features

### Phase 3: Full Migration (Long-term)
- Migrate to `useBridgeLayer()` for new components
- Refactor existing components to use semantic state/actions
- Full benefit of type safety, validation, and enhanced UX

## Benefits of Migration

### Immediate Benefits (Drop-in replacement)
- ✅ Enhanced error handling with user-friendly messages
- ✅ Automatic retry logic with exponential backoff
- ✅ Progress tracking throughout the workflow
- ✅ Better validation with detailed feedback
- ✅ Consistent state management across the application

### Enhanced Benefits (Bridge layer)
- ✅ Type-safe interfaces throughout
- ✅ Semantic state and action names
- ✅ Built-in image processing and optimization
- ✅ Drag and drop support out of the box
- ✅ Thumbnail generation and preview management
- ✅ Download and share functionality
- ✅ Clean separation of concerns
- ✅ Easy testing and mocking

### Developer Benefits
- ✅ Deprecation warnings guide migration
- ✅ Migration helper functions provide guidance
- ✅ Comprehensive TypeScript support
- ✅ Clear documentation and examples
- ✅ Backward compatibility ensures no breaking changes

## Example: Migrating the Camera Button

```typescript
// Before
const handleCameraButtonClick = async () => {
  if (!userImageFile || !apparelImageFile) {
    showToast('Please upload both images', 'warning')
    return
  }
  
  setIsCapturing(true)
  setShowPolaroid(true)
  setHasError(false)
  
  // ... complex API logic
}

// After (Bridge Layer)
const { state, actions } = useBridgeLayer({
  callbacks: {
    onError: (error) => showToast(error, 'error'),
    onSuccess: (message) => showToast(message, 'success')
  }
})

// Simply call actions.generate() - all validation, error handling, 
// state management, and progress tracking is handled automatically
<button 
  onClick={actions.generate}
  disabled={!state.canGenerate}
  className={state.isLoading ? 'loading' : ''}
>
  {state.isLoading ? `${state.progressMessage} (${state.progress}%)` : 'Generate'}
</button>
```

## Getting Help

The bridge layer includes built-in migration assistance:

```typescript
const compatibility = useLegacyPageInterface({ showDeprecationWarnings: true })

// Get migration guide
const guide = compatibility.migration.migrateToNewInterface()
console.log(guide.stateMapping) // Shows how to map old state to new
console.log(guide.actionMapping) // Shows how to map old actions to new
console.log(guide.enhancedFeatures) // Lists new features available

// Check deprecation warnings
console.log(compatibility.migration.deprecationWarnings)
```