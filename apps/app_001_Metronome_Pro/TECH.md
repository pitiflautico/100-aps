# Metronome Pro - Technical Documentation

> Detailed technical architecture, design decisions, and implementation details

---

## 🏗️ Architecture Overview

### Design Pattern

This app follows a **Component-Based Architecture** with **Custom Hooks** pattern:

```
┌─────────────────────────────────────────┐
│            App.tsx (Root)               │
│         (UI Composition Layer)          │
└────────────┬────────────────────────────┘
             │
       ┌─────┴─────────────────┐
       │                       │
   ┌───▼──────┐         ┌──────▼─────┐
   │Components│         │   Hooks    │
   │(Pure UI) │         │  (Logic)   │
   └───┬──────┘         └──────┬─────┘
       │                       │
       │            ┌──────────▼─────────┐
       │            │  useMetronome      │
       │            │  (State + Timing)  │
       │            └────────────────────┘
       │
   ┌───▼──────────┐
   │    Theme     │
   │ (Design Sys) │
   └──────────────┘
```

### Key Principles

1. **Separation of Concerns**: UI components are pure (presentational), logic is in hooks
2. **Single Responsibility**: Each component has one clear purpose
3. **Reusability**: Components are designed to be reusable
4. **Type Safety**: TypeScript for compile-time error catching
5. **Performance**: Optimized rendering with React best practices

---

## 📦 Core Components

### 1. App.tsx
**Responsibility**: Main app container and composition

**Key Features**:
- Integrates all child components
- Manages AdMob initialization
- Provides scrollable layout
- Safe area handling

**Dependencies**:
- useMetronome hook for state
- All UI components
- Theme system

### 2. useMetronome Hook
**Responsibility**: Metronome logic and state management

**State Variables**:
```typescript
{
  bpm: number;              // Current tempo (40-240)
  isPlaying: boolean;       // Play/pause state
  currentBeat: number;      // Current beat in measure (0-N)
  timeSignature: TimeSignature; // Current time signature
}
```

**Functions**:
```typescript
{
  setBpm: (bpm: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  increaseBpm: () => void;
  decreaseBpm: () => void;
}
```

**Timing Implementation**:
- Uses `setInterval` for beat timing
- Calculates interval: `60000 / bpm` milliseconds
- Handles beat counter wrap-around based on time signature
- Cleans up interval on stop/unmount

**Audio Handling** (Future):
- Expo AV for audio playback
- Separate sounds for accent and regular beats
- Prepared structure for audio integration

### 3. BPMControl Component
**Responsibility**: BPM adjustment interface

**Features**:
- Increment/decrement buttons
- Direct numeric input (editable)
- Input validation (40-240 range)
- Visual feedback on interaction

**Props**:
```typescript
{
  bpm: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChangeBpm: (bpm: number) => void;
}
```

### 4. MetronomeDisplay Component
**Responsibility**: Visual beat indication

**Features**:
- Dynamic beat indicators based on time signature
- Animated beat highlighting (scale animation)
- Accent indicator for first beat (thicker border)
- Current time signature display

**Animation**:
- React Native Animated API
- Scale effect on beat change (1.0 → 1.2 → 1.0)
- Smooth 150ms total animation duration

**Props**:
```typescript
{
  currentBeat: number;
  timeSignature: TimeSignature;
  isPlaying: boolean;
}
```

### 5. PlayButton Component
**Responsibility**: Play/pause control

**Features**:
- Large circular button (200x200)
- Color change on state (blue → red)
- Text change (START → STOP)
- Shadow and elevation for depth

**Props**:
```typescript
{
  isPlaying: boolean;
  onPress: () => void;
}
```

### 6. TimeSignatureSelector Component
**Responsibility**: Time signature selection

**Features**:
- Multiple options (2/4, 3/4, 4/4, 5/4, 6/8)
- Visual selection state (highlighted)
- Disabled state while playing
- Grid layout with wrap

**Props**:
```typescript
{
  selected: TimeSignature;
  onSelect: (ts: TimeSignature) => void;
  disabled?: boolean;
}
```

---

## 🎨 Theme System

### Structure

```typescript
theme/
├── colors.ts      # Color palette
├── typography.ts  # Font sizes, weights, line heights
├── spacing.ts     # Spacing scale
└── index.ts       # Unified export
```

### Design Tokens

