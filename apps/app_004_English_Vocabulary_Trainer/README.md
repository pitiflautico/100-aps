# English Vocabulary Trainer

A comprehensive English vocabulary learning app with 100 carefully selected words across multiple categories and difficulty levels, featuring three distinct learning modes.

## Features

### Vocabulary Database
- **100 Words** across three categories:
  - **General** (50 words): Everyday vocabulary
  - **Academic** (30 words): Scholarly and formal language
  - **Business** (20 words): Professional terminology

- **Three Difficulty Levels**:
  - **Beginner** (30 words): Basic vocabulary
  - **Intermediate** (40 words): Moderate complexity
  - **Advanced** (30 words): Sophisticated language

- Each word includes:
  - Clear definition
  - Example sentence
  - Category tag
  - Difficulty level

### Learning Modes

#### 1. Flashcard Mode 📚
- Tap cards to reveal definitions
- View example sentences
- Mark words as learned
- Track progress through word list
- Perfect for initial learning

#### 2. Quiz Mode ❓
- Multiple choice questions (4 options)
- Instant feedback on answers
- Track accuracy statistics
- Automatically marks correct answers as learned
- Interstitial ads every 10 questions
- Great for testing knowledge

#### 3. Typing Practice ⌨️
- Type the word from definition and example
- Case-insensitive checking
- Detailed accuracy tracking
- Reinforces spelling and recall
- Ideal for active learning

### Filtering System
- **Category Filters**: Focus on specific word categories
- **Difficulty Filters**: Practice at appropriate level
- **Combined Filtering**: Mix and match for targeted practice
- Dynamic word list updates based on selected filters

### Progress Tracking
- **Persistent Storage** using AsyncStorage
- Track learned words across all modes
- Quiz performance statistics (questions answered, accuracy)
- Typing practice statistics (attempts, accuracy)
- Progress breakdown by category
- Progress breakdown by difficulty level
- Never lose your progress

### Statistics Dashboard
- Total words learned out of 100
- Quiz mode accuracy percentage
- Typing mode accuracy percentage
- Category-wise progress (General, Academic, Business)
- Difficulty-wise progress (Beginner, Intermediate, Advanced)
- Visual progress indicators

### Monetization
- **AdMob Integration**:
  - Banner ads on all screens
  - Interstitial ads every 10 quiz questions
  - Using react-native-google-mobile-ads v14.3.0

## Technical Implementation

### Dependencies
- React Native 0.81.5
- React 19.1.0
- Expo ~54.0.23
- @react-native-async-storage/async-storage ^2.2.0
- react-native-google-mobile-ads ^14.3.0

### Architecture
- **Multi-screen navigation**: Home, Flashcards, Quiz, Typing
- **State Management**: React hooks (useState, useEffect)
- **Data Persistence**: AsyncStorage for progress tracking
- **Type Safety**: Full TypeScript implementation
- **Component Structure**:
  - Main App component with screen routing
  - Reusable filter components
  - Mode-specific rendering functions
  - Statistics modal overlay

### Data Structure
```typescript
interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
  category: Category;
  difficulty: Difficulty;
}

interface Progress {
  learnedWords: string[];
  quizStats: {
    totalQuestions: number;
    correctAnswers: number;
  };
  typingStats: {
    totalAttempts: number;
    correctAttempts: number;
  };
}
```

### Storage
- Storage Key: `@vocab_progress`
- Persists:
  - Array of learned word IDs
  - Quiz statistics
  - Typing practice statistics

## Color Scheme
- **Primary**: #4A6CF7 (Blue) - Main brand color
- **Secondary**: #F7C948 (Yellow) - Accent color
- **Success**: #4CAF50 (Green) - Correct answers
- **Error**: #F44336 (Red) - Incorrect answers

## User Flow

### Home Screen
1. Select category filter (All/General/Academic/Business)
2. Select difficulty filter (All/Beginner/Intermediate/Advanced)
3. View quick stats (words learned, quiz accuracy)
4. Choose learning mode
5. Access detailed statistics

### Flashcard Mode
1. View word with category and difficulty badges
2. Tap to reveal definition and example
3. Choose to skip or mark as learned
4. Proceed to next word
5. Return to home anytime

### Quiz Mode
1. View word and example sentence
2. Select definition from 4 options
3. Get instant feedback (correct/incorrect)
4. Auto-advance to next question
5. See interstitial ad every 10 questions

### Typing Practice
1. View definition and example
2. Type the corresponding word
3. Get instant feedback with correct answer
4. Auto-advance to next word
5. Build spelling and recall skills

## Installation
```bash
cd apps/app_004_English_Vocabulary_Trainer
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
- **Vocabulary Expansion**: Learn 100 carefully selected words
- **Context Learning**: Each word includes example sentences
- **Multi-modal Learning**: Three different practice modes
- **Adaptive Difficulty**: Filter by skill level
- **Progress Tracking**: Monitor improvement over time
- **Offline Learning**: Study anywhere without internet

## Target Audience
- English language learners (ESL/EFL)
- Students preparing for standardized tests (SAT, GRE, TOEFL)
- Professionals improving business vocabulary
- Anyone wanting to expand their English vocabulary
- Ages 13+

## Word Categories Breakdown

### General (50 words)
Common vocabulary for everyday use, from basic adjectives like "Brave" and "Calm" to more sophisticated terms like "Serendipity" and "Ubiquitous."

### Academic (30 words)
Scholarly and formal language including "Hypothesis," "Methodology," "Paradigm," "Epistemology," and research-related terminology.

### Business (20 words)
Professional and corporate vocabulary such as "Revenue," "Stakeholder," "Leverage," "Synergy," "Diversification," and financial terms.

## Future Enhancements
- Daily word challenges
- Spaced repetition algorithm
- Word pronunciation audio
- Custom word lists
- Import/export progress
- Achievements and badges
- Streak tracking
- Dark mode
- More word categories (Medical, Legal, Technical)
- Expand to 500+ words

**Version**: 1.0.0
