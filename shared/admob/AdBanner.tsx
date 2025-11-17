/**
 * SHARED AD BANNER COMPONENT
 * ===========================
 * Standard banner ad component (320x50) used across all 100 apps
 *
 * Usage:
 * import { AdBanner } from '@/shared/admob/AdBanner';
 * <AdBanner />
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AdMobBanner } from 'expo-ads-admob';
import { getBannerId, ADMOB_CONFIG } from './admobConfig';

interface AdBannerProps {
  style?: object;
}

export const AdBanner: React.FC<AdBannerProps> = ({ style }) => {
  const [bannerError, setBannerError] = React.useState(false);

  const handleAdFailedToLoad = (error: any) => {
    console.log('Banner ad failed to load:', error);
    setBannerError(true);
  };

  // Don't render anything if there was an error
  if (bannerError) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <AdMobBanner
        bannerSize={ADMOB_CONFIG.BANNER_SIZE}
        adUnitID={getBannerId()}
        servePersonalizedAds={false} // GDPR compliance - set to true if you handle consent
        onDidFailToReceiveAdWithError={handleAdFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    height: 50, // Standard banner height
    width: '100%',
  },
});

/**
 * NOTES:
 * - Banner size is 320x50 pixels (BANNER)
 * - servePersonalizedAds is set to false by default for GDPR compliance
 * - If ad fails to load, the component will hide itself
 * - You can customize the container style by passing a style prop
 *
 * POSITIONS TO USE BANNER:
 * - Bottom of Home Screen (most common)
 * - Bottom of any major screen
 * - Top of screen (less common)
 *
 * DO NOT USE:
 * - During critical user actions (form submission, checkout)
 * - Over important UI elements
 * - In a way that causes accidental clicks
 */