**Colors**:
- Semantic naming (primary, secondary, text, background)
- Nested objects for variations (gray.light, gray.medium)
- Status colors (success, error, warning, info)

**Typography**:
- T-shirt sizing (xs, sm, base, lg, xl, 2xl, etc.)
- Consistent line heights (tight, normal, relaxed)
- Font weights (regular, medium, semibold, bold)

**Spacing**:
- 4px base unit
- Consistent scale (xs=4, sm=8, md=16, lg=24, xl=32, etc.)

### Benefits

- ✅ Consistent design across components
- ✅ Easy to update (change once, apply everywhere)
- ✅ Type-safe with TypeScript
- ✅ Reusable across all 100 apps

---

## 🔧 State Management

### Why Custom Hook?

We chose **custom React hooks** over Redux/MobX because:

1. **Simple State**: App has minimal global state
2. **Performance**: No unnecessary re-renders
3. **Bundle Size**: No additional libraries
4. **Type Safety**: Full TypeScript support
5. **Testability**: Easy to test in isolation

### State Flow

```
User Action → Hook Function → State Update → Component Re-render
     ↓              ↓              ↓               ↓
  Button Press  increaseBpm()  bpm = 121    BPMControl updates
```

### Side Effects

**Timer Management**:
```typescript
useEffect(() => {
  return () => {
    stop(); // Cleanup on unmount
  };
}, []);
```

**Audio Setup** (Future):
```typescript
useEffect(() => {
  initializeAudio();
  return () => {
    cleanupAudio();
  };
}, []);
```

---

## 🎵 Timing & Accuracy

### Metronome Engine

**Challenge**: JavaScript timers (setInterval) are not perfectly accurate

**Current Implementation**:
```typescript
const interval = 60000 / bpm; // ms per beat
setInterval(() => {
  playClick();
  updateBeat();
}, interval);
```

**Limitations**:
- ~10-20ms drift possible over time
- Suitable for practice, not professional recording
- Browser/device performance affects accuracy

**Future Improvements**:
```typescript
// Web Audio API scheduling (more accurate)
const audioContext = new AudioContext();
const nextBeatTime = audioContext.currentTime + interval;
// Schedule beats ahead of time
```

### Beat Counting

**Logic**:
```typescript
beat = (beat + 1) % beatsPerMeasure;

// Example for 4/4:
// beat: 0 → 1 → 2 → 3 → 0 (wraps)

// Display (1-indexed):
// display: 1 → 2 → 3 → 4 → 1
```

**Accent Beat**:
- First beat (beat === 0) is always accented
- Visual: thicker border
- Audio: higher pitch click (when implemented)

---

## 📱 Performance Optimizations

### Rendering Optimizations

1. **Memoization** (Future):
```typescript
const MemoizedBPMControl = React.memo(BPMControl);
```

2. **Avoid Inline Functions**:
```typescript
// Bad: Creates new function each render
<Button onPress={() => setBpm(120)} />

// Good: Reuses function reference
<Button onPress={increaseBpm} />
```

3. **useCallback for Event Handlers**:
```typescript
const handleIncrease = useCallback(() => {
  setBpm(bpm + 1);
}, [bpm]);
```

### Animation Performance

- **Native Driver**: All animations use `useNativeDriver: true`
- **Transform Only**: Animate transforms (scale, translate) not layout properties
- **Short Durations**: Keep animations under 200ms

### Bundle Size

**Current Dependencies**:
- expo (~40 MB)
- react-native (~15 MB)
- expo-av (~2 MB)
- Total: ~60 MB (expected)

**Optimization**:
- No unnecessary libraries
- Tree-shaking enabled
- Production builds minified

---

## 🧪 Testing Strategy

### Test Coverage

**What We Test**:
- ✅ Hook state initialization
- ✅ BPM increment/decrement
- ✅ Min/max BPM clamping
- ✅ Play/pause state transitions
- ✅ Time signature changes
- ✅ Beat counting logic

**What We Don't Test** (Yet):
- ❌ Component rendering (integration tests)
- ❌ User interactions (E2E tests)
- ❌ Audio playback
- ❌ Animation timing

### Testing Tools

- **Jest**: Test runner
- **React Testing Library**: Component testing (future)
- **@testing-library/react-hooks**: Hook testing

### Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

---

## 💰 AdMob Integration

### Architecture

