import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdsManager } from '../services/adsManager';

interface AdBannerProps {
  size?: any;
}

export const AdBanner: React.FC<AdBannerProps> = ({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }) => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AdsManager.getBannerAdUnitId()}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
});
