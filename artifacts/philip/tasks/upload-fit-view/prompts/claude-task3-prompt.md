# Task 3: Create Mobile Upload Button Component - Claude Code Prompt

## Context
You are implementing **Task 3: Create Mobile Upload Button Component** for the Upload Your Fit mobile view. This task adapts the existing UploadButton component from UploadAngle with fit-specific text and enhanced mobile accessibility following 2025 WCAG 2.2 standards.

## Task Overview
- **Task ID**: 3
- **Status**: pending → in-progress
- **Dependencies**: Task 1 (completed)
- **Priority**: medium
- **Complexity**: 4/10

## Implementation Requirements

### 1. Component Structure
- **Location**: `src/mobile/components/UploadFit/components/MobileUploadButton.tsx`
- **Base**: Adapt from `src/mobile/components/UploadAngle/components/UploadButton.tsx`
- **Types**: Extend from `src/mobile/components/UploadAngle/types/upload.types.ts`
- **Styles**: Create `MobileUploadButton.module.css` with brutalist design

### 2. Visual Design (Brutalist System)
```css
/* Core styling requirements */
background-color: #ff69b4;  /* Pink background */
color: #000;                /* Black text */
border: 2px solid #000;     /* Black border */
box-shadow: 3px 3px 0px #0066cc;  /* Blue drop shadow */
font-weight: 900;           /* Bold typography */
min-height: 44px;           /* Touch target compliance */
```

### 3. State Management
- **Default**: "Upload Your Fit"
- **Loading**: "Uploading..." with spinner
- **Success**: "Re-Do" (transforms to redo state)
- **Integration**: Use `useFitUpload` hook (similar to `useAngleUpload`)

### 4. WCAG 2.2 Compliance
- **Touch Targets**: Minimum 24x24px (preferably 44x44px)
- **Color Contrast**: 4.5:1 ratio between pink background and black text
- **Focus Indicators**: Visible outline with 3px solid #ffff00
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Space/Enter activation

### 5. Mobile Enhancements
- **Haptic Feedback**: Web Vibration API integration
- **Performance**: 60fps animations using GPU acceleration
- **Responsive**: Adapt to different screen sizes
- **Touch Optimization**: Enhanced touch interactions

## Implementation Steps

### Step 1: Base Component Structure (Subtask 3.1)
1. Create `MobileUploadButton.tsx` with TypeScript interface
2. Define `MobileUploadButtonProps` extending base button props
3. Implement state management for upload states
4. Set up basic JSX structure with conditional rendering

### Step 2: Visual Design Implementation (Subtask 3.2)
1. Create `MobileUploadButton.module.css` with brutalist styling
2. Implement state-specific visual changes
3. Add CSS transitions and transforms for smooth animations
4. Ensure responsive design for mobile devices

### Step 3: Accessibility Compliance (Subtask 3.3)
1. Implement minimum touch target dimensions
2. Verify color contrast ratios
3. Add comprehensive ARIA labeling
4. Implement keyboard navigation support

### Step 4: Haptic Feedback (Subtask 3.4)
1. Integrate Web Vibration API
2. Add feature detection and fallback handling
3. Implement different vibration patterns for interactions
4. Ensure accessibility compatibility

### Step 5: Loading States & Integration (Subtask 3.5)
1. Create animated loading spinner component
2. Integrate with `useFitUpload` hook
3. Implement proper state transitions
4. Add aria-live regions for screen readers

## Key Files to Reference
- **Base Component**: `src/mobile/components/UploadAngle/components/UploadButton.tsx`
- **Types**: `src/mobile/components/UploadAngle/types/upload.types.ts`
- **Styles**: `src/mobile/components/UploadAngle/components/UploadButton.module.css`
- **Hook Pattern**: `src/mobile/components/UploadAngle/hooks/useAngleUpload.tsx`
- **Test Examples**: `src/mobile/components/UploadAngle/__tests__/components/UploadButton.test.tsx`

## Testing Requirements
- **Unit Tests**: Component rendering, prop validation, state management
- **Accessibility**: axe-core testing, WCAG 2.2 compliance verification
- **Visual**: CSS property validation, state transition testing
- **Mobile**: Haptic functionality, performance validation
- **Integration**: useFitUpload hook integration testing

## Taskmaster Integration
**CRITICAL**: You MUST update task status using Taskmaster AI as you work:

1. **Start Task**: `set_task_status --id=3 --status=in-progress`
2. **Complete Subtasks**: `set_task_status --id=3.1 --status=done` (repeat for each subtask)
3. **Update Progress**: `update_subtask --id=3.X --prompt="Implementation details and findings"`
4. **Final Completion**: Only mark Task 3 as `done` when ALL subtasks are complete AND:
   - TypeScript compilation passes (`npm run type-check`)
   - Linting passes (`npm run lint`)
   - Tests pass (`npm run test`)
   - Build succeeds (`npm run build`)

## Success Criteria
- [ ] Component renders with correct brutalist styling
- [ ] All three states (default, loading, success) work correctly
- [ ] WCAG 2.2 compliance verified
- [ ] Mobile haptic feedback functional
- [ ] Integration with useFitUpload hook complete
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] Build succeeds without errors
- [ ] All subtasks marked complete in Taskmaster

## Notes
- Reuse existing patterns from UploadAngle components
- Maintain consistency with existing mobile component architecture
- Focus on mobile-first design and accessibility
- Ensure smooth animations and transitions
- Test on actual mobile devices when possible

Begin implementation with Subtask 3.1 and work through each step systematically.