# PRD: Mobile Home View Content Component

## Overview
Create a visually striking Home View Content Component that will replace the placeholder content in `src/app/(mobile)/m/home/page.tsx`. This component will feature the "Let's Get You Fitted" stylized text over an animated background, positioned within a distinctive yellow banner shape, matching the design reference provided in `docs/assets/mobile/reference-images/HomeView.png`.

## Goals
- Implement the main content section for the mobile home page as a self-contained React component
- Create an eye-catching animated text effect using "Let's Get You Fitted" as a mask overlay for the animated GIF
- Integrate the existing animated GIF (`public/images/mobile/home-page-animated.gif`) as the background animation visible through text masking
- Achieve pixel-perfect matching of the yellow banner design from the reference image
- Ensure responsive design that works across all mobile device sizes (320px minimum width)
- Maintain consistency with the existing SusFit design system and color palette
- Provide an engaging landing experience that sets the tone for the virtual try-on journey

## Non-Goals
- Header implementation (already completed in MobileHeader component)
- Bottom navigation/menu with green circle and icon (future PRD)
- Business logic or data fetching
- Integration with try-on flows or user authentication
- Service worker or performance tuning beyond basic optimization

## Design References
- **Primary Reference**: `docs/assets/mobile/reference-images/HomeView.png`
  - Focus area: Middle content section with yellow banner and "Let's Get You Fitted" text
  - Exclude: Header area (implemented) and bottom green menu icon (future)
- **Animated Asset**: `public/images/mobile/home-page-animated.gif`
  - Should be visible through text mask overlay
  - Colors appear to be vibrant and varied, complementing the yellow banner

## Technical Architecture

### Component Structure
```
src/mobile/components/HomeViewContent.tsx    # Main component implementation
src/mobile/types/index.ts                    # Add HomeViewContent interfaces
src/app/(mobile)/m/home/page.tsx            # Update to use new component
src/app/globals.css                         # Add component-specific styles
```

### Integration Points
- **Parent Layout**: Fits within `src/app/(mobile)/m/layout.tsx` structure
- **Styling Base**: Leverages existing SusFit design tokens from `src/app/globals.css`
- **Mobile Patterns**: Uses established patterns from `src/mobile/styles/mobile.css`
- **Typography**: Uses existing font families (`--font-tertiary: 'Fascinate'` for stylized text)

## Detailed Design Specifications

### Layout & Positioning
- **Container**: Full-width content area excluding header (pt-16 padding already applied by mobile layout)
- **Centering**: Vertically and horizontally centered within available viewport space
- **Responsive**: Scales appropriately from 320px (iPhone SE) to 428px (iPhone 14 Pro Max) widths
- **Aspect Ratio**: Maintains design proportions across different screen heights

### Yellow Banner Shape
- **Shape**: Distinctive curved banner with irregular organic edges matching reference design
- **Color**: SusFit yellow palette (`--color-susfit-yellow: #f9b801`)
- **Implementation**: CSS clip-path or SVG path for precise shape matching
- **Position**: Centrally positioned, takes up approximately 60-70% of available vertical space
- **Shadow/Effects**: Subtle depth effects if present in reference design

### Typography & Text Effects
- **Text Content**: "Let's Get You Fitted" exactly as shown in reference
- **Font Family**: `--font-tertiary: 'Fascinate'` (already imported)
- **Size**: Responsive scaling based on container size
- **Color**: Transparent or masked to reveal animated background
- **Positioning**: Centered within yellow banner shape
- **Line Height**: Generous spacing for readability and visual impact

### Animated Background Integration
- **Asset**: `public/images/mobile/home-page-animated.gif`
- **Playback**: Continuous loop with no user controls
- **Masking**: Text acts as a mask/window to reveal animated content underneath
- **Positioning**: Centered behind text, scaled appropriately
- **Performance**: Optimized loading with proper lazy loading if needed
- **Fallback**: Static frame or placeholder in case GIF fails to load

### Color Palette Integration
- **Primary**: SusFit Yellow variations for banner
- **Secondary**: Teal accents if needed for additional elements
- **Background**: Cream/light backgrounds to maintain contrast
- **Text**: Use existing color tokens for consistency

## Component Interface

### Props Interface
```typescript
interface HomeViewContentProps {
  className?: string;          // Optional additional CSS classes
  animationDelay?: number;     // Optional animation delay in ms
}
```

### Component State
- Loading states for animated GIF
- Animation trigger states
- Responsive breakpoint awareness

## Implementation Requirements

### React Component (`src/mobile/components/HomeViewContent.tsx`)
- Functional component with TypeScript
- Proper prop validation and default values
- Semantic HTML structure for accessibility
- Optimized re-rendering with React.memo if needed
- Error boundaries for asset loading failures

### Styling Approach
- CSS-in-JS or CSS modules for component-specific styles
- Leverage existing global CSS variables and tokens
- Mobile-first responsive design principles
- Hardware-accelerated animations using `transform` and `opacity`
- Efficient CSS selectors and minimal specificity conflicts

### Asset Handling
- Proper Next.js Image component integration if applicable
- GIF optimization and compression
- Progressive loading strategies
- Error handling for failed asset loads
- Accessibility considerations (alt text, reduced motion preferences)