```
App.tsx
  │
  ├─► AdBanner (from shared/admob)
  │     └─► Shows 320x50 banner at bottom
  │
  └─► InterstitialAdManager (from shared/admob)
        └─► Shows full-screen ads on events
```

### Implementation

**Banner Ad**:
```typescript
// In App.tsx
import { AdBanner } from '../../shared/admob/AdBanner';

<AdBanner /> // At bottom of screen
```

**Interstitial Ad**:
```typescript
// Initialize on app start
useEffect(() => {
  InterstitialAdManager.init();
  InterstitialAdManager.showAdWithDelay(3000);
}, []);

// Show on actions
const handleAction = () => {
  doSomething();
  InterstitialAdManager.showAdWithFrequency();
};
```

### Ad Events

1. **App Start**: Interstitial after 3 seconds
2. **User Actions**: Interstitial every 5 actions
3. **Always**: Banner visible at bottom

### Privacy Compliance

- **GDPR**: Non-personalized ads by default
- **COPPA**: No personalized ads for children
- **Privacy Policy**: Required for app stores

---

## 🔒 Security Considerations

### Data Storage

- **No Backend**: All data client-side only
- **No User Data**: App doesn't collect personal info
- **No Authentication**: No login required
- **Offline Only**: No network requests except ads

### Ad Safety

- **Test IDs in Dev**: Prevents policy violations
- **Production IDs**: Must be added before publishing
- **Permissions**: Only INTERNET permission needed

---

## 🚀 Build & Deployment

### Development Workflow

```bash
# Install
npm install

# Run dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test
```

### Production Build

```bash
# Configure EAS
eas build:configure

# Build APK/IPA
eas build --platform android
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Environment Variables

**Test vs Production**:
```typescript
const adId = __DEV__ ? TEST_AD_ID : PRODUCTION_AD_ID;
```

---

## 📊 Performance Metrics

### Target Metrics

- **Time to Interactive**: < 2 seconds
- **FPS**: 60 fps during animations
- **Memory Usage**: < 100 MB
- **Battery Drain**: Minimal (no background audio)

### Monitoring

**Tools**:
- React Native Performance Monitor
- Expo DevTools
- Chrome DevTools (for debugging)

---

## 🐛 Common Issues & Solutions

### Issue: Timer Drift

**Problem**: Metronome gets out of sync over time

**Solution**:
- Use Web Audio API for production
- Implement drift compensation algorithm
- Schedule beats ahead of time

### Issue: App Crashes on Play

**Problem**: Audio initialization fails

**Solution**:
```typescript
try {
  await Audio.setAudioModeAsync({...});
} catch (error) {
  console.error('Audio init failed:', error);
  // Fallback to visual-only mode
}
```

### Issue: Ads Not Showing

**Problem**: Test ads not appearing

**Solution**:
1. Check internet connection
2. Verify AdMob IDs in app.json
3. Check console for errors
4. Use Google's test IDs first

---

## 🔄 Future Architecture Improvements

### Version 2.0 Plans

1. **State Management**:
   - Consider Zustand for more complex state
   - Add persistence (AsyncStorage)

2. **Audio**:
   - Implement Web Audio API
   - Add sound customization
   - Support background playback

3. **Features**:
   - Tap tempo detection
   - Tempo presets
   - Practice session recording

4. **Testing**:
   - Add E2E tests (Detox)
   - Visual regression testing
   - Performance benchmarks

5. **Monitoring**:
   - Add analytics (Firebase)
   - Crash reporting (Sentry)
   - Performance tracking

---

## 📚 Code Conventions

### Naming

- **Components**: PascalCase (e.g., `BPMControl.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useMetronome.ts`)
- **Types**: PascalCase (e.g., `TimeSignature`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MIN_BPM`)

### File Structure

```
ComponentName.tsx
  ├─► Imports
  ├─► Types/Interfaces
  ├─► Component Function
  ├─► Styles (StyleSheet)
  └─► Export
```

### Comments

- **Functions**: JSDoc comments
- **Complex Logic**: Inline comments
- **TODOs**: `// TODO: description`
- **Sections**: `/** Section Header */`

---

## 🎓 Learning Resources

**React Native**:
- [Official Docs](https://reactnative.dev/)
- [React Hooks Guide](https://react.dev/reference/react)

**Expo**:
- [Expo Docs](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

**TypeScript**:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

**Testing**:
- [Jest Docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Maintainer**: 100 Apps Factory Team
