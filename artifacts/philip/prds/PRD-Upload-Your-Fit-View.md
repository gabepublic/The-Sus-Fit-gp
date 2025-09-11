# Product Requirements Document: Upload Your Fit View Mobile Component

## Project Overview

### Vision
Create a completely isolated mobile "Upload Your Fit View" component that allows users to upload and preview their fit photos as part of the mobile onboarding flow, following the established brutalist design system and maintaining zero impact on existing HomeView functionality.

### Target Application
- **Platform**: Next.js web application with mobile-optimized views
- **Route**: `/m/upload-fit` (mobile route mapping from `/upload-fit`)
- **Integration**: Mobile onboarding flow between "Upload Your Angle View" and "Try-On Results"
- **Design System**: Brutalist aesthetic with black borders, pink buttons, blue drop shadows
- **Reference Image**: `docs/assets/mobile/reference-images/UploadYourFitViewAfter.png` (394x856px)

### Critical Success Factors
- **Complete Isolation**: Zero modifications to existing HomeView or main application components
- **Visual Consistency**: Matches brutalist design language established in mobile views
- **Component Reuse**: Leverage existing Upload Angle View components where possible
- **Mobile Performance**: Optimized for mobile devices with smooth interactions
- **Accessibility**: WCAG 2.1 AA compliance for inclusive user experience
- **Visual Accuracy**: Component design must match reference image using Playwright MCP validation

## Architecture Requirements

### Isolation Strategy (CRITICAL)
Following UPLOAD_ANGLE_ISOLATION_STRATEGY.md guidelines:

- **Component Location**: All components must be created within `src/mobile/components/UploadFit/` subdirectories
- **No Cross-Contamination**: Zero imports from or modifications to HomeView components
- **Independent Systems**: Separate TypeScript types, hooks, utilities, and styling
- **Error Boundaries**: Independent error handling that cannot affect main application
- **State Management**: Self-contained state with no shared global state dependencies
- **Reuse Strategy**: Extend and adapt existing Upload Angle components rather than duplicating

### Directory Structure Requirements
```
src/mobile/components/UploadFit/
├── containers/
│   └── UploadFitContainer.tsx          # Main container component
├── components/
│   ├── PhotoFrame.tsx                  # Reused from UploadAngle with fit-specific adaptations
│   ├── UploadButton.tsx                # Reused from UploadAngle with "Upload Your Fit" text
│   ├── NextButton.tsx                  # Reused from UploadAngle with "Next" functionality
│   └── ErrorBoundary.tsx               # Reused from UploadAngle
├── hooks/
│   ├── useFitUpload.tsx               # Adapted from useAngleUpload
│   └── useImageProcessing.tsx         # Reused from UploadAngle
├── utils/
│   ├── imageValidation.ts             # Reused from UploadAngle
│   └── uploadHelpers.ts               # Reused from UploadAngle
├── types/
│   └── fit.types.ts                   # Extended from upload.types.ts
├── styles/
│   └── upload.module.css              # Reused from UploadAngle
└── __tests__/
    ├── components/                    # Component unit tests
    ├── hooks/                        # Hook unit tests
    └── integration/                  # Integration test suites
```

## User Experience Specifications

### User Flow
1. **Initial State**: User sees empty photo frame with fit-specific upload icon overlay
2. **Instructions Display**: Fit-specific instructions for proper photo positioning
3. **Upload Trigger**: User taps "Upload Your Fit" button or photo frame area
4. **File Selection**: Native file picker opens for image selection
5. **Image Processing**: Selected image is validated, resized, and displayed in frame
6. **Review State**: User sees uploaded image with "Re-Do" and "Next" options
7. **Navigation**: "Next" button navigates to `/m/tryon` view

### UI Component Specifications

