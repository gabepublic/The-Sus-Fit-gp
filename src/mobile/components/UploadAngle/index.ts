/**
 * @fileoverview UploadAngle Module - Main entry point for the isolated Upload Your Angle View component system
 * @module @/mobile/components/UploadAngle
 * 
 * This module provides a completely isolated implementation of the Upload Your Angle View
 * component, following the UPLOAD_ANGLE_ISOLATION_STRATEGY.md guidelines.
 * 
 * ISOLATION REQUIREMENTS:
 * - Zero dependencies on HomeView components
 * - Independent state management
 * - Isolated styling system
 * - Separate error boundaries
 * - Independent testing infrastructure
 */

// Re-export all module interfaces using barrel export pattern
export * from './types';
export * from './utils';
export * from './hooks';
export * from './components';
export * from './containers';
export * from './styles';

// Version info for the UploadAngle module
export const UPLOAD_ANGLE_VERSION = '1.0.0';
export const UPLOAD_ANGLE_MODULE_NAME = 'UploadAngle';

// Module metadata for debugging and monitoring
export const UPLOAD_ANGLE_METADATA = {
  version: UPLOAD_ANGLE_VERSION,
  name: UPLOAD_ANGLE_MODULE_NAME,
  isolated: true,
  dependencies: [],
  route: '/upload-angle',
  description: 'Isolated Upload Your Angle View component system'
} as const;