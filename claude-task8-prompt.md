# Claude Code - Task 8: Build Main Container Component

## Context
You are implementing Task 8 from the project's task management system. This task focuses on building the main UploadAngleContainer component that integrates all previously created components into a complete upload workflow.

## Task Scope
**Primary Goal**: Build containers/UploadAngleContainer.tsx as the main orchestrating component that integrates all child components with proper state management and event handling.

**Task Requirements from .taskmaster/tasks/tasks.json:**
- Integrate all child components (PhotoFrame, UploadButton, NextButton) with proper state management
- Add error boundary with components/ErrorBoundary.tsx for graceful error handling  
- Implement complete upload workflow from file selection through preview and navigation
- Include proper loading states, progress indication, and error recovery
- Use React's Error Boundaries and Suspense for robust error handling

## Subtasks to Complete (All Required)
1. **Create UploadAngleContainer.tsx structure and state management** - Build main container with useReducer for upload workflow states
2. **Integrate child components with proper props and event handlers** - Connect PhotoFrame, UploadButton, NextButton with proper data flow
3. **Implement complete upload workflow orchestration** - End-to-end upload process with validation, processing, state transitions
4. **Create ErrorBoundary component with graceful error handling** - React Error Boundary for catching component errors
5. **Add loading states, progress indication, and Suspense integration** - Comprehensive loading states with React Suspense

## Technical Requirements
- **File Path**: `src/mobile/components/UploadAngle/containers/UploadAngleContainer.tsx`
- **Error Boundary Path**: `src/mobile/components/UploadAngle/components/ErrorBoundary.tsx`
- **State Management**: Use useReducer for complex state transitions
- **Hooks Integration**: Use existing useAngleUpload and useImageProcessing hooks
- **TypeScript**: Full type safety with comprehensive interfaces
- **Performance**: React 18 concurrent features, Suspense, proper cleanup

## Quality Assurance Requirements
After completing implementation:

1. **Type Safety Verification**: Run `pnpm type-check` - must pass with zero errors
2. **Linting Compliance**: Run `pnpm lint` - must pass with zero violations  
3. **Component Testing**: Write unit tests for all components and state management
4. **Integration Testing**: Test complete upload workflow functionality
5. **HomeView Regression Testing**: Run all existing HomeView tests to ensure no impact

## Implementation Approach
1. Start with UploadAngleContainer.tsx structure and state management using useReducer
2. Create comprehensive TypeScript interfaces for all state types and action creators
3. Integrate existing hooks (useAngleUpload, useImageProcessing) from previous tasks
4. Build ErrorBoundary component with proper error handling and recovery
5. Add child component integration with proper event handling and data flow
6. Implement loading states and Suspense boundaries
7. Ensure complete workflow from file selection to navigation works end-to-end

## Success Criteria
- [ ] All 5 subtasks completed and tested
- [ ] `pnpm type-check` passes without errors
- [ ] `pnpm lint` passes without violations
- [ ] Unit tests written and passing for new components
- [ ] Integration tests validate complete upload workflow
- [ ] Error boundary handles errors gracefully with fallback UI
- [ ] Loading states and progress indication work smoothly
- [ ] No impact on existing HomeView functionality (verified by running existing tests)
- [ ] Memory management and cleanup properly implemented
- [ ] React 18 concurrent features properly utilized

## Dependencies Available
This task builds on completed Tasks 1-7, so all necessary components, hooks, and utilities are already implemented:
- Typography types and interfaces (Task 2)
- Utility functions for validation and processing (Task 3)  
- Custom hooks: useAngleUpload, useImageProcessing (Task 4)
- PhotoFrame component (Task 5)
- UploadButton and NextButton components (Task 6)
- CSS modules and styling system (Task 7)

Begin implementation immediately. Focus on robust error handling, type safety, and seamless integration of all existing components into a cohesive upload workflow experience.
