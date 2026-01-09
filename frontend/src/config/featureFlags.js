/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for gradual rollout
 * and A/B testing of new features.
 */

export const featureFlags = {
  // UI Features
  useStaticUI: process.env.REACT_APP_USE_STATIC_UI === 'true',
  removeShuffleAnimation: process.env.REACT_APP_REMOVE_SHUFFLE === 'true' || true, // Default to true

  // Session Features
  enableSessionPersistence: process.env.REACT_APP_SESSION_PERSISTENCE === 'true',
  enableSessionSharing: process.env.REACT_APP_SESSION_SHARING === 'true',

  // Analytics
  enableAnalytics: process.env.REACT_APP_ANALYTICS === 'true',
  enablePerformanceMonitoring: process.env.REACT_APP_PERF_MONITORING === 'true',

  // Experimental
  enableDarkMode: process.env.REACT_APP_DARK_MODE === 'true',
  enableAdvancedOptions: process.env.REACT_APP_ADVANCED_OPTIONS === 'true',
};

/**
 * Check if a feature is enabled
 * @param {string} flagName - Name of the feature flag
 * @returns {boolean}
 */
export const isFeatureEnabled = (flagName) => {
  return featureFlags[flagName] === true;
};

/**
 * Get feature flag value
 * @param {string} flagName - Name of the feature flag
 * @param {*} defaultValue - Default value if flag is not set
 * @returns {*}
 */
export const getFeatureFlag = (flagName, defaultValue = false) => {
  return featureFlags[flagName] !== undefined ? featureFlags[flagName] : defaultValue;
};

export default featureFlags;
