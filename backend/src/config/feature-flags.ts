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
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch feature flags from Firebase Remote Config
 */
export const fetchFeatureFlags = async (): Promise<FeatureFlagsConfig> => {
  const now = Date.now();

  // Return cached flags if still valid
  if (now - lastFetchTime < CACHE_TTL_MS) {
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
 */
export const getAllFlags = async (): Promise<FeatureFlagsConfig> => {
  return fetchFeatureFlags();
};

export default { fetchFeatureFlags, getFlag, isFeatureEnabled, getAllFlags };
