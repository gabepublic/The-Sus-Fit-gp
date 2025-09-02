# Task 4: Custom React Hooks Implementation

## Context
Implement Task 4 and all subtasks from the UploadAngle isolation strategy. Project structure: `/src/mobile/components/UploadAngle/hooks/`. Dependencies (Tasks 1-3) are complete.

## Requirements
**Primary Goal**: Create two React hooks:
1. `useAngleUpload.tsx` - Upload state management with useReducer
2. `useImageProcessing.tsx` - Client-side image compression with Canvas API

**Technical Constraints**:
- TypeScript 5.x with strict mode
- React 18 features (useTransition, concurrent rendering)
- Memory management (blob URLs, cleanup)
- Error boundaries and recovery
- Comprehensive JSDoc documentation

## Implementation Checklist

### Subtask 4.1: useAngleUpload Hook Foundation
- [ ] Create `src/mobile/components/UploadAngle/hooks/useAngleUpload.tsx`
- [ ] Define TypeScript interfaces: `UploadState`, `UploadActions`, `UseUploadReturn`
- [ ] Setup useReducer with initial state structure
- [ ] Add JSDoc documentation for all interfaces

### Subtask 4.2: Upload State Management
- [ ] Implement reducer with actions: START_UPLOAD, UPDATE_PROGRESS, SUCCESS, ERROR, RESET
- [ ] Add React 18 useTransition for non-blocking updates
- [ ] Ensure immutable state updates
- [ ] Include file metadata handling

### Subtask 4.3: Progress Tracking & Error Recovery
- [ ] Add progress percentage calculation and time estimation
- [ ] Implement retry logic with exponential backoff
- [ ] Create cleanup functions for blob URLs and FormData
- [ ] Use useCallback/useMemo for performance optimization

### Subtask 4.4: useImageProcessing Hook
- [ ] Create `src/mobile/components/UploadAngle/hooks/useImageProcessing.tsx`
- [ ] Detect OffscreenCanvas support, fallback to Canvas API
- [ ] Implement image compression with quality controls
- [ ] Add resize functionality maintaining aspect ratio
- [ ] Include JPEG/WebP format conversion

### Subtask 4.5: Memory Management & Cleanup
- [ ] Add useEffect cleanup functions
- [ ] Implement AbortController for upload cancellation
- [ ] Blob URL revocation and canvas context cleanup
- [ ] Memory leak detection in development mode

## Expected File Structure
```
src/mobile/components/UploadAngle/hooks/
├── useAngleUpload.tsx
├── useImageProcessing.tsx
├── index.ts (barrel exports)
└── __tests__/
    ├── useAngleUpload.test.tsx
    └── useImageProcessing.test.tsx
```

## Quality Gates
- [ ] TypeScript compilation: `pnpm type-check`
- [ ] Linting compliance: `pnpm lint`
- [ ] Unit tests for all hooks with React Testing Library
- [ ] Memory leak validation with React DevTools Profiler
- [ ] All subtasks marked as 'done' in TaskMaster

## Post-Implementation
After completing Task 4, run comprehensive Home View regression tests to ensure no impact on existing functionality.

**Priority**: High | **Dependencies**: Tasks 1-3 (completed) | **Current Status**: pending

Start with subtask 4.1 and progress sequentially through all subtasks until the entire task is complete.
