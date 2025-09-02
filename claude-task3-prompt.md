# Task 3: Implement Core Utility Functions

**CONTEXT**: This is a Next.js 15.3.3 React 19 TypeScript project with Jest/Playwright testing. You need to complete Task 3 and ALL subtasks (3.1-3.5), then run comprehensive Home View tests to ensure no regressions.

## TASK OVERVIEW
Create image validation, upload helpers, and constants utilities with comprehensive error handling:

### Required Files to Create:
1. `src/utils/imageValidation.ts` - File type, size, and dimension validation
2. `src/utils/uploadHelpers.ts` - Image compression and processing using Canvas API  
3. `src/utils/constants.ts` - Configuration values and application constants
4. Custom error classes with user-friendly messaging
5. Performance optimizations using modern browser APIs

### Technical Requirements:
- **Supported formats**: JPEG, PNG, WebP
- **Size limits**: 10MB max, 400x300 min resolution  
- **Browser APIs**: Canvas API, ImageBitmap, OffscreenCanvas (with fallbacks)
- **Error handling**: Custom error classes extending Error
- **Performance**: Web Worker support for CPU-intensive operations
- **TypeScript**: Full type safety with proper interfaces

## SUBTASKS TO COMPLETE:

### 3.1: Create Image Validation Utility (`src/utils/imageValidation.ts`)
```typescript
// Required functions:
- validateFileType(file: File): boolean
- validateFileSize(file: File): boolean  
- validateImageDimensions(file: File): Promise<boolean>
- validateImage(file: File): Promise<ValidationResult>

// Required interfaces:
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
```

### 3.2: Implement Upload Helper Functions (`src/utils/uploadHelpers.ts`)
```typescript
// Required functions:
- compressImage(file: File, quality?: number): Promise<Blob>
- createBlobUrl(blob: Blob): string
- revokeBlobUrl(url: string): void
- processImageFile(file: File): Promise<ProcessedImage>
- resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob>
```

### 3.3: Create Constants Configuration File (`src/utils/constants.ts`)
```typescript
// Required constants:
- IMAGE_VALIDATION_CONSTANTS (file types, size limits, dimensions)
- UPLOAD_CONFIG (compression settings, timeouts, retries)
- UI_CONSTANTS (animations, sizing, breakpoints)
```

### 3.4: Implement Comprehensive Error Handling
```typescript
// Required custom error classes:
- ImageValidationError extends Error
- CompressionError extends Error  
- FileProcessingError extends Error
- createUserFriendlyErrorMessage(error: Error): string
```

### 3.5: Add Performance Optimization and Modern APIs
- OffscreenCanvas implementation with Canvas fallback
- ImageBitmap usage for efficient processing
- Web Worker support preparation
- Memory cleanup mechanisms
- Performance monitoring hooks

## VALIDATION REQUIREMENTS:

### Type Safety & Linting:
```bash
pnpm type-check  # Must pass with 0 errors
pnpm lint       # Must pass with 0 warnings
```

### Testing Requirements:
```bash
# Unit tests for utility functions
pnpm test src/utils/

# Comprehensive Home View regression tests  
pnpm test:e2e tests/e2e/homeview-regression.spec.ts
```

## SUCCESS CRITERIA:
1. ✅ All 5 subtasks completed with comprehensive implementation
2. ✅ Type-safe code verified with `pnpm type-check`
3. ✅ Linting passes with `pnpm lint`
4. ✅ All utility function unit tests pass
5. ✅ Home View regression tests pass (no visual/functional impact)
6. ✅ Error handling covers all edge cases
7. ✅ Performance optimizations implemented with fallbacks

## IMPLEMENTATION NOTES:
- Use existing project patterns from `src/` directory
- Follow TypeScript strict mode requirements
- Include comprehensive JSDoc documentation
- Implement progressive enhancement for modern APIs
- Focus on mobile-first optimization (primary use case)
- Ensure memory-efficient blob URL management

**COMPLETE ALL SUBTASKS IN SEQUENCE, THEN RUN ALL SPECIFIED TESTS TO VERIFY NO REGRESSIONS.**
