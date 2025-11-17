import { Platform } from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// Ad Unit IDs - Using test IDs
const BANNER_AD_ID = TestIds.BANNER;
const INTERSTITIAL_AD_ID = TestIds.INTERSTITIAL;

class AdsManagerClass {
  private interstitialAd: InterstitialAd | null = null;
  private interstitialLoaded = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Initialize Interstitial Ad
    this.interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_ID);

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.interstitialLoaded = true;
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.interstitialLoaded = false;
      this.interstitialAd?.load();
    });

    this.interstitialAd.load();
  }

  static getBannerAdUnitId(): string {
    return BANNER_AD_ID;
  }

  static async showInterstitialAd(): Promise<void> {
    const instance = adsManagerInstance;
    if (instance.interstitialLoaded && instance.interstitialAd) {
      try {
        await instance.interstitialAd.show();
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
      }
    }
  }
}

// Create singleton instance
const adsManagerInstance = new AdsManagerClass();

// Export the class for static method access
export const AdsManager = AdsManagerClass;

// Export helper functions for convenience
export const initializeAds = () => {
  // Ads are initialized in constructor, this is a no-op but keeps API consistent
};

export const showInterstitialAd = () => AdsManager.showInterstitialAd();
