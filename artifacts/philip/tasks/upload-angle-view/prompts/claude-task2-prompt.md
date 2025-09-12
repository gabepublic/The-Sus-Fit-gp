# Task 2: Implement PhotoFrame Component with 3:4 Aspect Ratio

## Context
You are working on Task 2 of the Upload Your Fit View implementation. This task involves adapting the existing PhotoFrame component from UploadAngle for fit-specific requirements with a portrait 3:4 aspect ratio, brutalist styling, and mobile-optimized interactions.

## Current State
- **Existing PhotoFrame**: Located at `src/mobile/components/UploadAngle/components/PhotoFrame.tsx`
- **Current Aspect Ratio**: 4:3 (landscape)
- **Target Aspect Ratio**: 3:4 (portrait) for fit photos
- **Styling**: Currently uses styled-components with brutalist design
- **Dependencies**: Task 1 must be completed first

## Task Requirements

### Primary Objectives
1. **Update PhotoFrame Component Structure and Styling** (Subtask 2.1)
   - Change aspect ratio from 4:3 to 3:4 for portrait fit photos
   - Implement brutalist design: `border-radius: 16px`, `2px solid black border`, `4px 4px 0px #0066cc` drop shadow
   - Update container styling to maintain aspect ratio across screen sizes
   - Ensure proper positioning and overflow handling

2. **Implement PhotoFrame State Management System** (Subtask 2.2)
   - Create four distinct states: empty, uploading, loaded, error
   - Add fit-specific upload icon for empty state
   - Implement progress spinner with percentage for uploading state
   - Add proper image cropping logic for loaded state
   - Include retry option with clear messaging for error state

3. **Add Touch Interactions and Accessibility Features** (Subtask 2.3)
   - Add button role for accessibility compliance
   - Implement touch feedback with scale animation using CSS transforms
   - Ensure minimum 44px touch target size for mobile usability
   - Add proper ARIA labels and descriptions for screen readers
   - Implement focus management and keyboard navigation support

4. **Optimize Animations and Performance** (Subtask 2.4)
   - Use CSS transform and opacity properties for GPU acceleration
   - Implement scale animation for touch feedback using `transform: scale()`
   - Add container queries for responsive behavior where supported
   - Optimize animation performance to maintain 60fps on mobile devices
   - Use `will-change` property strategically for GPU usage

5. **Integrate Component with Upload Workflow** (Subtask 2.5)
   - Implement file selection and upload handling specific to fit photos
   - Add image validation for appropriate formats and sizes
   - Connect to image processing pipeline with proper error handling
   - Implement preview functionality with proper image orientation handling
   - Add integration with existing upload infrastructure

## Technical Specifications

### Aspect Ratio Implementation
```css
/* Use CSS aspect-ratio property with fallback */
aspect-ratio: 3 / 4;

/* Fallback for older browsers */
@supports not (aspect-ratio: 1) {
  &::before {
    content: '';
    display: block;
    padding-bottom: 133.33%; /* 4/3 * 100% */
  }
}
```

### Brutalist Styling
```css
border-radius: 16px;
border: 2px solid #000000;
box-shadow: 4px 4px 0px #0066cc;
```

### Touch Interactions
```css
/* Scale animation for touch feedback */
&:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* GPU acceleration */
will-change: transform;
```

## File Structure
```
src/mobile/components/UploadAngle/components/
├── PhotoFrame.tsx (modify existing)
├── PhotoFrame.module.css (create new)
└── types/upload.types.ts (update types)
```

## Testing Requirements
- Component unit tests with React Testing Library
- Visual regression tests for aspect ratio accuracy
- Touch interaction testing on mobile devices
- Accessibility testing with screen readers
- Animation performance testing at 60fps
- Cross-browser mobile compatibility testing

## Development Workflow

### Step 1: Update Component Structure
1. Modify `PhotoFrame.tsx` to support 3:4 aspect ratio
2. Update styling to implement brutalist design elements
3. Ensure responsive behavior across mobile viewports

### Step 2: Implement State Management
1. Add fit-specific upload icon for empty state
2. Implement progress spinner for uploading state
3. Add proper image cropping for loaded state
4. Create retry functionality for error state

### Step 3: Add Touch Interactions
1. Implement scale animation for touch feedback
2. Add proper accessibility attributes
3. Ensure minimum touch target size compliance
4. Add keyboard navigation support

### Step 4: Optimize Performance
1. Implement GPU-accelerated animations
2. Add container queries for responsive behavior
3. Optimize for 60fps performance
4. Add proper cleanup for memory management

### Step 5: Integration Testing
1. Connect to upload workflow
2. Add image validation
3. Implement preview functionality
4. Test error handling scenarios

## Quality Assurance

### Before Marking Complete
- [ ] All subtasks (2.1-2.5) are completed
- [ ] Type checking passes: `pnpm run type-check`
- [ ] Linting passes: `pnpm run lint`
- [ ] Tests pass: `pnpm run test:unit`
- [ ] Build succeeds: `pnpm run build`
- [ ] Component renders correctly with 3:4 aspect ratio
- [ ] All states (empty, uploading, loaded, error) work properly
- [ ] Touch interactions are responsive and accessible
- [ ] Animations are smooth and performant
- [ ] Integration with upload workflow is functional

### Task Status Management
- **CRITICAL**: Update task and subtask statuses as you work
- Use `mcp_task-master-ai_set_task_status` to mark subtasks as `in-progress` when starting
- Use `mcp_task-master-ai_set_task_status` to mark subtasks as `done` when completed
- **Task 2 is only complete when ALL subtasks are done AND all quality checks pass**

## Available Commands
- `pnpm run type-check` - TypeScript type checking
- `pnpm run lint` - ESLint code linting
- `pnpm run test:unit` - Run unit tests
- `pnpm run test:coverage` - Run tests with coverage
- `pnpm run build` - Build the project
- `pnpm run dev` - Start development server

## Notes
- Maintain backward compatibility with existing UploadAngle usage
- Follow existing code patterns and styling conventions
- Use the existing test structure as a template for new tests
- Ensure all changes are properly documented and commented
- Consider mobile performance implications for all animations and interactions

**Remember**: This is a complex task with multiple subtasks. Work systematically through each subtask, update statuses regularly, and ensure all quality checks pass before marking the main task as complete.