#### PhotoFrame Component (Reused from UploadAngle)
- **Visual Design**: 
  - Rounded corners (border-radius: 16px)
  - Black border (2px solid #000)
  - Brutalist blue drop shadow (4px 4px 0px #0066cc)
  - Aspect ratio: 3:4 for fit photos (portrait orientation)
- **States**:
  - Empty: Placeholder with fit-specific upload icon centered
  - Uploading: Loading spinner with progress indication
  - Loaded: Display uploaded image with proper cropping/fitting
  - Error: Error state with retry option
- **Interactions**:
  - Tap to trigger file upload (accessibility: button role)
  - Visual feedback on touch (slight scale animation)

#### Upload Button Component (Reused from UploadAngle)
- **Visual Design**:
  - Pink background (#ff69b4)
  - Black text and border (2px solid #000)
  - Blue drop shadow (3px 3px 0px #0066cc)
  - Bold typography matching mobile design system
- **States**:
  - Default: "Upload Your Fit"
  - Loading: Spinner with "Uploading..."
  - Success: Transforms to "Re-Do" button
- **Behavior**:
  - Overlaid on photo frame in empty state
  - Animates out when image is successfully uploaded
  - Replaced by "Re-Do" button after successful upload

#### NextButton Component (Reused from UploadAngle)
- **Visual Design**:
  - Same visual style as Upload Button (pink, black border, blue shadow)
  - Positioned below photo frame
  - Full-width button for easy mobile interaction
- **States**:
  - Hidden: Not visible until image is uploaded
  - Visible: Slides in after successful upload with animation
  - Loading: Shows loading state during navigation
- **Behavior**:
  - Only appears after successful image upload
  - Navigates to `/m/tryon` route
  - Includes proper loading states and error handling


## Technical Specifications

### Core Functionality Requirements

#### Image Upload System (Reused from UploadAngle)
- **File Types**: Support JPEG, PNG, WebP formats
- **Size Limits**: Maximum 10MB file size, minimum 300x400 resolution (portrait)
- **Processing**: Client-side image compression and resizing
- **Validation**: Real-time validation with user-friendly error messages
- **Storage**: Temporary local storage during session, server upload on completion

#### State Management (Reused from UploadAngle)
- **Upload State**: Idle, uploading, success, error states
- **Image Data**: Blob URL, file metadata, processing status
- **Navigation State**: Ready/not ready for next step
- **Error Handling**: Comprehensive error states with recovery options

#### Mobile Optimization (Reused from UploadAngle)
- **Touch Interactions**: Large touch targets (minimum 44px)
- **Performance**: Lazy loading, image optimization, minimal bundle size
- **Responsive Design**: Viewport-aware sizing and spacing
- **Accessibility**: Screen reader support, keyboard navigation, focus management

### TypeScript Implementation

#### Type Definitions (Reused from upload.types.ts)
```typescript
interface FitUploadState extends UploadState {
  // Reuse all existing UploadState properties
}

interface FitUploadConfig extends UploadConfig {
  aspectRatio: '3:4';
  minWidth: 300;
  minHeight: 400;
}
```

#### Hook Specifications
- **useFitUpload**: Adapted from useAngleUpload with 3:4 aspect ratio
- **useImageProcessing**: Reused from UploadAngle
- **Custom error handling**: Isolated error boundaries and recovery logic

### Styling Requirements

#### CSS Architecture (Reused from UploadAngle)
- **Module System**: CSS Modules for component isolation
- **Design Tokens**: Consistent spacing, colors, typography
- **Mobile-First**: Base styles for mobile, progressive enhancement
- **Animation**: Smooth transitions for state changes and interactions

#### Visual Design System Integration (Reused from UploadAngle)
- **Colors**: Pink (#ff69b4), Black (#000), Blue (#0066cc)
- **Typography**: Bold, sans-serif fonts matching mobile design
- **Spacing**: 8px grid system for consistent layout
- **Shadows**: Brutalist drop shadows (offset shadows, not blurred)

## Integration Specifications

### Routing Integration (Reused from Mobile Routing)
- **Route Definition**: `/m/upload-fit` in mobile router
- **Navigation**: Seamless integration with mobile onboarding flow
- **State Persistence**: Maintain upload state during navigation
- **Deep Linking**: Support for direct URL access

### Mobile Header Integration (Reused from Mobile Routing)
- **Back Navigation**: Integrate with existing mobile header back button
- **Progress Indication**: Show step progress in onboarding flow
- **Title Display**: "Upload Your Fit" title in mobile header

### Error Handling (Reused from UploadAngle)
- **Network Errors**: Graceful handling of upload failures
- **File Validation**: Clear messaging for invalid files
- **Storage Errors**: Recovery options for storage issues
- **Boundary Isolation**: Errors contained within component boundary

## Visual Design Requirements

### Reference Image Analysis
The reference image (`docs/assets/mobile/reference-images/UploadYourFitViewAfter.png`) shows:
- **Dimensions**: 394x856px (portrait mobile layout)
- **Layout**: Vertical stack with photo frame, instructions, and buttons
- **Color Scheme**: Consistent with brutalist design system
- **Typography**: Bold, clear text hierarchy
- **Spacing**: Generous whitespace for mobile usability

### Playwright MCP Validation Requirements
**CRITICAL**: The implementation MUST use Playwright MCP to validate visual design against the reference image:

1. **Visual Regression Testing**: Automated comparison with reference image
2. **Component Matching**: Ensure all UI elements match reference positioning
3. **Color Accuracy**: Verify color values match reference image
4. **Typography Consistency**: Confirm font sizes and weights match reference
5. **Spacing Validation**: Verify margins, padding, and gaps match reference
6. **Responsive Testing**: Ensure design works across different mobile viewport sizes

### Design Implementation Guidelines
- **Photo Frame**: 3:4 aspect ratio, centered layout, brutalist styling
- **Instructions**: Clear, actionable text with appropriate visual hierarchy
- **Buttons**: Consistent with Upload Angle View styling
- **Layout**: Mobile-first responsive design
- **Accessibility**: High contrast, readable fonts, proper touch targets

## Testing Strategy

### Unit Testing Requirements (Reused from UploadAngle)
- **Component Testing**: All components with React Testing Library
- **Hook Testing**: Custom hooks with comprehensive test coverage
- **Utility Testing**: Image validation and upload helper functions
- **Type Safety**: TypeScript compilation without errors

### Integration Testing (Reused from UploadAngle)
- **Upload Flow**: Complete file upload and preview workflow
- **Navigation**: Integration with mobile router and navigation
- **State Management**: State transitions and persistence
- **Error Scenarios**: Error handling and recovery flows

### Visual Regression Testing (Enhanced)
- **HomeView Protection**: Automated tests ensuring no impact on HomeView
- **Component Isolation**: Visual tests confirming component boundaries
- **Design System**: Consistency with established mobile design patterns
- **Reference Image Matching**: Playwright MCP validation against reference image

### End-to-End Testing (Reused from UploadAngle)
- **Mobile Devices**: Testing on actual mobile devices and simulators
- **Upload Workflows**: Complete user journey from empty state to navigation
- **Performance**: Loading times, animation smoothness, memory usage
- **Accessibility**: Screen reader testing, keyboard navigation

### Accessibility Testing (Reused from UploadAngle)
- **WCAG 2.1 AA**: Compliance verification with automated and manual testing
- **Screen Readers**: Testing with VoiceOver (iOS) and TalkBack (Android)
- **Keyboard Navigation**: Full functionality without mouse/touch
- **Focus Management**: Proper focus handling during state transitions

## Performance Requirements

### Mobile Performance Targets (Reused from UploadAngle)
- **First Contentful Paint**: < 1.5 seconds on 3G connection
- **Image Processing**: < 3 seconds for typical mobile photos
- **Animation Performance**: 60fps for all transitions and interactions
- **Bundle Size**: Component bundle < 50KB gzipped

### Optimization Strategies (Reused from UploadAngle)
- **Code Splitting**: Lazy load component bundle
- **Image Compression**: Client-side compression before upload
- **Caching**: Efficient caching of processed images
- **Memory Management**: Proper cleanup of blob URLs and event listeners

## Security Considerations

### File Upload Security (Reused from UploadAngle)
- **File Type Validation**: Server-side validation in addition to client-side
- **Size Limits**: Enforce maximum file size limits
- **Content Scanning**: Basic image content validation
- **XSS Prevention**: Proper handling of user-generated content

### Data Privacy (Reused from UploadAngle)
- **Temporary Storage**: Clear local storage after session
- **User Consent**: Appropriate permissions for camera/file access
- **Data Minimization**: Only collect necessary image data

## Development Phases

### Phase 1: Foundation Setup
- Directory structure creation
- TypeScript type definitions (extending UploadAngle types)
- Basic component scaffolding
- Development environment configuration

### Phase 2: Component Reuse and Adaptation
- Reuse PhotoFrame, UploadButton, NextButton from UploadAngle
- Adapt existing hooks for fit-specific functionality (3:4 aspect ratio)
- Basic styling and layout

### Phase 3: Fit-Specific Functionality
- Upload state management with 3:4 aspect ratio
- Image validation for portrait orientation
- Upload flow integration

### Phase 4: Integration & Polish
- Mobile router integration
- Header component integration
- Animation and transition polish
- Performance optimization

### Phase 5: Testing & Quality Assurance
- Comprehensive unit test suite
- Integration testing
- Playwright MCP visual validation
- Accessibility audit and fixes
- Visual regression testing
- Performance testing and optimization

## Success Metrics

### Technical Metrics
- **Zero Regressions**: No impact on existing HomeView functionality
- **Test Coverage**: >95% code coverage for all components and utilities
- **Performance**: All performance targets met on target devices
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Visual Accuracy**: 100% match with reference image via Playwright MCP

### User Experience Metrics
- **Upload Success Rate**: >99% successful uploads for valid files
- **Error Recovery**: Clear error messages and recovery paths
- **Mobile Usability**: Smooth interactions on all target devices
- **Loading Performance**: Fast initial load and responsive interactions

## Risk Mitigation

### Technical Risks
- **Component Isolation**: Strict enforcement of isolation boundaries
- **Mobile Performance**: Regular performance testing and optimization
- **File Upload Reliability**: Robust error handling and retry logic
- **Cross-Browser Compatibility**: Testing across mobile browsers
- **Visual Accuracy**: Continuous Playwright MCP validation

### Development Risks
- **Scope Creep**: Clear boundaries and requirements documentation
- **Integration Issues**: Early integration testing with mobile infrastructure
- **Design Consistency**: Regular design review and Playwright MCP validation
- **Timeline Adherence**: Phased development with clear milestones

## Reusable Components Analysis

### Components to Reuse from UploadAngle
1. **PhotoFrame**: Adapt for 3:4 aspect ratio and fit-specific placeholder
2. **UploadButton**: Change text to "Upload Your Fit"
3. **NextButton**: Reuse with navigation to `/m/tryon`
4. **ErrorBoundary**: Complete reuse
5. **ProgressIndicator**: Complete reuse
6. **CSS Modules**: Reuse base styles, extend for fit-specific needs


### Hooks to Adapt
1. **useAngleUpload** → **useFitUpload**: Change aspect ratio and validation
2. **useImageProcessing**: Complete reuse

### Utilities to Reuse
1. **imageValidation.ts**: Complete reuse
2. **uploadHelpers.ts**: Complete reuse

This PRD provides comprehensive requirements for implementing a completely isolated "Upload Your Fit View" mobile component that leverages existing Upload Angle View components while maintaining the existing application's stability and delivering a high-quality, accessible, and performant user experience that matches the reference image exactly.
