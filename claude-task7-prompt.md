# Claude Code Task 7: CSS Modules and Styling System Implementation

## Objective
Complete Task 7 from `.taskmaster/tasks/tasks.json` - "Create CSS Modules and Styling System" with all 5 subtasks, ensuring comprehensive implementation of mobile-first responsive design with brutalist aesthetics.

## Task Details
**Task 7**: Create CSS Modules and Styling System
- **Description**: Implement the complete styling system with mobile-first responsive design and brutalist aesthetics
- **Priority**: Medium
- **Dependencies**: Task 6 (Upload and Next Button Components)
- **Status**: Pending

### Required Subtasks (All must be completed):
1. **7.1**: Setup CSS Variables and Design Tokens
2. **7.2**: Implement Mobile-First Responsive Grid System  
3. **7.3**: Create Brutalist Component Styles
4. **7.4**: Implement CSS Animations and State Transitions
5. **7.5**: Add Accessibility Focus Styles and PostCSS Configuration

## Implementation Requirements

### Core Specifications
- **File**: Create `src/mobile/components/UploadAngle/styles/upload.module.css`
- **Approach**: Mobile-first responsive design using CSS Custom Properties
- **Aesthetic**: Brutalist styling with sharp borders, drop shadows (4px 4px 0px #0066cc), bold typography
- **Layout**: CSS Grid and Flexbox for responsive layouts
- **Animations**: CSS animations using transform and opacity for performance
- **Accessibility**: Proper focus styles and contrast compliance
- **Processing**: PostCSS for vendor prefixing and optimization

### Design System Colors
- Primary: #ff69b4 (Pink)
- Secondary: #0066cc (Blue) 
- Border: #000000 (Black)
- Shadow: 4px 4px 0px #0066cc (Brutalist drop shadow)

### Responsive Breakpoints
- Mobile-first starting at 320px
- Tablet: 768px
- Desktop: 1024px
- Large: 1440px

## Completion Criteria
1. ✅ All 5 subtasks completed with working implementations
2. ✅ CSS validates with no errors
3. ✅ Visual regression tests pass across mobile devices
4. ✅ Accessibility contrast ratios meet WCAG 2.1 AA (minimum 4.5:1)
5. ✅ Animation performance maintains 60fps
6. ✅ PostCSS configuration optimizes bundle size
7. ✅ Type safety verified with `pnpm type-check`
8. ✅ Code quality verified with `pnpm lint`

## Testing Requirements
After task completion, run comprehensive Home View regression tests:
- `pnpm type-check` - Verify TypeScript compilation
- `pnpm lint` - Ensure code quality standards
- `pnpm test` - Run all unit and integration tests
- Visual regression testing for existing Home View components
- Accessibility testing to ensure no regressions

## Implementation Notes
- Follow existing project structure in `src/mobile/components/UploadAngle/`
- Use CSS Modules for styling isolation
- Implement mobile-first responsive design patterns
- Ensure brutalist aesthetics align with design system
- Include proper fallbacks for older browsers
- Optimize for performance with minimal reflows/repaints
- Maintain accessibility standards throughout

## Success Metrics
- Zero linting errors or TypeScript compilation issues
- All animations run at 60fps on mobile devices
- CSS bundle size optimized through PostCSS
- No visual regressions in existing Home View
- WCAG 2.1 AA accessibility compliance maintained
- Responsive design works across all target breakpoints

Begin implementation immediately, complete all subtasks in sequence, and verify with the specified testing commands.
