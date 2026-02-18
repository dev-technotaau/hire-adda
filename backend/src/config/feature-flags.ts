import * as admin from 'firebase-admin';
import logger from './logger';

interface RemoteConfigValue {
    asString: () => string;
    asNumber: () => number;
    asBoolean: () => boolean;
}

interface FeatureFlagsConfig {
    [key: string]: boolean | string | number;
}

// Default feature flags (fallback if Remote Config fails)
const defaultFlags: FeatureFlagsConfig = {
    enableNewJobSearch: false,
    enableAIMatching: false,
    enableVideoInterviews: false,
    maintenanceMode: false,
    maxUploadSizeMB: 10,
    enableBetaFeatures: false,
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
        if (template.parameters) {
            for (const [key, param] of Object.entries(template.parameters)) {
                const defaultValue = param.defaultValue as RemoteConfigValue | undefined;
                if (defaultValue) {
                    // Try to parse as boolean, number, or string
                    const value = defaultValue.asString?.() || '';
                    if (value === 'true' || value === 'false') {
                        flags[key] = value === 'true';
                    } else if (!isNaN(Number(value))) {
                        flags[key] = Number(value);
                    } else {
                        flags[key] = value;
                    }
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
export const getFlag = async <T extends boolean | string | number>(
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
