import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { PASSAGES, Passage, Question } from './data/passages';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@reading_comprehension_progress';

interface PassageProgress {
  passageId: string;
  questionsAnswered: number;
  correctAnswers: number;
  completed: boolean;
  lastRead: string;
}

interface Stats {
  totalPassagesRead: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  passageProgress: { [key: string]: PassageProgress };
}

type Screen = 'home' | 'passage' | 'question';
type FilterCategory = 'all' | 'science' | 'history' | 'literature' | 'nature' | 'technology';
type FilterDifficulty = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentPassage, setCurrentPassage] = useState<Passage | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalPassagesRead: 0,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    passageProgress: {},
  });
  const [showStats, setShowStats] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('all');
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveStats = async (newStats: Stats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const startPassage = (passage: Passage) => {
    setCurrentPassage(passage);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScreen('passage');
  };

  const startQuestions = () => {
    if (!currentPassage) return;
    setScreen('question');
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return; // Don't allow changing answer after showing explanation
    setSelectedAnswer(answerIndex);
  };

  const checkAnswer = () => {
    if (!currentPassage || selectedAnswer === null) return;

    const question = currentPassage.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;

    setShowExplanation(true);

    // Update stats
    const passageId = currentPassage.id;
    const currentProgress = stats.passageProgress[passageId] || {
      passageId,
      questionsAnswered: 0,
      correctAnswers: 0,
      completed: false,
      lastRead: new Date().toISOString(),
    };

    const updatedProgress = {
      ...currentProgress,
      questionsAnswered: currentProgress.questionsAnswered + 1,
      correctAnswers: currentProgress.correctAnswers + (isCorrect ? 1 : 0),
      completed: currentQuestionIndex === currentPassage.questions.length - 1,
      lastRead: new Date().toISOString(),
    };

    const newStats = {
      ...stats,
      totalQuestionsAnswered: stats.totalQuestionsAnswered + 1,
      totalCorrect: stats.totalCorrect + (isCorrect ? 1 : 0),
      totalPassagesRead: updatedProgress.completed && !currentProgress.completed
        ? stats.totalPassagesRead + 1
        : stats.totalPassagesRead,
      passageProgress: {
        ...stats.passageProgress,
        [passageId]: updatedProgress,
      },
    };

    saveStats(newStats);

    // Show interstitial ad every 5 questions
    const newCount = questionsAnsweredCount + 1;
    setQuestionsAnsweredCount(newCount);
    if (newCount % 5 === 0) {
      showInterstitialAd();
    }
  };

  const nextQuestion = () => {
    if (!currentPassage) return;

    if (currentQuestionIndex < currentPassage.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Completed all questions
      Alert.alert(
        'Passage Complete!',
        'You have answered all questions for this passage.',
        [{ text: 'OK', onPress: () => setScreen('home') }]
      );
    }
  };

  const getFilteredPassages = (): Passage[] => {
    return PASSAGES.filter(passage => {
      const categoryMatch = filterCategory === 'all' || passage.category === filterCategory;
      const difficultyMatch = filterDifficulty === 'all' || passage.difficulty === filterDifficulty;
      return categoryMatch && difficultyMatch;
    });
  };

  const getPassageProgress = (passageId: string): PassageProgress | undefined => {
    return stats.passageProgress[passageId];
  };

  const calculateAccuracy = (): number => {
    if (stats.totalQuestionsAnswered === 0) return 0;
    return Math.round((stats.totalCorrect / stats.totalQuestionsAnswered) * 100);
  };

  // Home Screen
  if (screen === 'home') {
    const filteredPassages = getFilteredPassages();

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Reading Comprehension</Text>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => setShowStats(true)}
            >
              <Text style={styles.statsButtonText}>📊 Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['all', 'science', 'history', 'literature', 'nature', 'technology'] as FilterCategory[]).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                  onPress={() => setFilterCategory(cat)}
                >
                  <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Difficulty:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['all', 'beginner', 'intermediate', 'advanced'] as FilterDifficulty[]).map(diff => (
                <TouchableOpacity
                  key={diff}
                  style={[styles.filterChip, filterDifficulty === diff && styles.filterChipActive]}
                  onPress={() => setFilterDifficulty(diff)}
                >
                  <Text style={[styles.filterChipText, filterDifficulty === diff && styles.filterChipTextActive]}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Passages List */}
          <Text style={styles.sectionTitle}>
            Available Passages ({filteredPassages.length})
          </Text>

          {filteredPassages.map(passage => {
            const progress = getPassageProgress(passage.id);
            const progressPercent = progress
              ? Math.round((progress.questionsAnswered / passage.questions.length) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={passage.id}
                style={styles.passageCard}
                onPress={() => startPassage(passage)}
              >
                <View style={styles.passageHeader}>
                  <Text style={styles.passageTitle}>{passage.title}</Text>
                  {progress?.completed && <Text style={styles.completedBadge}>✓ Completed</Text>}
                </View>
                <View style={styles.passageMeta}>
                  <Text style={styles.passageCategory}>
                    📚 {passage.category.charAt(0).toUpperCase() + passage.category.slice(1)}
                  </Text>
                  <Text style={[
                    styles.passageDifficulty,
                    passage.difficulty === 'beginner' && { color: colors.status.success },
                    passage.difficulty === 'intermediate' && { color: colors.status.warning },
                    passage.difficulty === 'advanced' && { color: colors.status.error },
                  ]}>
                    {passage.difficulty.charAt(0).toUpperCase() + passage.difficulty.slice(1)}
                  </Text>
                </View>
                <Text style={styles.passageQuestions}>
                  {passage.questions.length} questions
                </Text>
                {progress && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <AdBanner />

        {/* Stats Modal */}
        <Modal visible={showStats} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Your Statistics</Text>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Passages Completed:</Text>
                <Text style={styles.statValue}>{stats.totalPassagesRead}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Questions Answered:</Text>
                <Text style={styles.statValue}>{stats.totalQuestionsAnswered}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Correct Answers:</Text>
                <Text style={styles.statValue}>{stats.totalCorrect}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Accuracy:</Text>
                <Text style={[styles.statValue, { color: colors.status.success }]}>
                  {calculateAccuracy()}%
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowStats(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Passage Reading Screen
  if (screen === 'passage' && currentPassage) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('home')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.passageScreenTitle}>{currentPassage.title}</Text>

          <View style={styles.passageMeta}>
            <Text style={styles.passageCategory}>
              📚 {currentPassage.category.charAt(0).toUpperCase() + currentPassage.category.slice(1)}
            </Text>
            <Text style={[
              styles.passageDifficulty,
              currentPassage.difficulty === 'beginner' && { color: colors.status.success },
              currentPassage.difficulty === 'intermediate' && { color: colors.status.warning },
              currentPassage.difficulty === 'advanced' && { color: colors.status.error },
            ]}>
              {currentPassage.difficulty.charAt(0).toUpperCase() + currentPassage.difficulty.slice(1)}
            </Text>
          </View>

          <View style={styles.passageBox}>
            <Text style={styles.passageText}>{currentPassage.content}</Text>
          </View>

          <TouchableOpacity
            style={styles.startQuestionsButton}
            onPress={startQuestions}
          >
            <Text style={styles.startQuestionsButtonText}>
              Start Questions ({currentPassage.questions.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <AdBanner />
      </SafeAreaView>
    );
  }

  // Question Screen
  if (screen === 'question' && currentPassage) {
    const question = currentPassage.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('passage')}
          >
            <Text style={styles.backButtonText}>← Back to Passage</Text>
          </TouchableOpacity>

          <Text style={styles.questionProgress}>
            Question {currentQuestionIndex + 1} of {currentPassage.questions.length}
          </Text>

          <View style={styles.questionBox}>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>

          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const showCorrect = showExplanation && index === question.correctAnswer;
            const showIncorrect = showExplanation && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && !showExplanation && styles.optionButtonSelected,
                  showCorrect && styles.optionButtonCorrect,
                  showIncorrect && styles.optionButtonIncorrect,
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={showExplanation}
              >
                <Text style={[
                  styles.optionText,
                  isSelected && !showExplanation && styles.optionTextSelected,
                  (showCorrect || showIncorrect) && styles.optionTextAnswer,
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
                {showCorrect && <Text style={styles.checkMark}>✓</Text>}
                {showIncorrect && <Text style={styles.crossMark}>✗</Text>}
              </TouchableOpacity>
            );
          })}

          {!showExplanation && selectedAnswer !== null && (
            <TouchableOpacity
              style={styles.checkButton}
              onPress={checkAnswer}
            >
              <Text style={styles.checkButtonText}>Check Answer</Text>
            </TouchableOpacity>
          )}

          {showExplanation && (
            <>
              <View style={[
                styles.resultBox,
                isCorrect ? styles.resultBoxCorrect : styles.resultBoxIncorrect
              ]}>
                <Text style={styles.resultText}>
                  {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </Text>
                <Text style={styles.explanationText}>{question.explanation}</Text>
              </View>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextQuestion}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestionIndex < currentPassage.questions.length - 1
                    ? 'Next Question →'
                    : 'Finish Passage'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        <AdBanner />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statsButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  statsButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  passageCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  passageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  completedBadge: {
    fontSize: 12,
    color: colors.status.success,
    fontWeight: '600',
  },
  passageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  passageCategory: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  passageDifficulty: {
    fontSize: 14,
    fontWeight: '600',
  },
  passageQuestions: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray.light,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.status.success,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  passageScreenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  passageBox: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  passageText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text,
  },
  startQuestionsButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  startQuestionsButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionProgress: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  questionBox: {
    backgroundColor: colors.secondary,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 26,
  },
  optionButton: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray.light,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionButtonCorrect: {
    borderColor: colors.status.success,
    backgroundColor: colors.status.success + '15',
  },
  optionButtonIncorrect: {
    borderColor: colors.status.error,
    backgroundColor: colors.status.error + '15',
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  optionTextAnswer: {
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 20,
    color: colors.status.success,
  },
  crossMark: {
    fontSize: 20,
    color: colors.status.error,
  },
  checkButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  resultBoxCorrect: {
    backgroundColor: colors.status.success + '15',
    borderWidth: 2,
    borderColor: colors.status.success,
  },
  resultBoxIncorrect: {
    backgroundColor: colors.status.error + '15',
    borderWidth: 2,
    borderColor: colors.status.error,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  statLabel: {
    fontSize: 16,
    color: colors.text,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
