/**
 * Ads Manager
 * Manages AdMob banner and interstitial ads
 */

import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// AdMob Ad Unit IDs
const ADMOB_CONFIG = {
  BANNER_ID_ANDROID: TestIds.ADAPTIVE_BANNER,
  BANNER_ID_IOS: TestIds.ADAPTIVE_BANNER,
  INTERSTITIAL_ID_ANDROID: TestIds.INTERSTITIAL,
  INTERSTITIAL_ID_IOS: TestIds.INTERSTITIAL,
};

class AdsManagerClass {
  private interstitialAd: InterstitialAd | null = null;
  private interstitialLoaded: boolean = false;
  private actionCount: number = 0;
  private readonly ACTION_THRESHOLD = 5;

  constructor() {
    this.initializeInterstitial();
  }

  /**
   * Initialize interstitial ad
   */
  private initializeInterstitial() {
    this.interstitialAd = InterstitialAd.createForAdRequest(
      this.getInterstitialAdUnitId(),
      {
        requestNonPersonalizedAdsOnly: true,
      }
    );

    // Load the ad
    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.interstitialLoaded = true;
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.interstitialLoaded = false;
      this.interstitialAd?.load(); // Preload next ad
    });

    this.interstitialAd.load();
  }

  /**
   * Get banner ad unit ID based on platform
   */
  public getBannerAdUnitId(): string {
    return Platform.OS === 'ios'
      ? ADMOB_CONFIG.BANNER_ID_IOS
      : ADMOB_CONFIG.BANNER_ID_ANDROID;
  }

  /**
   * Get interstitial ad unit ID based on platform
   */
  private getInterstitialAdUnitId(): string {
    return Platform.OS === 'ios'
      ? ADMOB_CONFIG.INTERSTITIAL_ID_IOS
      : ADMOB_CONFIG.INTERSTITIAL_ID_ANDROID;
  }

  /**
   * Show interstitial ad
   */
  public async showInterstitialAd(): Promise<void> {
    if (this.interstitialLoaded && this.interstitialAd) {
      try {
        await this.interstitialAd.show();
      } catch (error) {
        console.error('Error showing interstitial ad:', error);
      }
    }
  }

  /**
   * Track user action and show ad based on frequency
   */
  public trackAction(): void {
    this.actionCount++;
    if (this.actionCount >= this.ACTION_THRESHOLD) {
      this.showInterstitialAd();
      this.actionCount = 0;
    }
  }
}

export const AdsManager = new AdsManagerClass();
