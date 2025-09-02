# Claude Code Task 6 Prompt

## Context
You are implementing **Task 6: Implement Upload and Next Button Components** for the Upload Angle feature in a Next.js application. This task focuses on creating interactive button components with brutalist styling and state-based behavior for the upload workflow.

## Current State
- **Previous Tasks Completed**: Tasks 1-5 (directory structure, TypeScript types, canvas utilities, React hooks, PhotoFrame component)
- **Target Location**: `src/mobile/components/UploadAngle/components/`
- **Dependencies**: Task 5 (PhotoFrame Component) is complete
- **Status**: Ready to implement upload and next button components

## Task Requirements

### Core Functionality
Create two interactive button components with brutalist design system:

1. **UploadButton Component** (`components/UploadButton.tsx`):
   - File upload trigger with drag-and-drop support
   - State management (default, loading, success, disabled)
   - Accessibility features and keyboard navigation
   - Touch feedback and responsive design

2. **NextButton Component** (`components/NextButton.tsx`):
   - Workflow progression button
   - Context-aware enabling/disabling based on upload state
   - Visual feedback for user interactions
   - Integration with PhotoFrame component state

3. **Brutalist Design System**:
   - Colors: Pink (#ff69b4) background, black (3px) borders, blue (#0066cc) shadows
   - Typography: System fonts with bold weights
   - High contrast for accessibility compliance
   - Minimum 44px touch targets for mobile

### Implementation Details
- **Component Structure**: Isolated UploadAngle component system
- **Styling**: CSS Modules for styling isolation (UploadButton.module.css, NextButton.module.css)
- **TypeScript**: Strict typing with proper interfaces
- **State Management**: React hooks (useState, useCallback) for component state
- **Framework**: Next.js App Router with React functional components

### Quality Gates
**ALL MUST PASS BEFORE COMPLETION:**
1. **Type Checking**: `pnpm type-check` must pass with 0 errors
2. **Linting**: `pnpm lint` must pass with 0 errors/warnings  
3. **Testing**: All existing tests must continue to pass
4. **Accessibility**: WCAG 2.1 AA compliance for button components
5. **Design System**: Visual compliance with brutalist design specifications

## Completion Requirements

### Development Steps
1. **Create UploadButton Component**:
   - Build UploadButton.tsx with TypeScript interfaces
   - Implement CSS Modules styling with brutalist design
   - Add state management and smooth transitions
   - Include accessibility features and keyboard navigation

2. **Create NextButton Component**:
   - Build NextButton.tsx with proper component structure
   - Apply brutalist styling consistent with UploadButton
   - Implement state synchronization with PhotoFrame
   - Add touch feedback and interaction states

3. **Integration & Testing**:
   - Test button interactions and state management
   - Verify design system compliance
   - Validate accessibility features
   - Ensure proper integration with existing components

### Final Validation
After implementation completion:
1. **Run Quality Checks**:
   ```bash
   pnpm type-check  # Must pass with 0 errors
   pnpm lint       # Must pass with 0 errors/warnings
   ```

2. **Execute Test Suite**:
   ```bash
   # Run all tests to ensure no regressions
   pnpm test
   # Focus on UploadAngle component tests
   pnpm test -- --testPathPattern="UploadAngle|upload"
   ```

3. **Verify Integration**:
   - Components render without errors
   - Button states function correctly
   - Accessibility features work as expected
   - Design system compliance maintained
   - No console errors or warnings

## Success Criteria
- ✅ UploadButton component with brutalist styling and file upload functionality
- ✅ NextButton component with state-based enabling/disabling
- ✅ CSS Modules implementation for styling isolation
- ✅ Smooth transitions and touch feedback animations
- ✅ Accessibility compliance (keyboard navigation, ARIA attributes)
- ✅ Type checking passes without errors
- ✅ Linting passes without warnings
- ✅ All tests pass (including regression tests)
- ✅ Integration with PhotoFrame component state

## Important Notes
- **Isolated System**: Components are part of UploadAngle isolated component system
- **Brutalist Design**: Strict adherence to specified color scheme and styling
- **Mobile-First**: Optimized for touch interactions on mobile devices
- **State Management**: Proper handling of upload workflow states
- **Performance**: Efficient re-rendering and smooth user interactions

Remember: Focus on creating robust, accessible button components that fit seamlessly into the upload workflow while maintaining the distinctive brutalist design aesthetic.
