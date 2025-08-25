# Bridge Layer (Custom Hooks)

## Purpose

The bridge layer contains **thin custom hooks** that serve as adapters between the UI components and the business layer. These hooks provide a simplified, UI-focused interface while keeping all business logic in the business layer.

## Directory Structure

```
src/hooks/
├── useTryonWorkflow.ts        # Main try-on workflow
├── useImageUpload.ts          # Image upload handling
├── useImageProcessing.ts      # Image processing status
├── usePolaroidDisplay.ts      # Polaroid component state
├── useFileValidation.ts       # File validation helpers
└── index.ts                   # Re-exports
```

## Bridge Hook Pattern

Bridge hooks are **thin wrappers** that:
1. Import smart business layer hooks
2. Provide UI-friendly interfaces
3. Manage UI-specific state
4. Transform data for UI consumption

### Example: useTryonWorkflow

```typescript
// hooks/useTryonWorkflow.ts
import { useTryonMutation } from '@/business-layer/mutations'
import { useState } from 'react'

export const useTryonWorkflow = () => {
  // UI-specific state (not business logic)
  const [showPolaroid, setShowPolaroid] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  
  // Import business logic from business layer
  const tryonMutation = useTryonMutation()
  
  // UI-friendly interface
  const startTryon = async (userFile: File, apparelFile: File) => {
    setShowPolaroid(true)
    setGeneratedImage(null)
    
    try {
      const result = await tryonMutation.mutateAsync({ userFile, apparelFile })
      setGeneratedImage(result.generatedImage)
    } catch (error) {
      // Error already handled in business layer
      console.error('Try-on failed:', error)
    }
  }
  
  const closePolaroid = () => {
    setShowPolaroid(false)
    setGeneratedImage(null)
  }
  
  // Return UI-friendly interface
  return {
    // UI State
    showPolaroid,
    generatedImage,
    isGenerating: tryonMutation.isPending,
    
    // UI Actions
    startTryon,
    closePolaroid,
    
    // Pass through business layer state (if needed)
    error: tryonMutation.error
  }
}
```

### Example: useImageUpload

```typescript
// hooks/useImageUpload.ts
import { useImageProcessingQuery } from '@/business-layer/queries'
import { useState, useCallback } from 'react'

export const useImageUpload = () => {
  // UI-specific state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Business layer processing
  const imageProcessing = useImageProcessingQuery(uploadedFile)
  
  // UI-friendly file handler
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file)
    
    // Create preview URL for UI
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // Cleanup previous URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])
  
  const clearUpload = () => {
    setUploadedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }
  
  return {
    // UI State
    file: uploadedFile,
    previewUrl,
    
    // Business State (transformed for UI)
    isProcessing: imageProcessing.isLoading,
    processingResult: imageProcessing.data,
    isReady: imageProcessing.data?.isReady ?? false,
    
    // UI Actions
    handleFileUpload,
    clearUpload,
    
    // Error state (simplified for UI)
    hasError: !!imageProcessing.error
  }
}
```

### Example: useFileValidation

```typescript
// hooks/useFileValidation.ts
import { validateImageFile } from '@/business-layer/utils'
import { useMemo } from 'react'

export const useFileValidation = (files: File[]) => {
  // Transform business validation for UI consumption
  const validation = useMemo(() => {
    const results = files.map(file => {
      try {
        validateImageFile(file) // Business layer validation
        return { file, isValid: true, error: null }
      } catch (error) {
        return { 
          file, 
          isValid: false, 
          error: error instanceof Error ? error.message : 'Invalid file'
        }
      }
    })
    
    return {
      allValid: results.every(r => r.isValid),
      results,
      invalidFiles: results.filter(r => !r.isValid),
      errors: results.filter(r => !r.isValid).map(r => r.error)
    }
  }, [files])
  
  return validation
}
```

## UI Integration Pattern

Components use bridge hooks for clean interfaces:

```typescript
// app/page.tsx (simplified)
export default function TryonPage() {
  const { 
    startTryon, 
    showPolaroid, 
    isGenerating, 
    generatedImage,
    closePolaroid 
  } = useTryonWorkflow()
  
  const userUpload = useImageUpload()
  const apparelUpload = useImageUpload()
  
  const validation = useFileValidation([
    userUpload.file, 
    apparelUpload.file
  ].filter(Boolean))
  
  const handleGenerate = () => {
    if (validation.allValid && userUpload.file && apparelUpload.file) {
      startTryon(userUpload.file, apparelUpload.file)
    }
  }
  
  return (
    <div>
      <UploadCard onFileUpload={userUpload.handleFileUpload} />
      <UploadCard onFileUpload={apparelUpload.handleFileUpload} />
      
      <Button 
        onClick={handleGenerate}
        disabled={!validation.allValid || isGenerating}
      >
        Generate Try-on
      </Button>
      
      {showPolaroid && (
        <PolaroidDisplay
          isGenerating={isGenerating}
          image={generatedImage}
          onClose={closePolaroid}
        />
      )}
    </div>
  )
}
```

## Bridge Layer Responsibilities

### ✅ What Bridge Layer Handles
- **UI State Management**: Show/hide states, UI-specific flags
- **Data Transformation**: Converting business data for UI consumption
- **Event Coordination**: Orchestrating multiple business operations
- **UI-Specific Logic**: Preview URLs, temporary state, animations
- **Interface Simplification**: Providing clean APIs for components

### ❌ What Bridge Layer Avoids
- **Business Logic**: Validation, processing, API calls
- **Data Fetching**: Direct API communication
- **Complex State**: Business rules, caching strategies
- **Error Handling**: Business error logic (only UI error display)

## Benefits

1. **Clean Component APIs**: Components have simple, focused interfaces
2. **Business Logic Isolation**: UI changes don't affect business logic
3. **Reusable Business Layer**: Same business hooks work with different UIs
4. **Testable Separation**: Can test UI and business logic independently
5. **Easy Refactoring**: Can change UI patterns without touching business logic

## Testing Strategy

Bridge hooks focus on UI integration testing:

```typescript
// __tests__/hooks/useTryonWorkflow.test.ts
describe('useTryonWorkflow', () => {
  it('manages polaroid display state correctly', () => {
    const { result } = renderHook(() => useTryonWorkflow())
    
    expect(result.current.showPolaroid).toBe(false)
    
    act(() => {
      result.current.startTryon(mockUserFile, mockApparelFile)
    })
    
    expect(result.current.showPolaroid).toBe(true)
  })
})
```

Business logic testing happens in the business layer, UI state testing happens here.