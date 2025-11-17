# AdMob Integration Guide

## Overview

This directory contains the **shared AdMob module** used by all 100 applications in this repository. Every app uses the same ad configuration, components, and best practices.

---

## 📁 Files in This Module

| File | Purpose |
|------|---------|
| `admobConfig.ts` | Central configuration with Ad IDs and settings |
| `AdBanner.tsx` | Reusable banner component (320x50) |
| `AdInterstitial.tsx` | Interstitial ad manager singleton |
| `README_ADS.md` | This documentation file |

---

## 🎯 Ad Formats Used

### 1. Banner Ads (320x50 pixels)
- **Type**: Standard Banner
- **Size**: 320 x 50 pixels
- **Position**: Typically bottom of screen
- **Use Case**: Persistent, non-intrusive ads on main screens

### 2. Interstitial Ads (Full Screen)
- **Type**: Full-screen interstitial
- **Size**: Full device screen
- **Timing**: Between natural app flow breaks
- **Use Case**: App start, screen transitions, after completing actions

---

## 🔧 How AdMob Works in Expo

### Installation (Already done in each app)

```bash
expo install expo-ads-admob
```

### Required Configuration in app.json

Each app's `app.json` must include:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    },
    "ios": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    }
  }
}
```

---

## 📋 Ad Unit IDs

### Current IDs (Test IDs)

The module currently uses **Google's official test IDs** for development:

| Platform | Banner ID | Interstitial ID |
|----------|-----------|-----------------|
| Android | `ca-app-pub-3940256099942544/6300978111` | `ca-app-pub-3940256099942544/1033173712` |
| iOS | `ca-app-pub-3940256099942544/2934735716` | `ca-app-pub-3940256099942544/4411468910` |

### ⚠️ Before Publishing to Production

**YOU MUST REPLACE TEST IDS WITH YOUR REAL ADMOB IDS!**

1. Go to [Google AdMob Console](https://admob.google.com)
2. Create an app (or select existing)
3. Create ad units:
   - One Banner ad unit (320x50)
   - One Interstitial ad unit
4. Copy the Ad Unit IDs
5. Replace the IDs in `shared/admob/admobConfig.ts`:

```typescript
export const ADMOB_CONFIG = {
  BANNER_ID_ANDROID: 'ca-app-pub-YOUR_ID/YOUR_BANNER_ID',
  BANNER_ID_IOS: 'ca-app-pub-YOUR_ID/YOUR_BANNER_ID',
  INTERSTITIAL_ID_ANDROID: 'ca-app-pub-YOUR_ID/YOUR_INTERSTITIAL_ID',
  INTERSTITIAL_ID_IOS: 'ca-app-pub-YOUR_ID/YOUR_INTERSTITIAL_ID',
};
```

6. Update `googleMobileAdsAppId` in each app's `app.json`

---

## 💻 Usage Examples

### Using Banner Ads

Import and place in your screen component:

```tsx
import { AdBanner } from '../../../shared/admob/AdBanner';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Your content */}
      <Text>Welcome to the App</Text>

      {/* Banner at bottom */}
      <AdBanner />
    </View>
  );
}
```

### Using Interstitial Ads

#### 1. Initialize in App Root (App.tsx or _layout.tsx)

```tsx
import { InterstitialAdManager } from '../../../shared/admob/AdInterstitial';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Initialize interstitial ads
    InterstitialAdManager.init();

    // Show ad after 3 seconds (app start)
    InterstitialAdManager.showAdWithDelay(3000);
  }, []);

  return <YourAppContent />;
}
```

#### 2. Show on User Actions

```tsx
import { InterstitialAdManager } from '../../../shared/admob/AdInterstitial';

