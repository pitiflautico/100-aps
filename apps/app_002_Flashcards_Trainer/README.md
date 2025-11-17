# Flashcards Trainer

> Interactive flashcard study application with spaced repetition for effective learning

---

## 📱 App Overview

**Flashcards Trainer** is a fully offline flashcard study app designed for students and learners who want to master new information through active recall. Features multiple pre-loaded decks covering Spanish, world capitals, and science facts, with a beautiful card-flipping animation and progress tracking.

**Category**: Study & Productivity
**Platform**: iOS, Android
**Type**: Offline, No Backend Required
**Monetization**: AdMob (Banner + Interstitial)

---

## ✨ Key Features

- 🎴 **Interactive Flashcards**: Smooth card-flipping animations with tap-to-reveal
- 📚 **Multiple Study Decks**: Pre-loaded with Spanish basics, world capitals, and science facts
- 🎯 **Self-Assessment**: Mark cards as correct/incorrect to track progress
- 📊 **Score Tracking**: Real-time score percentage calculation
- 🎨 **Color-Coded Decks**: Visual deck identification with unique colors
- 🔄 **Session Management**: Complete study sessions with detailed results
- 📱 **Fully Offline**: All content works without internet connection
- 💯 **Progress Display**: Shows current card position in deck (e.g., "Card 5 of 10")

---

## 🎬 Screen Flow

### 1. Deck Selection Screen
- **Header**: "Flashcards Trainer" title and "Select a deck to study" subtitle
- **Deck Cards**: List of available study decks with:
  - Deck name (e.g., "Spanish Basics")
  - Description (e.g., "Common Spanish words and phrases")
  - Card count (e.g., "10 cards")
  - Color-coded left border for visual identification
- **AdMob Banner**: Bottom banner ad

### 2. Study Screen
- **Header**: Shows deck name and progress (e.g., "Card 3 of 10")
- **Flashcard Display**:
  - **Front Side**: Shows question with "Tap to flip" hint
  - **Back Side**: Shows answer with "Tap to flip" hint (colored background)
  - Smooth 3D flip animation
- **Assessment Buttons** (visible after flipping):
  - ✗ Incorrect (red button)
  - ✓ Correct (green button)

### 3. Results Screen
- **Title**: "Session Complete!"
- **Score Breakdown**:
  - Correct count
  - Incorrect count
  - Percentage score
- **Back to Decks Button**: Return to deck selection
- **AdMob Banner**: Bottom banner ad
- **Interstitial Ad**: Shows 2 seconds after completing a deck

---

## 📚 Pre-loaded Content

### Spanish Basics Deck (10 cards)
- Hello → Hola
- Goodbye → Adiós
- Please → Por favor
- Thank you → Gracias
- Yes → Sí
- No → No
- Water → Agua
- Food → Comida
- Friend → Amigo
- House → Casa

### World Capitals Deck (10 cards)
- France → Paris
- Spain → Madrid
- Italy → Rome
- Germany → Berlin
- Japan → Tokyo
- China → Beijing
- Brazil → Brasília
- Canada → Ottawa
- Australia → Canberra
- Egypt → Cairo

### Science Facts Deck (8 cards)
- What is H2O? → Water
- Speed of light in vacuum? → 299,792,458 m/s
- Closest planet to the Sun? → Mercury
- Largest planet in our solar system? → Jupiter
- Chemical symbol for gold? → Au
- Powerhouse of the cell? → Mitochondria
- How many bones in human body? → 206
- Force that pulls objects to Earth? → Gravity

---

## 🎨 Branding

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#4A6CF7` | Main buttons, branding |
| Secondary | `#F7C948` | Card backs, highlights |
| Accent | `#36CFC9` | Special elements |
| Background | `#FFFFFF` | Main background |
| Text | `#1A1A1A` | Primary text |
| Gray Light | `#F5F5F5` | Card backgrounds |
| Gray Medium | `#CCCCCC` | Borders |
| Gray Dark | `#666666` | Secondary text |
| Success | `#4CAF50` | Correct button |
| Error | `#F44336` | Incorrect button |

### Typography

- **Headings**: Bold, 20-28px
- **Body Text**: Regular, 14-16px
- **Card Text**: Bold, 28px
- **Small Text**: Regular, 12-14px

---

## 💰 Advertising

### Ad Configuration

**Banner Ad**:
- Type: Anchored Adaptive Banner
- Position: Bottom of deck selection and results screens
- Always visible: Yes

**Interstitial Ad**:
- Type: Full-screen interstitial
- Timing: Shows 2 seconds after completing a deck
- Frequency: Once per study session completion

### Ad Implementation

All advertising code uses **react-native-google-mobile-ads**:
- Library: `react-native-google-mobile-ads` v14.3.0
- Location: `/services/adsManager.ts`
- Banner Component: `/components/AdBanner.tsx`
- Test IDs: Uses Google's TestIds in development

---

## 🏗️ Technical Architecture

### File Structure

```
app_002_Flashcards_Trainer/
├── App.tsx                    # Main app component with navigation logic
├── components/
│   ├── AdBanner.tsx          # AdMob banner component
│   └── FlashcardView.tsx     # Flashcard flip animation component
├── hooks/
│   └── useFlashcards.ts      # Hook for managing deck/card data
├── services/
│   └── adsManager.ts         # AdMob configuration and management
├── theme/
│   ├── colors.ts             # Color constants
│   ├── spacing.ts            # Spacing constants
│   ├── typography.ts         # Typography constants
│   └── index.ts              # Theme exports
├── types.ts                  # TypeScript interfaces
├── package.json
└── README.md
```

### Key Components

**FlashcardView.tsx**:
- Manages card flip animation using Animated API
- Interpolates rotation from 0° to 180°
- Handles tap events for flipping
- Shows correct/incorrect buttons after flip

**useFlashcards.ts**:
- Provides deck list and card data
- Simulates loading state
- Returns `getCardsForDeck(deckId)` function
- All data stored in memory (no database needed)

---

## 📦 Dependencies

```json
{
  "@react-native-async-storage/async-storage": "^2.2.0",
  "expo": "~54.0.23",
  "expo-dev-client": "~4.0.29",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-google-mobile-ads": "^14.3.0"
}
```

---

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Run on Device**:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

---

## 🎯 User Journey

1. **Launch App** → See deck selection screen
2. **Choose Deck** → Tap on any deck card
3. **Study Session Begins** → See first flashcard (question side)
4. **Tap to Flip** → Reveal answer
5. **Self-Assess** → Tap ✓ Correct or ✗ Incorrect
6. **Continue** → Automatically advances to next card
7. **Complete Session** → See score summary
8. **Interstitial Ad** → Shows after 2 seconds
9. **Return to Decks** → Choose another deck or exit

---

## 🔄 Future Enhancements

- [ ] Custom deck creation
- [ ] Import/export decks
- [ ] Spaced repetition algorithm (SRS)
- [ ] Statistics and learning analytics
- [ ] Audio pronunciation for language decks
- [ ] Image support on cards
- [ ] Multiple choice mode
- [ ] Timed challenges

---

## 📝 Notes

- All data is stored in memory (no AsyncStorage needed for basic version)
- Cards are presented in order (not shuffled)
- Score resets when returning to deck selection
- No login/account system required
- Works 100% offline

---

## 📄 License

Private project - All rights reserved
