/**
 * Deep-link mapping system for translating main app routes to mobile routes
 * Supports static routes, parameterized routes, and wildcard patterns
 */

/**
 * Route mapping configuration interface
 */
export interface RouteMapping {
  /** The main app route pattern */
  from: string
  /** The mobile route pattern */
  to: string
  /** Whether this route supports parameters */
  parametrized?: boolean
  /** Whether this is a wildcard pattern */
  wildcard?: boolean
  /** Optional description of the route */
  description?: string
}

/**
 * Route matching result interface
 */
export interface RouteMatch {
  /** The mapped mobile route */
  route: string
  /** Extracted parameters from the route */
  params?: Record<string, string>
  /** The mapping configuration that matched */
  mapping: RouteMapping
}

/**
 * Static route mappings for main app to mobile routes
 * These are exact string matches
 */
export const staticRouteMappings: RouteMapping[] = [
  {
    from: '/',
    to: '/m/home',
    description: 'Home page'
  },
  {
    from: '/upload-angle',
    to: '/m/upload-angle',
    description: 'Upload angle/photo page'
  },
  {
    from: '/upload-fit',
    to: '/m/upload-fit',
    description: 'Upload garment/fit page'
  },
  {
    from: '/tryon',
    to: '/m/tryon',
    description: 'Virtual try-on results page'
  },
  {
    from: '/share',
    to: '/m/share',
    description: 'Share results page'
  }
]

/**
 * Parameterized route mappings for dynamic routes
 * These support parameter extraction and substitution
 */
export const parameterizedRouteMappings: RouteMapping[] = [
  {
    from: '/user/:id',
    to: '/m/user/:id',
    parametrized: true,
    description: 'User profile page'
  },
  {
    from: '/tryon/:id',
    to: '/m/tryon/:id',
    parametrized: true,
    description: 'Specific try-on result page'
  },
  {
    from: '/share/:id',
    to: '/m/share/:id',
    parametrized: true,
    description: 'Shared try-on result page'
  }
]

/**
 * Wildcard route mappings for catch-all patterns
 * These are evaluated last as fallbacks
 */
export const wildcardRouteMappings: RouteMapping[] = [
  {
    from: '/admin/*',
    to: '/admin/*', // Admin routes stay on main version
    wildcard: true,
    description: 'Admin pages (no mobile version)'
  },
  {
    from: '/api/*',
    to: '/api/*', // API routes stay as-is
    wildcard: true,
    description: 'API endpoints (no redirection)'
  }
]

/**
 * All route mappings combined in priority order
 */
export const allRouteMappings: RouteMapping[] = [
  ...staticRouteMappings,
  ...parameterizedRouteMappings,
  ...wildcardRouteMappings
]

/**
 * Extract parameters from a parameterized route
 * @param pattern Route pattern with :param syntax
 * @param path Actual path to extract parameters from
 * @returns Extracted parameters object
 */
export function extractRouteParams(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  // Must have same number of parts for parameterized routes
  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params: Record<string, string> = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      // This is a parameter
      const paramName = patternPart.slice(1)
      params[paramName] = pathPart
    } else if (patternPart !== pathPart) {
      // Non-parameter parts must match exactly
      return null
    }
  }

  return params
}

/**
 * Substitute parameters in a route pattern
 * @param pattern Route pattern with :param syntax
 * @param params Parameters to substitute
 * @returns Route with parameters substituted
 */
export function substituteRouteParams(pattern: string, params: Record<string, string>): string {
  let result = pattern

  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, value)
  })

  return result
}

/**
 * Check if a path matches a wildcard pattern
 * @param pattern Wildcard pattern with * syntax
 * @param path Path to test
 * @returns Whether the path matches the pattern
 */
export function matchesWildcardPattern(pattern: string, path: string): boolean {
  if (!pattern.includes('*')) {
    return pattern === path
  }

  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\//g, '\\/')

  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

/**
 * Get the mobile route for a given main app route
 * @param mainRoute The main app route to map
 * @returns RouteMatch if a mapping exists, null otherwise
 */
export function getMobileRoute(mainRoute: string): RouteMatch | null {
  // First try static routes (fastest)
  for (const mapping of staticRouteMappings) {
    if (mapping.from === mainRoute) {
      return {
        route: mapping.to,
        mapping
      }
    }
  }

  // Then try parameterized routes
  for (const mapping of parameterizedRouteMappings) {
    if (mapping.parametrized) {
      const params = extractRouteParams(mapping.from, mainRoute)
      if (params) {
        const mappedRoute = substituteRouteParams(mapping.to, params)
        return {
          route: mappedRoute,
          params,
          mapping
        }
      }
    }
  }

  // Finally try wildcard patterns
  for (const mapping of wildcardRouteMappings) {
    if (mapping.wildcard && matchesWildcardPattern(mapping.from, mainRoute)) {
      // For wildcards, extract the matched portion and substitute
      const fromPrefix = mapping.from.replace('/*', '')
      const matchedSuffix = mainRoute.substring(fromPrefix.length + 1) // Remove prefix and leading slash
      const route = mapping.to.replace('*', matchedSuffix)
      return {
        route,
        mapping
      }
    }
  }

  // No mapping found
  return null
}

/**
 * Get all available route mappings for a specific type
 * @param type Type of mappings to retrieve
 * @returns Array of route mappings
 */
export function getRouteMappingsByType(type: 'static' | 'parameterized' | 'wildcard' | 'all'): RouteMapping[] {
  switch (type) {
    case 'static':
      return staticRouteMappings
    case 'parameterized':
      return parameterizedRouteMappings
    case 'wildcard':
      return wildcardRouteMappings
    case 'all':
      return allRouteMappings
    default:
      return []
  }
}

/**
 * Check if a route has a mobile mapping available
 * @param mainRoute The main app route to check
 * @returns Whether a mobile mapping exists
 */
export function hasMobileMapping(mainRoute: string): boolean {
  return getMobileRoute(mainRoute) !== null
}

/**
 * Get the mobile route string only (without metadata)
 * @param mainRoute The main app route to map
 * @returns Mobile route string or null if no mapping exists
 */
export function getMobileRouteString(mainRoute: string): string | null {
  const match = getMobileRoute(mainRoute)
  return match ? match.route : null
}

/**
 * Add a new route mapping at runtime
 * @param mapping The route mapping to add
 * @param type The type of mapping (static, parameterized, or wildcard)
 */
export function addRouteMapping(mapping: RouteMapping, type: 'static' | 'parameterized' | 'wildcard' = 'static'): void {
  switch (type) {
    case 'static':
      staticRouteMappings.push(mapping)
      break
    case 'parameterized':
      parameterizedRouteMappings.push(mapping)
      break
    case 'wildcard':
      wildcardRouteMappings.push(mapping)
      break
  }
}

/**
 * Remove a route mapping
 * @param from The main route pattern to remove
 * @param type The type of mapping to remove from
 * @returns Whether the mapping was found and removed
 */
export function removeRouteMapping(from: string, type: 'static' | 'parameterized' | 'wildcard' = 'static'): boolean {
  let mappings: RouteMapping[]

  switch (type) {
    case 'static':
      mappings = staticRouteMappings
      break
    case 'parameterized':
      mappings = parameterizedRouteMappings
      break
    case 'wildcard':
      mappings = wildcardRouteMappings
      break
  }

  const index = mappings.findIndex(mapping => mapping.from === from)
  if (index !== -1) {
    mappings.splice(index, 1)
    return true
  }

  return false
}