function SomeScreen() {
  const handleButtonPress = async () => {
    // Do something
    await saveData();

    // Show ad with frequency control (every 5 actions)
    InterstitialAdManager.showAdWithFrequency();

    // Navigate
    navigation.navigate('NextScreen');
  };

  return <Button onPress={handleButtonPress} title="Continue" />;
}
```

#### 3. Show on Screen Navigation

```tsx
const handleNavigate = () => {
  // Navigate first
  navigation.navigate('Details');

  // Show ad after navigation (with frequency)
  InterstitialAdManager.showAdWithFrequency();
};
```

---

## ⚙️ Configuration Options

### Modify Behavior in `admobConfig.ts`

```typescript
export const ADMOB_CONFIG = {
  // ... ad IDs ...

  BANNER_SIZE: 'BANNER', // 320x50 pixels
  INTERSTITIAL_SHOW_DELAY: 3000, // 3 seconds delay
  INTERSTITIAL_FREQUENCY: 5, // Show every 5 actions
};
```

**Available Banner Sizes:**
- `BANNER` - 320x50 (recommended)
- `FULL_BANNER` - 468x60
- `LARGE_BANNER` - 320x100
- `MEDIUM_RECTANGLE` - 300x250
- `SMART_BANNER` - Screen width adaptive

---

## 📍 Recommended Ad Placement

### Banner Ads ✅

**Good Placement:**
- Bottom of home screen
- Bottom of list views
- Bottom of game screens
- Top of content screens (less common)

**Bad Placement:**
- Over navigation elements ❌
- Over buttons ❌
- In the middle of forms ❌
- During video playback ❌

### Interstitial Ads ✅

**Good Timing:**
- App start (3-5 second delay)
- Between game levels
- After completing a task
- Between major screen transitions
- After saving/submitting data

**Bad Timing:**
- During user input ❌
- Every screen change ❌
- During critical actions (checkout, payment) ❌
- Too frequently (every 30 seconds) ❌

---

## 🧪 Testing Ads

### Development Mode

Test ads will automatically show during development. You'll see:
- "Test Ad" label on banners
- "This is a test ad" on interstitials

### Testing Checklist

- [ ] Banner loads on home screen
- [ ] Banner doesn't cover important UI
- [ ] Interstitial shows after delay on app start
- [ ] Interstitial respects frequency settings
- [ ] No ads show during critical user actions
- [ ] Ads load on both iOS and Android
- [ ] App doesn't crash if ad fails to load

---

## 🚀 Production Deployment

### Pre-Launch Checklist

1. **Replace all Ad IDs**
   - [ ] Update `BANNER_ID_ANDROID`
   - [ ] Update `BANNER_ID_IOS`
   - [ ] Update `INTERSTITIAL_ID_ANDROID`
   - [ ] Update `INTERSTITIAL_ID_IOS`
   - [ ] Update `googleMobileAdsAppId` in app.json

2. **Review Ad Placement**
   - [ ] Banners don't obstruct important UI
   - [ ] Interstitials show at appropriate times
   - [ ] Ad frequency isn't too aggressive

3. **Test with Real Ads**
   - [ ] Enable test devices in AdMob console
   - [ ] Test on physical devices
   - [ ] Verify ads display correctly

4. **Compliance**
   - [ ] Add Privacy Policy (required by Google)
   - [ ] Implement GDPR consent if needed
   - [ ] Update `servePersonalizedAds` based on consent

---

## 🔒 Privacy & GDPR Compliance

By default, all ads are configured with:

```typescript
servePersonalizedAds: false
```

This means **non-personalized ads** will show (GDPR-friendly).

### If You Want Personalized Ads

1. Implement a consent dialog
2. Store user consent
3. Pass consent to ad components:

```tsx
<AdMobBanner
  servePersonalizedAds={userHasConsented}
  // ... other props
/>
```

**Required for EU users**: You must show a consent dialog if targeting EU.

---

## 📊 Monitoring Ad Performance

After publishing, monitor your ads in the [AdMob Console](https://admob.google.com):

- **Impressions**: How many times ads were shown
- **Clicks**: How many times ads were clicked
- **eCPM**: Earnings per 1000 impressions
- **Fill Rate**: % of ad requests that were filled

### Optimization Tips

1. **Improve Fill Rate**
   - Enable mediation
   - Add multiple ad networks

2. **Increase eCPM**
   - Optimize ad placement
   - Target high-value users
   - Use appropriate ad formats

3. **Balance UX and Revenue**
   - Don't show ads too frequently
   - Place ads naturally in app flow
   - Offer "Remove Ads" IAP option

---

## ❓ Troubleshooting

### Banner Not Showing

- Check internet connection
- Verify Ad Unit ID is correct
- Check console for errors
- Ensure `googleMobileAdsAppId` is in app.json
- Test with Google's test IDs first

### Interstitial Not Showing

- Check if ad is loaded: `InterstitialAdManager.isReady()`
- Verify initialization: `InterstitialAdManager.init()` was called
- Check frequency settings
- Look for errors in console

### "App ID is missing" Error

Add `googleMobileAdsAppId` to `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    },
    "ios": {
      "config": {
        "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
      }
    }
  }
}
```

---

## 📚 Additional Resources

- [Expo AdMob Documentation](https://docs.expo.dev/versions/latest/sdk/admob/)
- [Google AdMob Help Center](https://support.google.com/admob)
- [AdMob Policy Center](https://support.google.com/admob/answer/6128543)
- [EU Consent Requirements](https://support.google.com/admob/answer/9760862)

---

## 🎓 Best Practices Summary

1. ✅ Use test IDs during development
2. ✅ Replace with real IDs before production
3. ✅ Show interstitials at natural break points
4. ✅ Keep banner ads at screen edges
5. ✅ Respect user experience (don't overdo it)
6. ✅ Handle ad load failures gracefully
7. ✅ Preload interstitials for better performance
8. ✅ Comply with privacy regulations
9. ✅ Offer "Remove Ads" option (recommended)
10. ✅ Monitor performance and optimize

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**Maintained By**: 100-Apps AdMob Factory Team
