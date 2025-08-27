// Mobile hooks barrel exports

// Device redirect hooks
export {
  useDeviceRedirect,
  useIsPhone,
  useIsClient
} from './useDeviceRedirect'

export type {
  DeviceRedirectConfig,
  DeviceRedirectResult
} from './useDeviceRedirect'

// Mobile analytics hooks
export {
  useMobileAnalytics,
  type MobileAnalyticsHook
} from './useMobileAnalytics'