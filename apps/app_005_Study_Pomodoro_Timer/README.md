# Study Pomodoro Timer

A comprehensive Pomodoro timer app implementing the Pomodoro Technique for enhanced productivity and focus, with customizable sessions, detailed statistics, and persistent session history.

## Features

### Pomodoro Technique Implementation
- **Work Sessions**: Focus time (default 25 minutes, customizable 1-60 min)
- **Short Breaks**: Regular breaks (default 5 minutes, customizable 1-30 min)
- **Long Breaks**: Extended breaks every 4 work sessions (default 15 minutes, customizable 1-60 min)
- **Automatic Progression**: Follows standard Pomodoro cycle

### Core Timer Features
- **Start/Pause/Resume**: Full timer control
- **Reset**: Return to session start time
- **Skip**: Jump to next session
- **Real-time Countdown**: Large, easy-to-read timer display
- **Session Counter**: Track completed Pomodoros in current cycle
- **Visual Feedback**: Different colors for work/short break/long break

### Customization Settings
- **Adjustable Durations**: Customize all three session types
- **Auto-start Options**:
  - Auto-start breaks after work sessions
  - Auto-start work after breaks
- **Sound Notifications**: Toggle audio alerts when sessions complete
- **Persistent Settings**: Preferences saved across app sessions

### Statistics Tracking
- **Total Sessions**: All-time completed Pomodoros
- **Total Study Time**: Cumulative work time
- **Today's Sessions**: Daily productivity tracking
- **Current Streak**: Consecutive sessions
- **Longest Streak**: Personal best
- **Auto-reset**: Daily stats reset automatically

### Session History
- **Last 100 Sessions**: Complete session log
- **Session Details**:
  - Session type (Work/Short Break/Long Break)
  - Duration
  - Completion timestamp
- **Chronological List**: Most recent sessions first

### Data Persistence
- **AsyncStorage Integration**:
  - Settings saved automatically
  - Statistics persist across app restarts
  - Session history maintained
- **Never Lose Progress**: All data safely stored locally

### Monetization
- **AdMob Integration**:
  - Banner ads on main screen
  - Interstitial ads after completing work sessions
  - Using react-native-google-mobile-ads v14.3.0

## Technical Implementation

### Dependencies
- React Native 0.81.5
- React 19.1.0
- Expo ~54.0.23
- @react-native-async-storage/async-storage ^2.2.0
- expo-av ^16.0.7 (for sound notifications)
- react-native-google-mobile-ads ^14.3.0

### Architecture
- **State Management**: React hooks (useState, useEffect, useRef)
- **Timer Logic**: setInterval with proper cleanup
- **Data Persistence**: AsyncStorage for settings, stats, and history
- **Audio**: expo-av for notification sounds
- **Type Safety**: Full TypeScript implementation

### Data Structures
```typescript
interface Settings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

interface SessionRecord {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number;
  completedAt: string;
}

interface Stats {
  totalSessions: number;
  totalWorkTime: number;
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  lastSessionDate: string;
}
```

### Storage
- `@pomodoro_settings`: User preferences
- `@pomodoro_stats`: Performance statistics
- `@pomodoro_history`: Last 100 completed sessions

## Color Coding
- **Work Sessions**: #4A6CF7 (Blue) - Focus mode
- **Short Breaks**: #4CAF50 (Green) - Quick refresh
- **Long Breaks**: #36CFC9 (Cyan) - Extended rest
- **Accent**: #F7C948 (Yellow) - Primary action button

## User Flow

### Starting a Session
1. App loads with work timer (25:00 by default)
2. Tap START to begin work session
3. Timer counts down
4. Sound plays when session ends
5. Automatically switches to short break (or long break after 4th work session)
6. If auto-start enabled, break begins automatically

### Customizing Settings
1. Tap settings icon (⚙️) in header
2. Adjust work duration (1-60 minutes)
3. Adjust short break duration (1-30 minutes)
4. Adjust long break duration (1-60 minutes)
5. Toggle auto-start breaks
6. Toggle auto-start work
7. Toggle sound notifications
8. Close settings (changes save automatically)

### Viewing Statistics
1. Tap stats icon (📊) in header
2. View total sessions completed
3. Check total study time
4. See today's progress
5. Monitor current streak
6. Review longest streak

### Reviewing History
1. Tap HISTORY button
2. Scroll through last 100 sessions
3. View session type, duration, and timestamp
4. Track study patterns over time

## Installation
```bash
cd apps/app_005_Study_Pomodoro_Timer
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

## The Pomodoro Technique

The Pomodoro Technique is a time management method developed by Francesco Cirillo:

1. **Choose a task** to work on
2. **Set timer for 25 minutes** (one "Pomodoro")
3. **Work on task** until timer rings
4. **Take short 5-minute break**
5. **Repeat** steps 2-4
6. **After 4 Pomodoros**, take longer 15-30 minute break

### Benefits
- Improved focus and concentration
- Reduced mental fatigue
- Better time awareness
- Decreased anxiety about tasks
- Enhanced motivation through completion tracking

## Educational Value
- **Time Management**: Learn structured work/break cycles
- **Productivity Skills**: Build focus and concentration
- **Self-Awareness**: Track personal productivity patterns
- **Habit Formation**: Develop consistent study routines
- **Burn-out Prevention**: Mandatory breaks prevent exhaustion

## Target Audience
- Students at all levels
- Remote workers
- Freelancers
- Anyone wanting to improve focus
- People prone to procrastination
- Professionals needing structured work time
- Ages 13+

## Future Enhancements
- Task labels for sessions
- Weekly/monthly statistics graphs
- Multiple timer presets
- Background timer with notifications
- Integration with calendar apps
- Team Pomodoro sessions
- Custom notification sounds
- Dark mode
- Export statistics to CSV
- Achievements and milestones

**Version**: 1.0.0
