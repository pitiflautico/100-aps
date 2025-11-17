# Metronome Pro

> Professional metronome application for musicians and rhythm training

---

## 📱 App Overview

**Metronome Pro** is a fully offline, professional-grade metronome app designed for musicians, music students, and anyone who needs accurate tempo training. Built with React Native and Expo, it features a clean interface, multiple time signatures, and precise BPM control from 40 to 240.

**Category**: Music & Study Tools
**Platform**: iOS, Android
**Type**: Offline, No Backend Required
**Monetization**: AdMob (Banner + Interstitial)

---

## ✨ Key Features

- ⏱️ **Precise BPM Control**: Range from 40 to 240 BPM with 1 BPM increments
- 🎵 **Multiple Time Signatures**: Support for 2/4, 3/4, 4/4, 5/4, and 6/8
- 👁️ **Visual Beat Indicator**: Clear visual feedback for each beat
- 🎯 **Accent Beats**: First beat of each measure is accented
- 🎨 **Modern UI**: Clean, professional interface with smooth animations
- 📱 **Fully Offline**: Works without internet connection
- 💯 **Accurate Timing**: Reliable metronome engine for practice
- 🎭 **No Distractions**: Simple, focused interface for musicians

---

## 🎬 Screen Flow

### Main Screen (Home)
- Large START/STOP button for play control
- Visual beat indicators showing current beat
- BPM control with +/- buttons and direct input
- Time signature selector (disabled while playing)
- Helpful info messages

### Features by Section:
1. **Header**: App branding and title
2. **Beat Display**: Visual indicators for each beat in measure
3. **Play Control**: Large circular play/stop button
4. **BPM Control**: Increment/decrement buttons with numeric display
5. **Time Signature**: Quick selector for different rhythms
6. **Banner Ad**: Bottom banner (320x50)

---

## 🎨 Branding

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#4A6CF7` | Main buttons, active states, branding |
| Secondary | `#F7C948` | Time signature selector, accents |
| Background | `#FFFFFF` | Main background |
| Text | `#1A1A1A` | Primary text |
| Accent | `#36CFC9` | Special highlights |
| Gray Light | `#F5F5F5` | Inactive elements |
| Gray Medium | `#CCCCCC` | Borders |
| Gray Dark | `#666666` | Secondary text |
| Error | `#F44336` | Stop button |
| Success | `#4CAF50` | Status indicators |

### Typography

- **Headings**: Bold, 24-32px
- **Body Text**: Regular, 16px
- **Small Text**: Regular, 14px
- **Numbers**: Bold, varies by context

---

## 💰 Advertising

### Ad Configuration

**Banner Ad**:
- Type: Standard Banner
- Size: 320x50 pixels
- Position: Bottom of screen
- Always visible: Yes

**Interstitial Ad**:
- Type: Full-screen interstitial
- Timing:
  - On app start (after 3 seconds)
  - Every 5 user actions (play/stop, BPM changes)
- Frequency: Controlled to avoid disrupting practice

### Ad Module Location

All advertising code uses **react-native-google-mobile-ads**:
- Library: `react-native-google-mobile-ads` v14.3.0
- Location: `/services/adsManager.ts`
- Banner Component: `/components/AdBanner.tsx`
- Test IDs: Uses Google's TestIds in development
- Production: Configure real Ad Unit IDs in adsManager.ts

### AdMob IDs

**Current (Test IDs)**:
- Banner Android: `ca-app-pub-3940256099942544/6300978111`
- Banner iOS: `ca-app-pub-3940256099942544/2934735716`
- Interstitial Android: `ca-app-pub-3940256099942544/1033173712`
- Interstitial iOS: `ca-app-pub-3940256099942544/4411468910`

⚠️ **Before Production**: Replace test IDs with your real AdMob unit IDs in `shared/admob/admobConfig.ts`

### How to Replace AdMob IDs

