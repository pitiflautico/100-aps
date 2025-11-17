/**
 * SHARED INTERSTITIAL AD MANAGER
 * ================================
 * Full-screen interstitial ad manager used across all 100 apps
 *
 * Usage:
 * import { InterstitialAdManager } from '@/shared/admob/AdInterstitial';
 *
 * // Initialize on app start
 * InterstitialAdManager.init();
 *
 * // Show interstitial
 * InterstitialAdManager.showAd();
 */

import { AdMobInterstitial } from 'expo-ads-admob';
import { getInterstitialId, ADMOB_CONFIG } from './admobConfig';

class InterstitialManager {
  private isAdReady: boolean = false;
  private actionCounter: number = 0;
  private isInitialized: boolean = false;

  /**
   * Initialize the interstitial ad
   * Call this when your app starts
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up event listeners
      AdMobInterstitial.addEventListener('interstitialDidLoad', () => {
        console.log('Interstitial ad loaded');
        this.isAdReady = true;
      });

      AdMobInterstitial.addEventListener('interstitialDidFailToLoad', (error) => {
        console.log('Interstitial ad failed to load:', error);
        this.isAdReady = false;
      });

      AdMobInterstitial.addEventListener('interstitialDidOpen', () => {
        console.log('Interstitial ad opened');
      });

      AdMobInterstitial.addEventListener('interstitialDidClose', () => {
        console.log('Interstitial ad closed');
        this.isAdReady = false;
        // Preload next ad
        this.loadAd();
      });

      // Set the ad unit ID
      await AdMobInterstitial.setAdUnitID(getInterstitialId());

      // Load the first ad
      await this.loadAd();

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing interstitial:', error);
    }
  }

  /**
   * Load an interstitial ad
   */
  async loadAd() {
    try {
      await AdMobInterstitial.requestAdAsync({
        servePersonalizedAds: false, // GDPR compliance
      });
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
    }
  }

  /**
   * Show the interstitial ad if ready
   * @returns Promise<boolean> - true if ad was shown, false otherwise
   */
  async showAd(): Promise<boolean> {
    if (!this.isAdReady) {
      console.log('Interstitial ad not ready');
      return false;
    }

    try {
      await AdMobInterstitial.showAdAsync();
      return true;
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      return false;
    }
  }

  /**
   * Show ad based on action frequency
   * Call this on user actions (button clicks, screen navigation, etc.)
   * Ad will show every N actions based on INTERSTITIAL_FREQUENCY config
   *
   * @returns Promise<boolean> - true if ad was shown, false otherwise
   */
  async showAdWithFrequency(): Promise<boolean> {
    this.actionCounter++;

    if (this.actionCounter >= ADMOB_CONFIG.INTERSTITIAL_FREQUENCY) {
      this.actionCounter = 0;
      return await this.showAd();
    }

    return false;
  }

  /**
   * Show ad with a delay
   * Useful for app start or screen transitions
   *
   * @param delay - milliseconds to wait before showing (default from config)
   * @returns Promise<boolean> - true if ad was shown, false otherwise
   */
  async showAdWithDelay(delay: number = ADMOB_CONFIG.INTERSTITIAL_SHOW_DELAY): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const shown = await this.showAd();
        resolve(shown);
      }, delay);
    });
  }

  /**
   * Reset the action counter
   * Useful if you want to reset the frequency count
   */
  resetCounter() {
    this.actionCounter = 0;
  }

  /**
   * Check if an ad is ready to show
   */
  isReady(): boolean {
    return this.isAdReady;
  }

  /**
   * Clean up event listeners
   * Call this when your app is closing (rarely needed)
   */
  cleanup() {
    AdMobInterstitial.removeAllListeners();
    this.isInitialized = false;
    this.isAdReady = false;
  }
}

// Export singleton instance
export const InterstitialAdManager = new InterstitialManager();

/**
 * USAGE EXAMPLES:
 *
 * 1. Initialize in App.tsx:
 *    import { InterstitialAdManager } from '@/shared/admob/AdInterstitial';
 *    useEffect(() => {
 *      InterstitialAdManager.init();
 *    }, []);
 *
 * 2. Show on app start (with delay):
 *    InterstitialAdManager.showAdWithDelay(3000);
 *
 * 3. Show on button click with frequency:
 *    <Button onPress={() => {
 *      doSomething();
 *      InterstitialAdManager.showAdWithFrequency();
 *    }} />
 *
 * 4. Show on screen navigation:
 *    navigation.navigate('Details');
 *    InterstitialAdManager.showAdWithFrequency();
 *
 * BEST PRACTICES:
 * - Don't show ads too frequently (ruins UX)
 * - Show between natural break points (level completion, screen changes)
 * - Never show during critical user actions
 * - Always show with delay on app start
 * - Preload ads for better performance
 */