### Animation Implementation
- CSS animations for text masking effects with flexible timing
- Smooth transitions and easing functions
- Respect user's motion preferences (`prefers-reduced-motion`)
- Performance-optimized with `will-change` properties
- Avoid layout thrashing

## Responsive Design Requirements

### Breakpoints
- **Small phones** (320px - 375px): Compact layout, smaller text
- **Standard phones** (375px - 414px): Optimal design size
- **Large phones** (414px+): Maintain proportions, avoid stretching

### Orientation Support
- **Portrait**: Primary design focus
- **Landscape**: Graceful adaptation with adjusted proportions

### Accessibility Requirements
- **Screen Readers**: Proper semantic markup and ARIA labels
- **Keyboard Navigation**: Focusable elements if interactive
- **Color Contrast**: Ensure readability against all background variations
- **Motion Sensitivity**: Respect `prefers-reduced-motion` media query
- **Touch Targets**: Minimum 44px touch targets for any interactive elements

## Performance Considerations
- **Asset Optimization**: Compressed GIF with optimal file size
- **Rendering Performance**: Minimize reflows and repaints for smooth and responsive user experience
- **Memory Usage**: Efficient animation loops and cleanup
- **Loading Speed**: Progressive enhancement and lazy loading
- **Bundle Size**: Minimal JavaScript footprint for static content
- **User Experience**: Prioritize smooth animations and responsive interactions over specific metrics

## Testing Requirements

### Functional Testing
1. Component renders correctly in isolation
2. Animated GIF loads and displays through text mask
3. Responsive design works across target device sizes
4. Animation effects perform smoothly on various devices
5. Error handling works when assets fail to load

### Accessibility Testing
1. Screen reader announces content appropriately
2. Keyboard navigation works if applicable
3. Color contrast meets WCAG 2.1 AA standards
4. Motion preferences are respected

### Performance Testing
1. Component loads within performance budget
2. Animations maintain 60fps on target devices
3. Memory usage remains stable during extended viewing
4. Asset loading doesn't block critical rendering path

### Integration Testing
1. Component integrates seamlessly with mobile layout
2. No conflicts with existing global styles
3. Proper spacing and positioning within mobile viewport
4. Consistent with overall mobile application flow

## Success Criteria
- [ ] Pixel-perfect match with reference design yellow banner shape
- [ ] "Let's Get You Fitted" text correctly masks animated GIF background
- [ ] Responsive design works flawlessly across all mobile sizes
- [ ] Smooth animations with no performance issues
- [ ] Accessible to screen readers and keyboard users
- [ ] Loads within 2 seconds on typical mobile connections
- [ ] Integrates seamlessly with existing mobile layout structure
- [ ] Zero console errors or warnings in development/production

## Technical Constraints
- **Framework**: Next.js App Router (existing project standard)
- **React**: Functional components with hooks
- **TypeScript**: Strict typing for all interfaces and props
- **Styling**: CSS/Sass compatible with existing Tailwind setup
- **Browser Support**: Modern mobile browsers (iOS Safari 14+, Chrome 90+)
- **Bundle Impact**: Minimal increase to existing bundle size

## Future Extensibility
- Support for multiple language versions of text content (to be added in future release)
- Alternative animation assets for seasonal or promotional content
- Integration points for user personalization
- A/B testing capabilities for different design variations
- Analytics event hooks for user engagement tracking (to be added in future release)

## Dependencies
- **Existing**: React, Next.js, TypeScript, Tailwind CSS
- **Assets**: `public/images/mobile/home-page-animated.gif`
- **Fonts**: Fascinate font (already imported)
- **Colors**: SusFit color palette (already defined)

## Risk Mitigation
- **Asset Loading Failures**: Graceful fallbacks and error states
- **Performance Issues**: Progressive enhancement and optimization
- **Design Deviations**: Regular design review checkpoints
- **Browser Compatibility**: Feature detection and polyfills if needed
- **Accessibility Compliance**: Regular accessibility audits

## Deliverables
1. **HomeViewContent.tsx**: Complete React component implementation
2. **Updated page.tsx**: Integration with existing home page structure
3. **CSS Styles**: Component-specific animations and styling
4. **TypeScript Interfaces**: Proper type definitions
5. **Performance Optimizations**: Asset loading and animation optimizations
6. **Accessibility Features**: WCAG compliance implementations
7. **Responsive Design**: Cross-device compatibility
8. **Documentation**: Component usage and integration guide
9. **Tests**: Unit and integration test coverage

## Timeline Considerations
This component represents the first major content piece for the mobile application and will establish patterns for future mobile content components. Quality and pixel-perfect implementation are prioritized over speed to ensure a strong foundation for the mobile experience.

## Implementation Decisions
The following design decisions have been confirmed for the implementation:

1. **Animated GIF Playback**: Loop continuously with no user controls
2. **Animation Timing**: No specific timing requirements - flexible implementation for optimal visual effect
3. **Internationalization**: Not required initially - will be added in future release
4. **Performance Metrics**: No specific metrics required - focus on smooth and responsive user experience
5. **Analytics Tracking**: No analytics hooks required initially - will be added in future release

These decisions provide clear guidance for the implementation phase while maintaining flexibility for future enhancements.