1. Go to [Google AdMob Console](https://admob.google.com)
2. Create your app and ad units
3. Copy your Ad Unit IDs
4. Update `shared/admob/admobConfig.ts`:
   ```typescript
   export const ADMOB_CONFIG = {
     BANNER_ID_ANDROID: 'ca-app-pub-YOUR_ID/YOUR_BANNER_ID',
     BANNER_ID_IOS: 'ca-app-pub-YOUR_ID/YOUR_BANNER_ID',
     INTERSTITIAL_ID_ANDROID: 'ca-app-pub-YOUR_ID/YOUR_INTERSTITIAL_ID',
     INTERSTITIAL_ID_IOS: 'ca-app-pub-YOUR_ID/YOUR_INTERSTITIAL_ID',
   };
   ```
5. Update `googleMobileAdsAppId` in `app.json`

📖 **Full Ad Documentation**: See `/shared/admob/README_ADS.md`

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (for testing)

### Install Dependencies

```bash
cd apps/app_001_Metronome_Pro
npm install
```

### Run the App

```bash
npm start
```

Then:
- Scan QR code with Expo Go (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser

---

## 📂 Project Structure

```
app_001_Metronome_Pro/
├── App.tsx                  # Main app component
├── app.json                 # Expo configuration
├── package.json             # Dependencies
│
├── components/              # Reusable UI components
│   ├── BPMControl.tsx      # BPM adjustment controls
│   ├── MetronomeDisplay.tsx # Visual beat indicator
│   ├── PlayButton.tsx      # Start/Stop button
│   └── TimeSignatureSelector.tsx # Time signature picker
│
├── hooks/                   # Custom React hooks
│   └── useMetronome.ts     # Metronome logic and state
│
├── theme/                   # Design system
│   ├── colors.ts           # Color palette
│   ├── typography.ts       # Font styles
│   ├── spacing.ts          # Spacing values
│   └── index.ts            # Theme exports
│
├── __tests__/              # Unit tests
│   └── useMetronome.test.ts
│
├── assets/                 # Images, icons, sounds
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
│
├── README.md               # This file
└── TECH.md                 # Technical documentation
```

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Coverage

```bash
npm test -- --coverage
```

### What's Tested

- ✅ Metronome hook initialization
- ✅ BPM increase/decrease
- ✅ BPM min/max clamping
- ✅ Play/pause functionality
- ✅ Time signature changes
- ✅ Beat counting logic

---

## 🔨 Building for Production

### Configure EAS

```bash
eas build:configure
```

### Build for Android

```bash
eas build --platform android
```

### Build for iOS

```bash
eas build --platform ios
```

### Submit to Stores

```bash
eas submit --platform android
eas submit --platform ios
```

---

## 🎯 Features Roadmap

### Current Version (v1.0.0)
- ✅ Basic metronome functionality
- ✅ Multiple time signatures
- ✅ Visual beat indicators
- ✅ BPM control (40-240)
- ✅ AdMob integration

### Future Enhancements (v1.1.0+)
- [ ] Audio click sounds (high/low pitch)
- [ ] Tempo presets (Largo, Andante, Allegro, etc.)
- [ ] Subdivisions (eighth notes, triplets)
- [ ] Tap tempo feature
- [ ] Save favorite tempos
- [ ] Dark mode support
- [ ] Practice session timer
- [ ] Sound volume control
- [ ] Different click sound options
- [ ] Vibration feedback
- [ ] Background audio support
- [ ] "Remove Ads" in-app purchase

---

## ⚙️ Configuration

### App Settings (app.json)

- **App Name**: Metronome Pro
- **Bundle ID (iOS)**: `com.yourcompany.metronomepro`
- **Package (Android)**: `com.yourcompany.metronomepro`
- **Orientation**: Portrait only
- **Permissions**: Internet (for ads)

### Customization

**Change App Name**:
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name"
  }
}
```

**Change Brand Colors**:
Edit `theme/colors.ts`:
```typescript
export const colors = {
  primary: '#YOUR_COLOR',
  // ...
};
```

---

## ⚠️ Limitations

- **Audio Clicks**: Currently uses visual-only feedback. Audio click sounds can be added in future versions
- **Background Play**: Does not play in background (iOS limitation without audio)
- **Sound Options**: Single click sound (to be expanded)
- **Subdivisions**: No subdivision support yet (eighth notes, triplets)

---

## 🐛 Known Issues

- None currently reported

---

## 📄 License

MIT License - Free to use commercially and personally

---

## 👥 Support

For issues or questions:
1. Check the [main repository README](../../README.md)
2. Review [AdMob integration guide](../../shared/admob/README_ADS.md)
3. Consult [Expo documentation](https://docs.expo.dev/)

---

## 🙏 Credits

Built with:
- [Expo](https://expo.dev/) - React Native framework
- [React Native](https://reactnative.dev/) - Mobile framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Google AdMob](https://admob.google.com/) - Monetization

---

## 📊 App Statistics

- **Lines of Code**: ~800
- **Components**: 4
- **Hooks**: 1
- **Tests**: 8+
- **Supported Time Signatures**: 5
- **BPM Range**: 40-240
- **File Size**: ~5 MB (estimated)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Part of**: [100 Apps AdMob Factory](../../README.md)
