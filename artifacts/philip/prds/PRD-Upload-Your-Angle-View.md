# Product Requirements Document: Upload Your Angle View Mobile Component

## Project Overview

### Vision
Create a completely isolated mobile "Upload Your Angle View" component that allows users to upload and preview their angle photos as part of the mobile onboarding flow, with zero impact on existing HomeView functionality.

### Target Application
- **Platform**: Next.js web application with mobile-optimized views
- **Route**: `/upload-angle`
- **Integration**: Mobile onboarding flow between initial setup and "Upload Your Fit View"
- **Design System**: Brutalist aesthetic with black borders, pink buttons, blue drop shadows

### Critical Success Factors
- **Complete Isolation**: Zero modifications to existing HomeView or main application components
- **Visual Consistency**: Matches brutalist design language established in mobile views
- **Mobile Performance**: Optimized for mobile devices with smooth interactions
- **Accessibility**: WCAG 2.1 AA compliance for inclusive user experience

## Architecture Requirements

### Isolation Strategy (CRITICAL)
Following UPLOAD_ANGLE_ISOLATION_STRATEGY.md guidelines:

- **Component Location**: All components must be created within `src/mobile/components/UploadAngle/` subdirectories
- **No Cross-Contamination**: Zero imports from or modifications to HomeView components
- **Independent Systems**: Separate TypeScript types, hooks, utilities, and styling
- **Error Boundaries**: Independent error handling that cannot affect main application
- **State Management**: Self-contained state with no shared global state dependencies

### Directory Structure Requirements
```
src/mobile/components/UploadAngle/
├── containers/
│   └── UploadAngleContainer.tsx          # Main container component
├── components/
│   ├── PhotoFrame.tsx                    # Image display and placeholder frame
│   ├── UploadButton.tsx                  # Upload trigger button
│   ├── NextButton.tsx                    # Navigation to next step
│   └── ErrorBoundary.tsx                 # Isolated error handling
├── hooks/
│   ├── useAngleUpload.tsx               # File upload logic and state
│   └── useImageProcessing.tsx           # Image validation and processing
├── utils/
│   ├── imageValidation.ts               # Image format/size validation
│   ├── uploadHelpers.ts                 # Upload utility functions
│   └── constants.ts                     # Component-specific constants
├── types/
│   └── upload.types.ts                  # TypeScript type definitions
├── styles/
│   └── upload.module.css                # Component-specific styling
└── __tests__/
    ├── components/                      # Component unit tests
    ├── hooks/                          # Hook unit tests
    └── integration/                    # Integration test suites
```

## User Experience Specifications

### User Flow
1. **Initial State**: User sees empty photo frame with upload icon overlay
2. **Upload Trigger**: User taps "Upload Your Angle" button or photo frame area
3. **File Selection**: Native file picker opens for image selection
4. **Image Processing**: Selected image is validated, resized, and displayed in frame
5. **Review State**: User sees uploaded image with "Re-Do" and "Next" options
6. **Navigation**: "Next" button navigates to `/upload-fit` view

### UI Component Specifications

