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

// Note: Upload Fit uses the main application hooks from @/hooks/useImageUpload
// No custom hooks needed for UploadFit as per requirements