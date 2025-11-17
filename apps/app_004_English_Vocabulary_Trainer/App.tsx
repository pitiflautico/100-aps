import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, ScrollView, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { VOCABULARY, Category, Difficulty, Word, getWordsByFilters } from './data/vocabulary';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

type LearningMode = 'flashcard' | 'quiz' | 'typing';
type Screen = 'home' | 'learning';

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

const STORAGE_KEY = '@vocab_progress';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [mode, setMode] = useState<LearningMode>('flashcard');
  const [categoryFilter, setCategoryFilter] = useState<Category | undefined>();
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [progress, setProgress] = useState<Progress>({
    learnedWords: [],
    quizStats: { totalQuestions: 0, correctAnswers: 0 },
    typingStats: { totalAttempts: 0, correctAttempts: 0 },
  });
  const [showStats, setShowStats] = useState(false);

  // Quiz mode state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState('');

  // Typing mode state
  const [typedWord, setTypedWord] = useState('');
  const [typingFeedback, setTypingFeedback] = useState('');

  // Session tracking
  const [sessionQuestions, setSessionQuestions] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (newProgress: Progress) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const getFilteredWords = (): Word[] => {
    return getWordsByFilters(categoryFilter, difficultyFilter);
  };

  const currentWord = getFilteredWords()[currentIndex] || VOCABULARY[0];

  const startLearning = (selectedMode: LearningMode) => {
    setMode(selectedMode);
    setScreen('learning');
    setCurrentIndex(0);
    setSessionQuestions(0);
    if (selectedMode === 'quiz') {
      generateQuizOptions();
    }
  };

  const generateQuizOptions = () => {
    const correctDef = currentWord.definition;
    const wrongDefs = VOCABULARY
      .filter(w => w.id !== currentWord.id)
      .map(w => w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [correctDef, ...wrongDefs].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
  };

  const markAsLearned = () => {
    if (!progress.learnedWords.includes(currentWord.id)) {
      const newProgress = {
        ...progress,
        learnedWords: [...progress.learnedWords, currentWord.id],
      };
      saveProgress(newProgress);
    }
    nextWord();
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    const correct = quizOptions[index] === currentWord.definition;

    const newProgress = {
      ...progress,
      quizStats: {
        totalQuestions: progress.quizStats.totalQuestions + 1,
        correctAnswers: progress.quizStats.correctAnswers + (correct ? 1 : 0),
      },
    };

    if (correct) {
      newProgress.learnedWords = [...new Set([...progress.learnedWords, currentWord.id])];
      setQuizFeedback('✓ Correct!');
    } else {
      setQuizFeedback('✗ Incorrect');
    }

    saveProgress(newProgress);
    setSessionQuestions(sessionQuestions + 1);

    setTimeout(() => {
      nextWord();
      setQuizFeedback('');
      setSelectedAnswer(null);
    }, 1500);
  };

  const handleTypingSubmit = () => {
    const correct = typedWord.toLowerCase().trim() === currentWord.word.toLowerCase();

    const newProgress = {
      ...progress,
      typingStats: {
        totalAttempts: progress.typingStats.totalAttempts + 1,
        correctAttempts: progress.typingStats.correctAttempts + (correct ? 1 : 0),
      },
    };

    if (correct) {
      newProgress.learnedWords = [...new Set([...progress.learnedWords, currentWord.id])];
      setTypingFeedback(`✓ Correct! "${currentWord.word}"`);
    } else {
      setTypingFeedback(`✗ Incorrect. The answer is "${currentWord.word}"`);
    }

    saveProgress(newProgress);

    setTimeout(() => {
      nextWord();
      setTypingFeedback('');
      setTypedWord('');
    }, 2000);
  };

  const nextWord = () => {
    setShowDefinition(false);
    const words = getFilteredWords();
    setCurrentIndex((currentIndex + 1) % words.length);

    if (mode === 'quiz') {
      const nextIndex = (currentIndex + 1) % words.length;
      const nextWord = words[nextIndex];
      const correctDef = nextWord.definition;
      const wrongDefs = VOCABULARY
        .filter(w => w.id !== nextWord.id)
        .map(w => w.definition)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [correctDef, ...wrongDefs].sort(() => Math.random() - 0.5);
      setQuizOptions(options);
    }
  };

  // Show interstitial ad every 10 questions in quiz mode
  useEffect(() => {
    if (mode === 'quiz' && sessionQuestions > 0 && sessionQuestions % 10 === 0) {
      const timer = setTimeout(() => {
        AdsManager.showInterstitialAd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionQuestions]);

  const renderHome = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>English Vocabulary Trainer</Text>
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.statsButtonText}>📊 Stats</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.homeContent}>
        <Text style={styles.sectionTitle}>Filters</Text>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Category:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, !categoryFilter && styles.filterButtonActive]}
              onPress={() => setCategoryFilter(undefined)}
            >
              <Text style={[styles.filterButtonText, !categoryFilter && styles.filterButtonTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, categoryFilter === 'general' && styles.filterButtonActive]}
              onPress={() => setCategoryFilter('general')}
            >
              <Text style={[styles.filterButtonText, categoryFilter === 'general' && styles.filterButtonTextActive]}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, categoryFilter === 'academic' && styles.filterButtonActive]}
              onPress={() => setCategoryFilter('academic')}
            >
              <Text style={[styles.filterButtonText, categoryFilter === 'academic' && styles.filterButtonTextActive]}>Academic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, categoryFilter === 'business' && styles.filterButtonActive]}
              onPress={() => setCategoryFilter('business')}
            >
              <Text style={[styles.filterButtonText, categoryFilter === 'business' && styles.filterButtonTextActive]}>Business</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Difficulty:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, !difficultyFilter && styles.filterButtonActive]}
              onPress={() => setDifficultyFilter(undefined)}
            >
              <Text style={[styles.filterButtonText, !difficultyFilter && styles.filterButtonTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, difficultyFilter === 'beginner' && styles.filterButtonActive]}
              onPress={() => setDifficultyFilter('beginner')}
            >
              <Text style={[styles.filterButtonText, difficultyFilter === 'beginner' && styles.filterButtonTextActive]}>Beginner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, difficultyFilter === 'intermediate' && styles.filterButtonActive]}
              onPress={() => setDifficultyFilter('intermediate')}
            >
              <Text style={[styles.filterButtonText, difficultyFilter === 'intermediate' && styles.filterButtonTextActive]}>Intermediate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, difficultyFilter === 'advanced' && styles.filterButtonActive]}
              onPress={() => setDifficultyFilter('advanced')}
            >
              <Text style={[styles.filterButtonText, difficultyFilter === 'advanced' && styles.filterButtonTextActive]}>Advanced</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Learning Modes</Text>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => startLearning('flashcard')}
        >
          <Text style={styles.modeTitle}>📚 Flashcard Mode</Text>
          <Text style={styles.modeDescription}>Learn words with definitions and examples</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => startLearning('quiz')}
        >
          <Text style={styles.modeTitle}>❓ Quiz Mode</Text>
          <Text style={styles.modeDescription}>Test your knowledge with multiple choice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => startLearning('typing')}
        >
          <Text style={styles.modeTitle}>⌨️ Typing Practice</Text>
          <Text style={styles.modeDescription}>Type the word from definition and example</Text>
        </TouchableOpacity>

        <View style={styles.quickStats}>
          <Text style={styles.quickStatsText}>
            Words Learned: {progress.learnedWords.length}/{VOCABULARY.length}
          </Text>
          <Text style={styles.quickStatsText}>
            Quiz Accuracy: {progress.quizStats.totalQuestions > 0 ? Math.round((progress.quizStats.correctAnswers / progress.quizStats.totalQuestions) * 100) : 0}%
          </Text>
        </View>
      </ScrollView>

      <AdBanner />
      {renderStatsModal()}
    </SafeAreaView>
  );

  const renderFlashcardMode = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Flashcards</Text>
        <Text style={styles.progress}>
          {currentIndex + 1}/{getFilteredWords().length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowDefinition(!showDefinition)}
          activeOpacity={0.9}
        >
          <View style={styles.cardBadges}>
            <Text style={styles.categoryBadge}>{currentWord.category}</Text>
            <Text style={styles.difficultyBadge}>{currentWord.difficulty}</Text>
          </View>

          <Text style={styles.wordTitle}>{currentWord.word}</Text>

          {showDefinition ? (
            <>
              <Text style={styles.definition}>{currentWord.definition}</Text>
              <Text style={styles.example}>Example: {currentWord.example}</Text>
            </>
          ) : (
            <Text style={styles.hint}>Tap to see definition</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={nextWord}>
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.learnButton} onPress={markAsLearned}>
          <Text style={styles.buttonText}>I Know This</Text>
        </TouchableOpacity>
      </View>

      <AdBanner />
    </SafeAreaView>
  );

  const renderQuizMode = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Quiz</Text>
        <Text style={styles.progress}>
          {currentIndex + 1}/{getFilteredWords().length}
        </Text>
      </View>

      <View style={styles.quizContainer}>
        <View style={styles.cardBadges}>
          <Text style={styles.categoryBadge}>{currentWord.category}</Text>
          <Text style={styles.difficultyBadge}>{currentWord.difficulty}</Text>
        </View>

        <Text style={styles.quizQuestion}>What is the definition of:</Text>
        <Text style={styles.wordTitle}>{currentWord.word}</Text>
        <Text style={styles.example}>Example: {currentWord.example}</Text>

        {quizFeedback ? (
          <Text style={[styles.feedback, quizFeedback.includes('✓') && styles.feedbackCorrect]}>
            {quizFeedback}
          </Text>
        ) : null}

        <View style={styles.quizOptions}>
          {quizOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quizOption,
                selectedAnswer === index && (
                  option === currentWord.definition
                    ? styles.quizOptionCorrect
                    : styles.quizOptionIncorrect
                ),
              ]}
              onPress={() => handleQuizAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              <Text style={styles.quizOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <AdBanner />
    </SafeAreaView>
  );

  const renderTypingMode = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Typing Practice</Text>
        <Text style={styles.progress}>
          {currentIndex + 1}/{getFilteredWords().length}
        </Text>
      </View>

      <View style={styles.typingContainer}>
        <View style={styles.cardBadges}>
          <Text style={styles.categoryBadge}>{currentWord.category}</Text>
          <Text style={styles.difficultyBadge}>{currentWord.difficulty}</Text>
        </View>

        <Text style={styles.quizQuestion}>Type the word:</Text>
        <Text style={styles.definition}>{currentWord.definition}</Text>
        <Text style={styles.example}>Example: {currentWord.example}</Text>

        {typingFeedback ? (
          <Text style={[styles.feedback, typingFeedback.includes('✓') && styles.feedbackCorrect]}>
            {typingFeedback}
          </Text>
        ) : (
          <>
            <TextInput
              style={styles.typingInput}
              value={typedWord}
              onChangeText={setTypedWord}
              placeholder="Type the word here..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleTypingSubmit}
              disabled={!typedWord.trim()}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <AdBanner />
    </SafeAreaView>
  );

  const renderStatsModal = () => (
    <Modal
      visible={showStats}
      animationType="slide"
      transparent
      onRequestClose={() => setShowStats(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Statistics</Text>

          <ScrollView style={styles.statsScroll}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Words Learned</Text>
              <Text style={styles.statValue}>{progress.learnedWords.length}/{VOCABULARY.length}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Quiz Performance</Text>
              <Text style={styles.statText}>
                Total Questions: {progress.quizStats.totalQuestions}
              </Text>
              <Text style={styles.statText}>
                Correct: {progress.quizStats.correctAnswers}
              </Text>
              <Text style={styles.statText}>
                Accuracy: {progress.quizStats.totalQuestions > 0 ? Math.round((progress.quizStats.correctAnswers / progress.quizStats.totalQuestions) * 100) : 0}%
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Typing Practice</Text>
              <Text style={styles.statText}>
                Total Attempts: {progress.typingStats.totalAttempts}
              </Text>
              <Text style={styles.statText}>
                Correct: {progress.typingStats.correctAttempts}
              </Text>
              <Text style={styles.statText}>
                Accuracy: {progress.typingStats.totalAttempts > 0 ? Math.round((progress.typingStats.correctAttempts / progress.typingStats.totalAttempts) * 100) : 0}%
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Progress by Category</Text>
            {(['general', 'academic', 'business'] as Category[]).map(cat => {
              const catWords = VOCABULARY.filter(w => w.category === cat);
              const learned = progress.learnedWords.filter(id =>
                catWords.some(w => w.id === id)
              ).length;
              return (
                <View key={cat} style={styles.progressCard}>
                  <Text style={styles.progressLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                  <Text style={styles.progressText}>{learned}/{catWords.length} words</Text>
                </View>
              );
            })}

            <Text style={styles.sectionTitle}>Progress by Difficulty</Text>
            {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(diff => {
              const diffWords = VOCABULARY.filter(w => w.difficulty === diff);
              const learned = progress.learnedWords.filter(id =>
                diffWords.some(w => w.id === id)
              ).length;
              return (
                <View key={diff} style={styles.progressCard}>
                  <Text style={styles.progressLabel}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</Text>
                  <Text style={styles.progressText}>{learned}/{diffWords.length} words</Text>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowStats(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (screen === 'home') return renderHome();
  if (mode === 'flashcard') return renderFlashcardMode();
  if (mode === 'quiz') return renderQuizMode();
  if (mode === 'typing') return renderTypingMode();

  return renderHome();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  backButton: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  statsButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  statsButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  progress: { fontSize: 16, color: colors.text },
  scrollContent: { flex: 1 },
  homeContent: { padding: spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  filterSection: { marginBottom: spacing.lg },
  filterLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  filterButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    borderWidth: 1,
    borderColor: colors.gray.medium,
  },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterButtonText: { fontSize: 14, color: colors.text },
  filterButtonTextActive: { color: colors.white, fontWeight: '600' },
  modeCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  modeDescription: { fontSize: 14, color: colors.gray.dark },
  quickStats: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  quickStatsText: { fontSize: 16, color: colors.text, marginBottom: spacing.xs },
  cardContainer: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardBadges: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  categoryBadge: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },
  difficultyBadge: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },
  wordTitle: { fontSize: 36, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  definition: { fontSize: 18, color: colors.text, marginBottom: spacing.md },
  example: { fontSize: 16, color: colors.gray.dark, fontStyle: 'italic' },
  hint: { fontSize: 14, color: colors.gray.medium, textAlign: 'center', marginTop: spacing.lg },
  buttonContainer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  skipButton: {
    flex: 1,
    backgroundColor: colors.gray.medium,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  learnButton: {
    flex: 1,
    backgroundColor: colors.status.success,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  quizContainer: { flex: 1, padding: spacing.lg },
  quizQuestion: { fontSize: 18, color: colors.gray.dark, marginBottom: spacing.sm },
  quizOptions: { marginTop: spacing.lg, gap: spacing.md },
  quizOption: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  quizOptionCorrect: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  quizOptionIncorrect: { backgroundColor: colors.status.error, borderColor: colors.status.error },
  quizOptionText: { fontSize: 16, color: colors.text },
  typingContainer: { flex: 1, padding: spacing.lg },
  typingInput: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    marginTop: spacing.lg,
  },
  feedback: { fontSize: 20, textAlign: 'center', marginVertical: spacing.lg, color: colors.status.error },
  feedbackCorrect: { color: colors.status.success },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  statsScroll: { maxHeight: 400 },
  statCard: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  statLabel: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs, fontWeight: '600' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statText: { fontSize: 14, color: colors.text, marginTop: spacing.xs },
  progressCard: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  progressText: { fontSize: 14, color: colors.primary },
  closeButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  closeButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
