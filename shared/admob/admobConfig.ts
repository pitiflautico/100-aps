/**
 * SHARED ADMOB CONFIGURATION
 * ===========================
 * This configuration is used by ALL 100 apps in the repository.
 *
 * BANNER SIZE: 320x50 pixels (BANNER standard)
 * INTERSTITIAL: Full screen standard
 *
 * IMPORTANT: Before publishing to production:
 * 1. Replace test IDs with your real AdMob IDs from Google AdMob Console
 * 2. Each app can override these IDs in their own app.json/app.config.js
 * 3. Test ads will show in development, real ads in production
 *
 * How to get AdMob IDs:
 * 1. Go to https://admob.google.com
 * 2. Create an app
 * 3. Create ad units (Banner and Interstitial)
 * 4. Copy the ad unit IDs here
 */

// Test IDs for development (Google's official test IDs)
export const ADMOB_CONFIG = {
  // Banner Ad (320x50)
  BANNER_ID_ANDROID: 'ca-app-pub-3940256099942544/6300978111',
  BANNER_ID_IOS: 'ca-app-pub-3940256099942544/2934735716',

  // Interstitial Ad (Full Screen)
  INTERSTITIAL_ID_ANDROID: 'ca-app-pub-3940256099942544/1033173712',
  INTERSTITIAL_ID_IOS: 'ca-app-pub-3940256099942544/4411468910',

  // Banner size configuration
  BANNER_SIZE: 'BANNER' as const, // 320x50 pixels

  // Ad behavior settings
  INTERSTITIAL_SHOW_DELAY: 3000, // milliseconds before showing interstitial
  INTERSTITIAL_FREQUENCY: 5, // show interstitial every N actions
};

/**
 * Get the appropriate Ad ID based on platform
 */
import { Platform } from 'react-native';

export const getBannerId = (): string => {
  return Platform.OS === 'ios'
    ? ADMOB_CONFIG.BANNER_ID_IOS
    : ADMOB_CONFIG.BANNER_ID_ANDROID;
};

export const getInterstitialId = (): string => {
  return Platform.OS === 'ios'
    ? ADMOB_CONFIG.INTERSTITIAL_ID_IOS
    : ADMOB_CONFIG.INTERSTITIAL_ID_ANDROID;
};

/**
 * Production IDs (Replace these before publishing!)
 *
 * PRODUCTION_BANNER_ID_ANDROID: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
 * PRODUCTION_BANNER_ID_IOS: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
 * PRODUCTION_INTERSTITIAL_ID_ANDROID: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
 * PRODUCTION_INTERSTITIAL_ID_IOS: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
 */
