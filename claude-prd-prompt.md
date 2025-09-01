# Claude Code Prompt: Generate PRD-Upload-Your-Angle-View.md

Generate a comprehensive Product Requirements Document for the "Upload Your Angle View" mobile component. This PRD will be processed by TaskMaster AI to create development tasks.

## Context
- **Target Application**: Next.js web app with isolated mobile views
- **Component**: Mobile Upload Your Angle View (route: `/upload-angle`)
- **Architecture**: Isolated from main app and HomeView to prevent regressions
- **Design Style**: Brutalist with black borders, pink buttons, blue drop shadows
- **Reference Image**: `docs/assets/mobile/reference-images/UploadYourAngleViewBefore.png`

## Isolation Requirements (CRITICAL)
Follow the UPLOAD_ANGLE_ISOLATION_STRATEGY.md guidelines:
- Create ALL components in `src/mobile/components/UploadAngle/` subdirectories
- NO modifications to existing HomeView components
- Separate TypeScript types, hooks, utilities, and styling
- Independent error boundaries and state management
- Zero impact on main application or HomeView functionality

## Required Directory Structure
```
src/mobile/components/UploadAngle/
├── containers/UploadAngleContainer.tsx
├── components/PhotoFrame.tsx, UploadButton.tsx, NextButton.tsx
├── hooks/useAngleUpload.tsx, useImageProcessing.tsx
├── utils/imageValidation.ts, uploadHelpers.ts
├── types/upload.types.ts
└── styles/upload.module.css
```

## UI Components Specification
1. **Photo Frame**: Rounded corners, black border, brutalist blue drop shadow, placeholder with upload icon overlay
2. **Upload Your Angle Button**: Pink background, black text/border, blue drop shadow, overlaid on frame
3. **Re-Do Button**: Replaces upload button after image upload
4. **Next Button**: Appears below frame after upload, navigates to Upload Your Fit View

## Core Functionality
- Image upload with validation and preview
- Button state management (Upload → Re-Do)
- Navigation to next view (/upload-fit)
- Mobile-optimized touch interactions
- Error handling and user feedback

## Technical Requirements
- TypeScript with strict typing
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1 AA)
- Performance optimization for mobile devices
- Integration with existing mobile router and header

## Testing Strategy
- Unit tests for all components and hooks
- Integration tests for upload flow
- Visual regression tests to protect HomeView
- E2E tests for complete user journey
- Accessibility testing

Generate a detailed PRD with specific tasks covering: setup, component development, styling, functionality implementation, testing, and integration - all while maintaining complete isolation from existing components.

