// Mobile-specific TypeScript interfaces and types

export interface MobileLayoutProps {
  children: React.ReactNode
}

export interface MobileHeaderProps {
  isMenuOpen: boolean
  onMenuToggle: () => void
}

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export interface MobileRoute {
  path: string
  label: string
  icon?: string
}

export interface DeviceInfo {
  isPhone: boolean
  isTablet: boolean
  isMobile: boolean
  userAgent: string
}

export interface MobileAnalyticsEvent {
  route: string
  timestamp: Date
  deviceType: string
  action?: string
  previousRoute?: string
}

export interface HomeViewContentProps {
  className?: string
  animationDelay?: number
}

export interface YellowBannerProps {
  className?: string
  children?: React.ReactNode
  animationDelay?: number
  useSvgFallback?: boolean
}

export interface AnimatedBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  src?: string
  alt?: string
  priority?: boolean
  quality?: number
  placeholder?: string
  onLoadError?: () => void
  onLoadSuccess?: () => void
}