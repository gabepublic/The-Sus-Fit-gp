import { NextRequest, NextResponse } from 'next/server'
import { shouldRedirectToMobile } from './mobile/utils/deviceDetection'
import { getMobileRouteString } from './mobile/utils/routeMapping'

// Cookie name for view preference
const VIEW_PREFERENCE_COOKIE = 'view-preference'

// Cookie expiration time in seconds (5 minutes)
const COOKIE_MAX_AGE = 300

/**
 * Next.js middleware for device detection and mobile routing
 * Automatically redirects phone users to mobile routes while keeping tablets/desktops on main routes
 * Includes loop prevention and query parameter overrides for development
 */
export function middleware(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  
  // Skip middleware for static assets, API routes, and already mobile routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') || // Skip files with extensions
    pathname.startsWith('/m/') // Already on mobile routes
  ) {
    return NextResponse.next()
  }

  // Check for query parameter overrides (for development/testing)
  const url = new URL(request.url)
  const viewOverride = url.searchParams.get('view')
  
  if (viewOverride === 'mobile') {
    // Force redirect to mobile - try to use route mapping, fallback to home
    const mobileRoute = getMobileRouteString(pathname) || '/m/home'
    const response = NextResponse.redirect(new URL(mobileRoute + search, origin))
    response.cookies.set(VIEW_PREFERENCE_COOKIE, 'mobile', { 
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    return response
  }
  
  if (viewOverride === 'main') {
    // Force stay on main routes
    const response = NextResponse.next()
    response.cookies.set(VIEW_PREFERENCE_COOKIE, 'main', { 
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    return response
  }

  // Check for existing view preference cookie (loop prevention)
  const viewPreference = request.cookies.get(VIEW_PREFERENCE_COOKIE)?.value
  
  // If user has recently been redirected, respect their preference
  if (viewPreference === 'mobile' || viewPreference === 'main') {
    return NextResponse.next()
  }

  // Determine if this is a phone device that should be redirected
  const shouldRedirect = shouldRedirectToMobile(userAgent)
  
  if (shouldRedirect) {
    // Use the route mapping system to determine the mobile route
    const mobileRoute = getMobileRouteString(pathname)
    
    if (mobileRoute && mobileRoute !== pathname) {
      // Only redirect if the mobile route is different from the current route
      // Create redirect URL with preserved query string
      const redirectUrl = new URL(mobileRoute + search, origin)
      const response = NextResponse.redirect(redirectUrl)
      
      // Set cookie to prevent redirect loops
      response.cookies.set(VIEW_PREFERENCE_COOKIE, 'mobile', { 
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      return response
    } else {
      // No mobile mapping found or mapping indicates to stay on main - set cookie
      const response = NextResponse.next()
      response.cookies.set(VIEW_PREFERENCE_COOKIE, 'main', { 
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      return response
    }
  }

  // Not a phone device, continue with normal processing
  // Set a cookie indicating desktop preference to avoid future checks
  const response = NextResponse.next()
  response.cookies.set(VIEW_PREFERENCE_COOKIE, 'main', { 
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
  
  return response
}

/**
 * Middleware configuration - specify which paths should run through middleware
 * Excludes static assets and API routes for performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - files with extensions (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}