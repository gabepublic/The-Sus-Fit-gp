# Business Layer Architecture

## Purpose

The business layer contains **smart React Query hooks** that encapsulate all business logic, data transformation, error handling, and state management. This layer is the "brain" of the application.

## Directory Structure

```
src/business-layer/
├── queries/
│   ├── useTryonImageQuery.ts      # Image generation queries
│   ├── useImageProcessingQuery.ts  # Image processing queries
│   └── index.ts                   # Re-exports
├── mutations/
│   ├── useTryonMutation.ts        # Try-on generation mutations
│   ├── useImageUploadMutation.ts  # Image upload mutations
│   └── index.ts                   # Re-exports
├── providers/
│   ├── QueryProvider.tsx          # React Query configuration
│   └── index.ts                   # Re-exports
└── types/
    ├── tryon.ts                   # Try-on related types
    ├── image.ts                   # Image processing types
    └── index.ts                   # Re-exports
```

## Smart React Query Hooks Pattern

### useMutation Example
```typescript
// business-layer/mutations/useTryonMutation.ts
export const useTryonMutation = () => {
  const { showToast } = useToast()
  
  return useMutation({
    mutationFn: async ({ userFile, apparelFile }: TryonInput) => {
      // 🧠 BUSINESS LOGIC HERE
      
      // 1. Validate files
      validateImageFiles([userFile, apparelFile])
      
      // 2. Process images (resize, compress)
      const [processedUser, processedApparel] = await Promise.all([
        processImageForTryon(userFile),
        processImageForTryon(apparelFile)
      ])
      
      // 3. Convert to API format
      const [modelB64, apparelB64] = await Promise.all([
        fileToBase64(processedUser).then(b64 => compressBase64(b64, 2048)),
        fileToBase64(processedApparel).then(b64 => compressBase64(b64, 2048))
      ])
      
      // 4. Make API call
      const response = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          modelImage: modelB64, 
          apparelImages: [apparelB64] 
        }),
      })
      
      if (!response.ok) {
        throw new TryonApiError(response.status, await response.text())
      }
      
      const { img_generated } = await response.json()
      
      // 5. Post-process result
      return {
        generatedImage: img_generated,
        metadata: {
          timestamp: new Date().toISOString(),
          inputFiles: {
            user: userFile.name,
            apparel: apparelFile.name
          }
        }
      }
    },
    
    // 🧠 BUSINESS LOGIC: Error handling
    onError: (error) => {
      if (error instanceof TryonApiError) {
        showToast(mapErrorToUserMessage(error), 'error')
      } else if (error instanceof CompressionFailedError) {
        showToast('Image too large after compression', 'error')
      } else {
        showToast('Try-on generation failed', 'error')
      }
    },
    
    // 🧠 BUSINESS LOGIC: Success handling
    onSuccess: (data) => {
      showToast('Your try-on is ready!', 'success')
      // Could trigger analytics, caching, etc.
    },
    
    // 🧠 BUSINESS LOGIC: Retry configuration
    retry: (failureCount, error) => {
      if (error instanceof TryonApiError && error.status === 400) {
        return false // Don't retry validation errors
      }
      return failureCount < 3
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
```

### useQuery Example
```typescript
// business-layer/queries/useImageProcessingQuery.ts
export const useImageProcessingQuery = (file: File | null) => {
  return useQuery({
    queryKey: ['image-processing', file?.name, file?.lastModified],
    queryFn: async () => {
      if (!file) throw new Error('No file provided')
      
      // 🧠 BUSINESS LOGIC HERE
      
      // 1. Validate file
      validateImageFile(file)
      
      // 2. Extract metadata
      const metadata = await extractImageMetadata(file)
      
      // 3. Generate preview
      const preview = await generateImagePreview(file, { maxWidth: 400 })
      
      // 4. Check dimensions and suggest optimizations
      const optimizations = suggestImageOptimizations(metadata)
      
      return {
        preview,
        metadata,
        optimizations,
        isReady: metadata.width >= 512 && metadata.height >= 512
      }
    },
    enabled: !!file,
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // 🧠 BUSINESS LOGIC: Error handling
    throwOnError: false,
    retry: (failureCount, error) => {
      // Don't retry file validation errors
      if (error instanceof FileValidationError) return false
      return failureCount < 2
    }
  })
}
```

## Business Logic Responsibilities

### ✅ What Business Layer Handles
- **Data Validation**: File types, sizes, formats
- **Data Transformation**: Image processing, format conversion
- **Error Handling**: User-friendly error messages, retry logic
- **State Management**: Loading states, caching strategies
- **Business Rules**: Validation rules, processing pipelines
- **Integration Logic**: API communication, response handling
- **Side Effects**: Notifications, analytics, logging

### ❌ What Business Layer Avoids
- **UI Logic**: Component rendering, styling, animations
- **Event Handling**: Click handlers, form submissions
- **Routing**: Navigation, URL management
- **Platform-Specific Code**: DOM manipulation, localStorage

## Error Handling Strategy

```typescript
// Custom error types for business logic
export class TryonApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'TryonApiError'
  }
}

export class FileValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FileValidationError'
  }
}

// Business logic error mapping
export const mapErrorToUserMessage = (error: Error): string => {
  if (error instanceof TryonApiError) {
    switch (error.status) {
      case 400: return 'Invalid image format. Please upload JPG or PNG files.'
      case 429: return 'Too many requests. Please wait a moment and try again.'
      case 500: return 'Service temporarily unavailable. Please try again later.'
      default: return 'Try-on generation failed. Please try again.'
    }
  }
  
  if (error instanceof FileValidationError) {
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}
```

## Testing Strategy

Business layer hooks can be tested independently:

```typescript
// __tests__/business-layer/useTryonMutation.test.ts
describe('useTryonMutation', () => {
  it('processes images and calls API correctly', async () => {
    const { result } = renderHook(() => useTryonMutation())
    
    await act(async () => {
      await result.current.mutateAsync({
        userFile: mockUserFile,
        apparelFile: mockApparelFile
      })
    })
    
    expect(mockApiCall).toHaveBeenCalledWith({
      modelImage: expect.stringMatching(/^data:image/),
      apparelImages: [expect.stringMatching(/^data:image/)]
    })
  })
})
```

## Benefits

1. **Single Source of Truth**: All business logic in one place
2. **Reusable**: Same logic works across different UIs
3. **Testable**: Can test business logic without UI
4. **Maintainable**: Changes to business rules happen in one place
5. **Scalable**: Easy to add new business logic without affecting UI