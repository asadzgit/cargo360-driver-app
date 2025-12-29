import Constants from 'expo-constants';

// Get API base URL
const BASE_URL = 'https://cargo360-api.onrender.com';

/**
 * Gets the current app version from Expo Constants
 */
export function getAppVersion(): string {
  return Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
}

/**
 * Gets the platform (android or ios)
 */
export function getPlatform(): 'android' | 'ios' {
  return Constants.platform?.ios ? 'ios' : 'android';
}

export interface VersionCheckResult {
  updateRequired: boolean;
  force: boolean;
  storeUrl: string;
  minSupportedVersion?: string;
  latestVersion?: string;
}

/**
 * Checks if app version update is required
 * @returns {Promise<VersionCheckResult | null>}
 */
export async function checkAppVersion(): Promise<VersionCheckResult | null> {
  try {
    const appVersion = getAppVersion();
    const platform = getPlatform();

    const response = await fetch(`${BASE_URL}/mobile/app-version`, {
      method: 'GET',
      headers: {
        'Platform': platform,
        'App-Version': appVersion,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If version check fails, allow app to continue (fail open)
      console.warn('Version check failed, allowing app to continue');
      return null;
    }

    const data = await response.json();
    return {
      updateRequired: data.updateRequired || false,
      force: data.force || false,
      storeUrl: data.storeUrl || '',
      minSupportedVersion: data.minSupportedVersion,
      latestVersion: data.latestVersion,
    };
  } catch (error) {
    console.error('Error checking app version:', error);
    // Fail open - allow app to continue if version check fails
    return null;
  }
}


