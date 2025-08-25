// Mobile utilities barrel exports

// Device detection utilities
export {
  isPhoneDevice,
  isTabletDevice,
  isMobileDevice,
  getDeviceInfo,
  getDeviceType,
  shouldRedirectToMobile
} from './deviceDetection'

// Route mapping utilities
export {
  getMobileRoute,
  getMobileRouteString,
  hasMobileMapping,
  extractRouteParams,
  substituteRouteParams,
  matchesWildcardPattern,
  getRouteMappingsByType,
  addRouteMapping,
  removeRouteMapping,
  staticRouteMappings,
  parameterizedRouteMappings,
  wildcardRouteMappings,
  allRouteMappings
} from './routeMapping'

export type {
  RouteMapping,
  RouteMatch
} from './routeMapping'