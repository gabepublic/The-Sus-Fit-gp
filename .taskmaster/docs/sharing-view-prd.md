# Product Requirements Document: Mobile Sharing View

## Overview

Develop a mobile Sharing View that allows users to share their Try It On results across multiple social media platforms and through native device sharing capabilities. The view should seamlessly integrate with the existing mobile workflow and maintain design consistency with the application's brutalist aesthetic.

## User Story

**As a mobile user who has just completed the Try It On experience, I want to easily share my virtual try-on result image with others through my preferred social media platforms or messaging apps, so that I can get feedback, show off my style, and engage with my social network.**

## Core Requirements

### 1. Visual Design and Layout

#### 1.1 Background and Container
- **Background Color**: Use the same yellow background (#faba01) as the Upload Your Angle view
- **Layout Structure**: Follow the same padding and spacing patterns as other mobile views (px-4 py-6)
- **Full Screen**: Utilize full mobile viewport with proper safe area handling

#### 1.2 PhotoFrame Integration
- **Component Reuse**: Utilize the existing PhotoFrame component with a new 'sharing' view type configuration
- **Image Display**: Display the generated image from the Try It On workflow in the same size and position as other mobile views
- **State Management**: Show the PhotoFrame in 'loaded' state with the generated image
- **Aspect Ratio**: Maintain the same aspect ratio configuration as the Try It On view

#### 1.3 Social Media Share Buttons
- **Button Design**:
  - Circular buttons with white backgrounds
  - Black outlines (2px border)
  - Pink drop-shadows instead of the typical blue used elsewhere
  - Brutalist design aesthetic consistent with ActionButton component
  - Minimum 52px touch targets for mobile accessibility
- **Button Positioning**: Position 4 circular share buttons around the PhotoFrame image:
  - Top-left: BlueSky
  - Top-right: Pinterest
  - Bottom-left: Instagram
  - Bottom-right: Generic device share
- **Button Icons**: Use appropriate social media platform icons within each circular button
- **Button States**: Support hover, active, and disabled states with appropriate visual feedback

### 2. Functionality Requirements

#### 2.1 Image Handling
- **Source Image**: Retrieve the generated image from the Try It On workflow's `generatedImage` state
- **Image Format**: Handle base64 encoded images from the workflow
- **Image Processing**: Convert base64 to appropriate formats for sharing (PNG/JPEG)
- **Fallback Handling**: Gracefully handle cases where no generated image is available

#### 2.2 Social Media Integration
- **BlueSky Sharing**: Implement sharing to BlueSky social platform
- **Pinterest Sharing**: Enable pinning the image to Pinterest boards
- **Instagram Sharing**: Provide Instagram sharing functionality (may use device-level sharing)
- **Generic Sharing**: Use Web Share API for native device sharing options

#### 2.3 Sharing Behavior
- **Image Preparation**: Ensure shared images are properly formatted and sized
- **Metadata**: Include appropriate title, description, and hashtags where supported
- **Error Handling**: Provide user feedback for failed sharing attempts
- **Analytics**: Track sharing events for product insights

### 3. Technical Implementation

#### 3.1 Component Architecture
- **Route**: `/m/share`
- **Page Component**: Create `src/app/(mobile)/m/share/page.tsx` with metadata
- **Client Component**: Create `src/app/(mobile)/m/share/client.tsx` for main functionality
- **Sharing Component**: Create `src/mobile/components/Share/SharingView.tsx`

#### 3.2 PhotoFrame Configuration
- **New View Type**: Add 'sharing' view type to PhotoFrame configuration
- **Configuration**: Create sharing-specific PhotoFrame config in `photoframe.config.ts`
- **No Upload State**: Sharing view should not show upload placeholder or upload functionality

#### 3.3 Share Button Component
- **Component**: Create `src/mobile/components/Share/ShareButton.tsx`
- **Styling**: Extend ActionButton styling with sharing-specific pink drop-shadow
- **Platform Integration**: Handle different sharing APIs and fallbacks

#### 3.4 Navigation Integration
- **Entry Point**: Accessible from Try It On view after successful generation
- **Route Guarding**: Ensure users can only access with a valid generated image
- **State Management**: Maintain generated image state across navigation

### 4. Responsive Design

#### 4.1 Mobile Optimization
- **Touch Targets**: Ensure all share buttons meet 44px+ minimum touch target size
- **Viewport Handling**: Properly handle various mobile screen sizes and orientations
- **Safe Areas**: Respect device safe areas and notches
- **Performance**: Optimize for mobile devices with smooth 60fps animations

#### 4.2 Button Layout
- **Positioning**: Use absolute or flexible positioning to ensure buttons don't interfere with image
- **Spacing**: Maintain adequate spacing between buttons and from image edges
- **Overlap Prevention**: Ensure buttons don't accidentally obscure the image content

### 5. Accessibility Requirements

#### 5.1 Screen Reader Support
- **ARIA Labels**: Comprehensive ARIA labeling for all interactive elements
- **Role Definitions**: Proper role definitions for the sharing interface
- **Live Regions**: Announce sharing status and results to screen readers
- **Keyboard Navigation**: Full keyboard accessibility for all sharing functions

#### 5.2 Visual Accessibility
- **Color Contrast**: Ensure sufficient contrast ratios for all text and icons
- **Focus Indicators**: Clear visual focus indicators for keyboard navigation
- **Reduced Motion**: Respect prefers-reduced-motion settings
- **Text Scaling**: Support dynamic text sizing

### 6. Testing Requirements

#### 6.1 Unit Testing
- **Component Testing**: Comprehensive unit tests for all sharing components
- **Utility Testing**: Test image conversion and sharing utility functions
- **State Management**: Test state transitions and error handling
- **Coverage Target**: Minimum 90% test coverage for new components

#### 6.2 Integration Testing
- **PhotoFrame Integration**: Test PhotoFrame component with sharing view configuration
- **Navigation Flow**: Test navigation from Try It On to Sharing view
- **State Persistence**: Verify generated image state is properly maintained
- **Error Scenarios**: Test behavior when no image is available

#### 6.3 End-to-End Testing (Playwright)
- **User Journey**: Test complete flow from Try It On through sharing
- **Platform Sharing**: Test actual sharing functionality with mock APIs
- **Visual Regression**: Compare against reference design images
- **Mobile Interaction**: Test touch interactions and button responsiveness
- **Accessibility Testing**: Automated accessibility testing with Playwright

#### 6.4 Visual Testing
- **Design Fidelity**: Compare implementation against reference image
- **Button Styling**: Verify pink drop-shadows and brutalist design
- **Layout Consistency**: Ensure consistent spacing and positioning
- **Cross-Device**: Test across different mobile devices and screen sizes

### 7. Performance Requirements

#### 7.1 Loading Performance
- **Image Optimization**: Efficient handling of base64 image conversion
- **Component Loading**: Fast component initialization and rendering
- **Memory Management**: Proper cleanup of image data and event listeners

#### 7.2 Animation Performance
- **60fps Target**: Maintain smooth animations on mobile devices
- **Hardware Acceleration**: Use CSS transforms for optimal performance
- **Gesture Response**: Responsive touch interactions without lag

### 8. Security and Privacy

#### 8.1 Data Handling
- **Image Privacy**: Ensure generated images are handled securely during sharing
- **No Data Persistence**: Don't store sensitive image data longer than necessary
- **Platform Compliance**: Follow platform-specific privacy requirements

#### 8.2 External Integration
- **API Security**: Secure integration with social media platforms
- **Content Validation**: Validate image content before sharing
- **Error Information**: Avoid exposing sensitive error details to users

### 9. Analytics and Monitoring

#### 9.1 User Behavior Tracking
- **Sharing Events**: Track which platforms users prefer for sharing
- **Completion Rates**: Monitor successful vs failed sharing attempts
- **User Journey**: Track progression from Try It On to sharing completion

#### 9.2 Error Monitoring
- **Failed Shares**: Monitor and alert on sharing failures
- **Platform Issues**: Track platform-specific sharing problems
- **Performance Metrics**: Monitor component loading and interaction times

### 10. Future Considerations

#### 10.1 Additional Platforms
- **TikTok Integration**: Consider future TikTok sharing capabilities
- **LinkedIn Sharing**: Professional network sharing options
- **WhatsApp/Messaging**: Direct messaging integration

#### 10.2 Enhanced Features
- **Image Customization**: Adding text or filters before sharing
- **Multiple Images**: Sharing before/after comparisons
- **Story Formats**: Platform-specific story format optimization

## Success Criteria

### 10.1 Functional Success
- [ ] Users can successfully share generated images to all 4 specified platforms
- [ ] PhotoFrame component displays generated image correctly in sharing context
- [ ] All share buttons are properly styled with pink drop-shadows and brutalist design
- [ ] Navigation from Try It On to Sharing view works seamlessly
- [ ] Error handling provides clear feedback for failed sharing attempts

### 10.2 Design Success
- [ ] Visual implementation matches reference image design
- [ ] Yellow background matches Upload Your Angle view exactly (#faba01)
- [ ] Share buttons maintain 52px+ touch targets for mobile accessibility
- [ ] Animations and interactions feel smooth and responsive
- [ ] Design consistency maintained with existing mobile views

### 10.3 Quality Success
- [ ] 90%+ unit test coverage for all new components
- [ ] All Playwright tests pass including visual regression tests
- [ ] Accessibility audit passes with no violations
- [ ] Performance metrics meet mobile optimization targets
- [ ] Code review approval from team leads

## Timeline and Dependencies

### Dependencies
- Completion of Try It On workflow implementation
- Generated image availability in useTryonWorkflow hook
- PhotoFrame component stable and tested
- Social media platform API access and testing accounts

### Estimated Development Time
- Component Architecture and Setup: 2 days
- PhotoFrame Integration and Styling: 2 days
- Share Button Implementation: 3 days
- Social Media Platform Integration: 3 days
- Testing and Quality Assurance: 3 days
- **Total Estimated Time: 13 days**

## Technical Notes

### Generated Image Access
The generated image is available in the `useTryonWorkflow` hook's state as `generatedImage` (base64 string). This should be passed to the Sharing view through:
1. URL parameters (for image ID/reference)
2. Global state management
3. Local storage (with proper cleanup)

### Social Platform URLs
- **BlueSky**: Use BlueSky API for posting
- **Pinterest**: Use Pinterest Save Button or API
- **Instagram**: Use device sharing or Instagram integration
- **Generic**: Use Web Share API with fallback to copy-to-clipboard

### PhotoFrame Configuration
Add to `photoframe.config.ts`:
```typescript
SHARING_CONFIG: {
  defaultAspectRatio: '3:4',
  placeholderImage: '/images/placeholders/sharing-placeholder.jpg',
  uploadIcon: '', // No upload icon for sharing view
  enableUpload: false,
  styleOverrides: {
    width: '70vw',
    height: 'auto'
  }
}
```