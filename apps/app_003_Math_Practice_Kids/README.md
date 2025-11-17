# Math Practice for Kids

An educational math practice app designed for children with three difficulty levels, persistent statistics tracking, and adaptive learning features.

## Features

### Core Features
- **3 Difficulty Levels**
  - **Easy**: Numbers 1-20, basic operations (addition, subtraction up to 20, multiplication/division up to 5)
  - **Medium**: Numbers 1-50, times tables up to 12
  - **Hard**: Numbers 1-100, advanced operations (multiplication/division up to 20)

- **All Operations**: Addition (+), Subtraction (-), Multiplication (×), Division (÷)

- **Multiple Choice Questions**: 4 answer options per problem with instant feedback

- **Session Tracking**:
  - Current session score tracking
  - Problems solved counter
  - Real-time accuracy feedback

### Statistics & Progress
- **Persistent Statistics** using AsyncStorage:
  - Total problems solved (all-time)
  - Total correct answers
  - Overall accuracy percentage
  - Per-difficulty breakdowns (problems, correct answers, accuracy)

- **Statistics Modal**: View detailed performance metrics at any time

### User Experience
- **Visual Feedback**:
  - Color-coded difficulty levels (Green = Easy, Orange = Medium, Red = Hard)
  - Instant visual feedback on correct/incorrect answers
  - Clean, kid-friendly interface

- **Navigation**:
  - Easy difficulty selection screen
  - Back button to return to difficulty selection
  - Stats button accessible from home screen

### Monetization
- **AdMob Integration**:
  - Banner ads displayed on all screens
  - Interstitial ads shown every 10 problems (non-intrusive)
  - Using react-native-google-mobile-ads v14.3.0

## Technical Implementation

### Dependencies
- React Native 0.81.5
- React 19.1.0
- Expo ~54.0.23
- @react-native-async-storage/async-storage ^2.2.0
- react-native-google-mobile-ads ^14.3.0

### Architecture
- **State Management**: React hooks (useState, useEffect)
- **Data Persistence**: AsyncStorage for statistics
- **Type Safety**: TypeScript with strict typing
- **Component Structure**:
  - Main App component with conditional rendering
  - Difficulty selection screen
  - Game screen
  - Statistics modal

### Key Components
1. **AdBanner**: Reusable banner ad component
2. **AdsManager**: Centralized ad management service
3. **Stats Modal**: Full-screen statistics viewer with ScrollView

### Data Storage
- Storage Key: `@math_practice_stats`
- Persists:
  - Total problems count
  - Total correct answers
  - Per-difficulty statistics

## Color Scheme
- **Primary**: #4A6CF7 (Blue)
- **Secondary**: #F7C948 (Yellow)
- **Success**: #4CAF50 (Green) - Easy difficulty
- **Warning**: #FF9800 (Orange) - Medium difficulty
- **Error**: #F44336 (Red) - Hard difficulty

## User Flow
1. **Launch**: App loads saved statistics from AsyncStorage
2. **Home Screen**: Choose difficulty level or view statistics
3. **Game Screen**:
   - Answer math problems with 4 multiple-choice options
   - Get instant feedback (correct/incorrect)
   - Track session progress
   - See interstitial ad every 10 problems
4. **Return**: Go back to difficulty selection at any time
5. **Stats**: View comprehensive statistics from home screen

## Installation
```bash
cd apps/app_003_Math_Practice_Kids
npm install
npm start
```

## Running on Devices
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## AdMob Setup
Currently using TestIds for development. To enable real ads:
1. Create AdMob account
2. Create app in AdMob console
3. Get banner and interstitial ad unit IDs
4. Update `services/adsManager.ts` with real IDs
5. Add `app.json` configuration for AdMob

## Educational Value
- Reinforces basic arithmetic skills
- Adaptive difficulty for different skill levels
- Immediate feedback for learning
- Progress tracking to motivate improvement
- Safe, offline practice environment

## Target Audience
- Children ages 6-12
- Elementary school students
- Homeschooling families
- Parents looking for educational screen time

## Future Enhancements
- Timed challenges
- Achievement badges
- Customizable operation selection
- Parent dashboard
- Export statistics
- Sound effects toggle
- Dark mode

**Version**: 1.0.0
