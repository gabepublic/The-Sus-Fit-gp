# Claude Code Task 9: Next.js Routing & Mobile Infrastructure Integration

## Task Overview
Complete Task 9 from `.taskmaster/tasks/tasks.json`: **"Integrate with Next.js Routing and Mobile Infrastructure"**

Setup the `/upload-angle` route and integrate with existing mobile navigation system. This includes all 5 subtasks (9.1-9.5) with complete testing and validation.

## Current Context
- Working on UploadAngle component system in an isolated architecture
- Project uses Next.js with TypeScript and follows brutalist design principles
- Mobile-first responsive design with existing navigation infrastructure
- Must maintain complete isolation from HomeView components

## Task Requirements

### Primary Objectives
1. **Route Structure Setup (9.1)**
   - Identify Next.js version (Pages vs App Router)
   - Create appropriate route file: `pages/upload-angle.tsx` OR `app/upload-angle/page.tsx`
   - Configure TypeScript and export structure

2. **Mobile Navigation Integration (9.2)**
   - Integrate existing mobile header component
   - Configure back navigation functionality
   - Add upload progress indication to header
   - Implement navigation state management

3. **Error Boundaries & Loading States (9.3)**
   - Create route-level error boundaries
   - Implement loading states for transitions
   - Add fallback UI for error scenarios
   - Configure error logging and recovery

4. **SEO & Meta Configuration (9.4)**
   - Add proper meta tags using Next.js Head or metadata
   - Configure Open Graph and Twitter Card tags
   - Implement dynamic meta generation
   - Add canonical URLs and viewport settings

5. **Route Guards & Navigation Flow (9.5)**
   - Implement route protection logic
   - Configure Next.js Image optimization
   - Add navigation confirmation for unsaved changes
   - Integrate with existing app routing flow

### Quality Assurance Requirements
- **Type Safety**: Run `pnpm type-check` - zero TypeScript errors
- **Code Quality**: Run `pnpm lint` - zero linting violations  
- **Test Coverage**: All new components and logic must have tests
- **Isolation**: Verify no impact on existing HomeView functionality

## Implementation Strategy

### Phase 1: Route Discovery & Setup
1. Examine `package.json` and existing route structure to determine Next.js version
2. Check existing mobile navigation components in `src/mobile/`
3. Create appropriate route file with proper TypeScript configuration
4. Import and integrate UploadAngleContainer from previous tasks

### Phase 2: Mobile Infrastructure Integration
1. Locate and analyze existing mobile header component
2. Integrate header with back navigation and progress indicators
3. Ensure consistent mobile UI patterns and responsive behavior
4. Test navigation flows and state management

### Phase 3: Error Handling & Performance
1. Implement comprehensive error boundaries
2. Add loading states and skeleton components
3. Configure SEO optimization and meta tags
4. Set up route guards and navigation protection

### Phase 4: Validation & Testing
1. Run type checking: `pnpm type-check`
2. Run linting: `pnpm lint`
3. Test mobile navigation on various devices
4. Validate SEO with Lighthouse audit
5. Verify HomeView isolation with regression tests

## Key Files to Examine
- `package.json` - Next.js version and dependencies
- `src/app/` or `pages/` - Existing route structure
- `src/mobile/` - Mobile navigation components
- `src/mobile/components/UploadAngle/containers/UploadAngleContainer.tsx` - Main component
- Existing mobile header/navigation components

## Testing Requirements
- Route accessibility and configuration
- Mobile navigation functionality
- Error boundary activation with intentional errors
- Loading state transitions
- SEO meta tag validation with tools
- Social media sharing previews
- Route protection scenarios
- Navigation flow integration
- Image optimization performance
- Unsaved changes warning dialogs

## Completion Criteria
✅ All 5 subtasks (9.1-9.5) marked as complete
✅ Route accessible at `/upload-angle` 
✅ Mobile navigation integration working
✅ Error boundaries and loading states functional
✅ SEO meta tags properly configured
✅ Route guards and navigation flow integrated
✅ Type checking passes: `pnpm type-check`
✅ Linting passes: `pnpm lint`
✅ All tests pass including new route tests
✅ HomeView regression tests confirm no impact
✅ Mobile responsive behavior validated

## Final Validation
After completing Task 9, run comprehensive HomeView tests:
- `pnpm lint` - Ensure code quality maintained
- `pnpm type-check` - Verify type safety across project
- Execute regression test suite for HomeView functionality
- Validate mobile navigation and routing integration

Focus on efficiency, maintainability, and strict adherence to existing architecture patterns while ensuring the upload-angle route is fully functional and integrated.
