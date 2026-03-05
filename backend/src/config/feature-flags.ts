import * as admin from 'firebase-admin';
import logger from './logger';

interface FeatureFlagsConfig {
  [key: string]: boolean | string | number;
}

// Default feature flags (fallback if Remote Config fails)
// All service flags default to ON — toggle OFF from Firebase Console to disable at runtime
const defaultFlags: FeatureFlagsConfig = {
  // Core feature toggles
  maintenanceMode: false,
  enableBetaFeatures: true,

  // Search & Matching
  enableElasticsearch: true,
  enableAIMatching: true,
  enableCloudTalent: true,

  // Notifications
  enableEmailNotifications: true,
  enableSMS: true,
  enableWhatsApp: true,
  enableFCM: true,
  enableWebhooks: true,

  // AI & Analytics
  enableDocumentAI: true,
  enableBigQuery: true,

  // Infrastructure
  enableKafka: true,
  enablePresence: true,
  enableFirestoreCounters: true,

  // Config values
  maxUploadSizeMB: 5,
};

let cachedFlags: FeatureFlagsConfig = { ...defaultFlags };
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute — short TTL so maintenance toggle takes effect quickly

/**
 * Invalidate the feature flags cache so the next fetch hits Firebase directly.
 */
export const invalidateCache = (): void => {
  lastFetchTime = 0;
};

/**
 * Fetch feature flags from Firebase Remote Config
 * @param force - bypass cache and fetch fresh from Firebase
 */
export const fetchFeatureFlags = async (force = false): Promise<FeatureFlagsConfig> => {
  const now = Date.now();

  // Return cached flags if still valid (unless force refresh)
  if (!force && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedFlags;
  }

  try {
    const remoteConfig = admin.remoteConfig();
    const template = await remoteConfig.getTemplate();

    const flags: FeatureFlagsConfig = { ...defaultFlags };

    // Parse parameters from template
    // Admin SDK returns { value: string } for explicit values
    if (template.parameters) {
      for (const [key, param] of Object.entries(template.parameters)) {
        const dv = param.defaultValue as { value?: string } | undefined;
        const value = dv?.value;
        if (value === undefined || value === null) continue;

        if (value === 'true' || value === 'false') {
          flags[key] = value === 'true';
        } else if (value !== '' && !isNaN(Number(value))) {
          flags[key] = Number(value);
        } else {
          flags[key] = value;
        }
      }
    }

    cachedFlags = flags;
    lastFetchTime = now;
    logger.info('Feature flags refreshed from Firebase Remote Config');

    return flags;
  } catch (error) {
    logger.error('Failed to fetch feature flags from Firebase:', error);
    return cachedFlags;
  }
};

/**
 * Get a specific feature flag value
 */
export const getFlag = async <T extends boolean | string | number | null>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const flags = await fetchFeatureFlags();
  return (flags[key] as T) ?? defaultValue;
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = async (key: string): Promise<boolean> => {
  return getFlag(key, false);
};

/**
 * Get all feature flags (for admin panel)
 * @param force - bypass cache and fetch fresh from Firebase
 */
export const getAllFlags = async (force = false): Promise<FeatureFlagsConfig> => {
  return fetchFeatureFlags(force);
};

export default { fetchFeatureFlags, getFlag, isFeatureEnabled, getAllFlags, invalidateCache };
