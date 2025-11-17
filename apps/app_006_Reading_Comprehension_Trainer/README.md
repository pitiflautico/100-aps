# Reading Comprehension Trainer

> Improve your reading comprehension skills with diverse passages and interactive quizzes

---

## 📱 App Overview

**Reading Comprehension Trainer** is a fully offline educational app designed to help students and learners of all ages improve their reading comprehension skills. With 8 carefully crafted passages across multiple subjects and difficulty levels, users can practice critical reading and test their understanding through multiple-choice questions with detailed explanations.

**Category**: Education & Study Tools
**Platform**: iOS, Android
**Type**: Offline, No Backend Required
**Monetization**: AdMob (Banner + Interstitial)

---

## ✨ Key Features

- 📚 **8 Diverse Passages**: Science, History, Literature, Nature, and Technology topics
- 🎯 **3 Difficulty Levels**: Beginner, Intermediate, and Advanced
- ❓ **27 Total Questions**: 3-4 questions per passage with explanations
- 📊 **Progress Tracking**: Track passages completed and accuracy rate
- 🔍 **Smart Filters**: Filter by category and difficulty
- 📈 **Performance Statistics**: View questions answered, correct answers, and accuracy
- ✅ **Answer Explanations**: Learn from detailed explanations for each question
- 💾 **Offline Progress**: All progress saved locally with AsyncStorage
- 📱 **Fully Offline**: Works without internet connection
- 💯 **Visual Feedback**: Color-coded correct/incorrect answers

---

## 🎬 Screen Flow

### Home Screen
- List of passages with category/difficulty filters
- Progress bars showing completion status
- Statistics button for performance overview
- Banner ad at bottom

### Passage Reading Screen
- Full passage text with clean typography
- Category and difficulty badges
- "Start Questions" button

### Question Screen
- Question counter and progress
- Multiple choice options (A, B, C, D)
- Visual feedback (green/red)
- Detailed explanations
- Next question navigation

### Statistics Modal
- Passages completed
- Questions answered
- Correct answers
- Overall accuracy %

---

## 📚 Content Library

**8 Passages across 5 categories:**
- Science: Solar System (Beginner), Photosynthesis (Intermediate), Climate Change (Advanced)
- History: Roman Empire (Intermediate)
- Nature: Water Cycle (Beginner), Amazon Rainforest (Intermediate)
- Technology: Artificial Intelligence (Advanced)
- Literature: Shakespeare and Globe Theatre (Intermediate)

**Total**: 8 passages, 27 questions

---

## 💾 Data Persistence

**AsyncStorage Key**: `@reading_comprehension_progress`

Saves:
- Total passages completed
- Total questions answered
- Correct answers count
- Per-passage progress and completion status
- Last read date for each passage

---

## 💰 AdMob Integration

- **Banner Ads**: Bottom of all screens
- **Interstitial Ads**: Every 5 questions answered
- **Library**: react-native-google-mobile-ads v14.3.0

---

## 🛠️ Technical Stack

- React Native 0.81.5
- React 19.1.0
- TypeScript ~5.9.2
- Expo ~54.0.23
- AsyncStorage ^2.2.0
- AdMob v14.3.0

**Total Lines**: ~1,400 (App: 794, Data: 580+)

---

## 🚀 Installation

```bash
cd apps/app_006_Reading_Comprehension_Trainer
npm install
npm start
```

---

**Version**: 1.0.0
**Status**: ✅ Fully Functional
**Last Updated**: 2025-11-17