#### PhotoFrame Component
- **Visual Design**: 
  - Rounded corners (border-radius: 16px)
  - Black border (2px solid #000)
  - Brutalist blue drop shadow (4px 4px 0px #0066cc)
  - Aspect ratio: 4:3 for angle photos
- **States**:
  - Empty: Placeholder with upload icon centered
  - Uploading: Loading spinner with progress indication
  - Loaded: Display uploaded image with proper cropping/fitting
  - Error: Error state with retry option
- **Interactions**:
  - Tap to trigger file upload (accessibility: button role)
  - Visual feedback on touch (slight scale animation)

#### Upload Button Component
- **Visual Design**:
  - Pink background (#ff69b4)
  - Black text and border (2px solid #000)
  - Blue drop shadow (3px 3px 0px #0066cc)
  - Bold typography matching mobile design system
- **States**:
  - Default: "Upload Your Angle"
  - Loading: Spinner with "Uploading..."
  - Success: Transforms to "Re-Do" button
- **Behavior**:
  - Overlaid on photo frame in empty state
  - Animates out when image is successfully uploaded
  - Replaced by "Re-Do" button after successful upload

#### NextButton Component
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
  - Navigates to `/upload-fit` route
  - Includes proper loading states and error handling

## Technical Specifications

### Core Functionality Requirements

#### Image Upload System
- **File Types**: Support JPEG, PNG, WebP formats
- **Size Limits**: Maximum 10MB file size, minimum 400x300 resolution
- **Processing**: Client-side image compression and resizing
- **Validation**: Real-time validation with user-friendly error messages
- **Storage**: Temporary local storage during session, server upload on completion

#### State Management
- **Upload State**: Idle, uploading, success, error states
- **Image Data**: Blob URL, file metadata, processing status
- **Navigation State**: Ready/not ready for next step
- **Error Handling**: Comprehensive error states with recovery options

#### Mobile Optimization
- **Touch Interactions**: Large touch targets (minimum 44px)
- **Performance**: Lazy loading, image optimization, minimal bundle size
- **Responsive Design**: Viewport-aware sizing and spacing
- **Accessibility**: Screen reader support, keyboard navigation, focus management

### TypeScript Implementation

#### Type Definitions (upload.types.ts)
```typescript
interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  file: File | null;
  imageUrl: string | null;
  error: string | null;
  progress: number;
}

interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  minWidth: number;
  minHeight: number;
}
```

#### Hook Specifications
- **useAngleUpload**: Manages upload state, file handling, progress tracking
- **useImageProcessing**: Image validation, compression, format conversion
- **Custom error handling**: Isolated error boundaries and recovery logic

### Styling Requirements

#### CSS Architecture
- **Module System**: CSS Modules for component isolation
- **Design Tokens**: Consistent spacing, colors, typography
- **Mobile-First**: Base styles for mobile, progressive enhancement
- **Animation**: Smooth transitions for state changes and interactions

#### Visual Design System Integration
- **Colors**: Pink (#ff69b4), Black (#000), Blue (#0066cc)
- **Typography**: Bold, sans-serif fonts matching mobile design
- **Spacing**: 8px grid system for consistent layout
- **Shadows**: Brutalist drop shadows (offset shadows, not blurred)

## Integration Specifications

### Routing Integration
- **Route Definition**: `/upload-angle` in mobile router
- **Navigation**: Seamless integration with mobile onboarding flow
- **State Persistence**: Maintain upload state during navigation
- **Deep Linking**: Support for direct URL access

### Mobile Header Integration
- **Back Navigation**: Integrate with existing mobile header back button
- **Progress Indication**: Show step progress in onboarding flow
- **Title Display**: "Upload Your Angle" title in mobile header

### Error Handling
- **Network Errors**: Graceful handling of upload failures
- **File Validation**: Clear messaging for invalid files
- **Storage Errors**: Recovery options for storage issues
- **Boundary Isolation**: Errors contained within component boundary

## Testing Strategy

### Unit Testing Requirements
- **Component Testing**: All components with React Testing Library
- **Hook Testing**: Custom hooks with comprehensive test coverage
- **Utility Testing**: Image validation and upload helper functions
- **Type Safety**: TypeScript compilation without errors

### Integration Testing
- **Upload Flow**: Complete file upload and preview workflow
- **Navigation**: Integration with mobile router and navigation
- **State Management**: State transitions and persistence
- **Error Scenarios**: Error handling and recovery flows

### Visual Regression Testing
- **HomeView Protection**: Automated tests ensuring no impact on HomeView
- **Component Isolation**: Visual tests confirming component boundaries
- **Design System**: Consistency with established mobile design patterns

### End-to-End Testing
- **Mobile Devices**: Testing on actual mobile devices and simulators
- **Upload Workflows**: Complete user journey from empty state to navigation
- **Performance**: Loading times, animation smoothness, memory usage
- **Accessibility**: Screen reader testing, keyboard navigation

### Accessibility Testing
- **WCAG 2.1 AA**: Compliance verification with automated and manual testing
- **Screen Readers**: Testing with VoiceOver (iOS) and TalkBack (Android)
- **Keyboard Navigation**: Full functionality without mouse/touch
- **Focus Management**: Proper focus handling during state transitions

## Performance Requirements

### Mobile Performance Targets
- **First Contentful Paint**: < 1.5 seconds on 3G connection
- **Image Processing**: < 3 seconds for typical mobile photos
- **Animation Performance**: 60fps for all transitions and interactions
- **Bundle Size**: Component bundle < 50KB gzipped

### Optimization Strategies
- **Code Splitting**: Lazy load component bundle
- **Image Compression**: Client-side compression before upload
- **Caching**: Efficient caching of processed images
- **Memory Management**: Proper cleanup of blob URLs and event listeners

## Security Considerations

### File Upload Security
- **File Type Validation**: Server-side validation in addition to client-side
- **Size Limits**: Enforce maximum file size limits
- **Content Scanning**: Basic image content validation
- **XSS Prevention**: Proper handling of user-generated content

### Data Privacy
- **Temporary Storage**: Clear local storage after session
- **User Consent**: Appropriate permissions for camera/file access
- **Data Minimization**: Only collect necessary image data

## Development Phases

### Phase 1: Foundation Setup
- Directory structure creation
- TypeScript type definitions
- Basic component scaffolding
- Development environment configuration

### Phase 2: Core Components
- PhotoFrame component implementation
- Upload and Next button components
- Basic styling and layout
- Component interaction logic

### Phase 3: Upload Functionality
- File selection and validation
- Image processing and compression
- Upload state management
- Error handling implementation

### Phase 4: Integration & Polish
- Mobile router integration
- Header component integration
- Animation and transition polish
- Performance optimization

### Phase 5: Testing & Quality Assurance
- Comprehensive unit test suite
- Integration testing
- Accessibility audit and fixes
- Visual regression testing
- Performance testing and optimization

## Success Metrics

### Technical Metrics
- **Zero Regressions**: No impact on existing HomeView functionality
- **Test Coverage**: >95% code coverage for all components and utilities
- **Performance**: All performance targets met on target devices
- **Accessibility**: 100% WCAG 2.1 AA compliance

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

### Development Risks
- **Scope Creep**: Clear boundaries and requirements documentation
- **Integration Issues**: Early integration testing with mobile infrastructure
- **Design Consistency**: Regular design review and approval process
- **Timeline Adherence**: Phased development with clear milestones

This PRD provides comprehensive requirements for implementing a completely isolated "Upload Your Angle View" mobile component that maintains the existing application's stability while delivering a high-quality, accessible, and performant user experience.