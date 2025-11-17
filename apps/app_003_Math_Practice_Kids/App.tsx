import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

type Operation = '+' | '-' | '×' | '÷';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Stats {
  totalProblems: number;
  correctAnswers: number;
  byDifficulty: {
    [key in Difficulty]: { total: number; correct: number };
  };
}

const STORAGE_KEY = '@math_practice_stats';

const DIFFICULTY_CONFIG = {
  easy: {
    label: 'Easy',
    color: colors.status.success,
    ranges: {
      '+': { min: 1, max: 20 },
      '-': { min: 1, max: 20 },
      '×': { min: 1, max: 5 },
      '÷': { min: 1, max: 5 },
    },
  },
  medium: {
    label: 'Medium',
    color: colors.status.warning,
    ranges: {
      '+': { min: 1, max: 50 },
      '-': { min: 1, max: 50 },
      '×': { min: 1, max: 12 },
      '÷': { min: 1, max: 12 },
    },
  },
  hard: {
    label: 'Hard',
    color: colors.status.error,
    ranges: {
      '+': { min: 1, max: 100 },
      '-': { min: 1, max: 100 },
      '×': { min: 1, max: 20 },
      '÷': { min: 1, max: 20 },
    },
  },
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operation, setOperation] = useState<Operation>('+');
  const [answer, setAnswer] = useState<number | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalProblems: 0,
    correctAnswers: 0,
    byDifficulty: {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 },
    },
  });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStats(JSON.parse(stored));
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

  const generateProblem = () => {
    if (!difficulty) return;

    const ops: Operation[] = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const config = DIFFICULTY_CONFIG[difficulty].ranges[op];
    let n1, n2;

    switch (op) {
      case '+':
        n1 = Math.floor(Math.random() * config.max) + config.min;
        n2 = Math.floor(Math.random() * config.max) + config.min;
        break;
      case '-':
        n1 = Math.floor(Math.random() * config.max) + config.min + 10;
        n2 = Math.floor(Math.random() * Math.min(n1, config.max));
        break;
      case '×':
        n1 = Math.floor(Math.random() * config.max) + config.min;
        n2 = Math.floor(Math.random() * config.max) + config.min;
        break;
      case '÷':
        n2 = Math.floor(Math.random() * config.max) + config.min;
        n1 = n2 * (Math.floor(Math.random() * config.max) + config.min);
        break;
    }

    setNum1(n1);
    setNum2(n2);
    setOperation(op);
    setAnswer(null);
    setFeedback('');
  };

  useEffect(() => {
    if (difficulty) {
      generateProblem();
    }
  }, [difficulty]);

  // Show interstitial ad every 10 problems
  useEffect(() => {
    if (sessionTotal > 0 && sessionTotal % 10 === 0) {
      const timer = setTimeout(() => {
        AdsManager.showInterstitialAd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionTotal]);

  const getCorrectAnswer = () => {
    switch (operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '×': return num1 * num2;
      case '÷': return num1 / num2;
    }
  };

  const handleAnswer = (userAnswer: number) => {
    if (!difficulty) return;

    setAnswer(userAnswer);
    setSessionTotal(sessionTotal + 1);
    const correct = userAnswer === getCorrectAnswer();

    if (correct) {
      setSessionScore(sessionScore + 1);
      setFeedback('✓ Correct!');
    } else {
      setFeedback(`✗ Incorrect. Answer: ${getCorrectAnswer()}`);
    }

    // Update stats
    const newStats: Stats = {
      totalProblems: stats.totalProblems + 1,
      correctAnswers: stats.correctAnswers + (correct ? 1 : 0),
      byDifficulty: {
        ...stats.byDifficulty,
        [difficulty]: {
          total: stats.byDifficulty[difficulty].total + 1,
          correct: stats.byDifficulty[difficulty].correct + (correct ? 1 : 0),
        },
      },
    };
    saveStats(newStats);

    setTimeout(() => generateProblem(), 1500);
  };

  const generateAnswerOptions = () => {
    const correct = getCorrectAnswer();
    const options = [correct];

    while (options.length < 4) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrong = correct + offset;
      if (wrong > 0 && !options.includes(wrong)) {
        options.push(wrong);
      }
    }

    return options.sort(() => Math.random() - 0.5);
  };

  const resetSession = () => {
    setDifficulty(null);
    setSessionScore(0);
    setSessionTotal(0);
    setFeedback('');
  };

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>Math Practice for Kids</Text>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowStats(true)}
          >
            <Text style={styles.statsButtonText}>📊 Stats</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.difficultyContainer}>
          <Text style={styles.subtitle}>Choose Difficulty Level</Text>

          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.difficultyButton, { borderColor: DIFFICULTY_CONFIG[level].color }]}
              onPress={() => setDifficulty(level)}
            >
              <Text style={[styles.difficultyLabel, { color: DIFFICULTY_CONFIG[level].color }]}>
                {DIFFICULTY_CONFIG[level].label}
              </Text>
              <Text style={styles.difficultyDesc}>
                {level === 'easy' && 'Numbers 1-20, Basic operations'}
                {level === 'medium' && 'Numbers 1-50, Times tables up to 12'}
                {level === 'hard' && 'Numbers 1-100, Advanced operations'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AdBanner />

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
                  <Text style={styles.statLabel}>Total Problems Solved</Text>
                  <Text style={styles.statValue}>{stats.totalProblems}</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total Correct Answers</Text>
                  <Text style={styles.statValue}>{stats.correctAnswers}</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Overall Accuracy</Text>
                  <Text style={styles.statValue}>
                    {stats.totalProblems > 0
                      ? Math.round((stats.correctAnswers / stats.totalProblems) * 100)
                      : 0}%
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>By Difficulty</Text>

                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((level) => {
                  const diffStats = stats.byDifficulty[level];
                  const accuracy = diffStats.total > 0
                    ? Math.round((diffStats.correct / diffStats.total) * 100)
                    : 0;

                  return (
                    <View key={level} style={styles.difficultyStatCard}>
                      <Text style={[styles.difficultyStatLabel, { color: DIFFICULTY_CONFIG[level].color }]}>
                        {DIFFICULTY_CONFIG[level].label}
                      </Text>
                      <Text style={styles.difficultyStatText}>
                        Problems: {diffStats.total} | Correct: {diffStats.correct}
                      </Text>
                      <Text style={styles.difficultyStatText}>
                        Accuracy: {accuracy}%
                      </Text>
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
      </SafeAreaView>
    );
  }

  // Game screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={resetSession}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.difficultyBadge, { color: DIFFICULTY_CONFIG[difficulty].color }]}>
            {DIFFICULTY_CONFIG[difficulty].label}
          </Text>
          <Text style={styles.score}>Score: {sessionScore}/{sessionTotal}</Text>
        </View>
      </View>

      <View style={styles.problemContainer}>
        <Text style={styles.problem}>
          {num1} {operation} {num2} = ?
        </Text>
      </View>

      {feedback ? (
        <Text style={[styles.feedback, feedback.includes('✓') && styles.correct]}>
          {feedback}
        </Text>
      ) : null}

      <View style={styles.optionsContainer}>
        {generateAnswerOptions().map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              answer === option && (option === getCorrectAnswer() ? styles.correctButton : styles.incorrectButton)
            ]}
            onPress={() => handleAnswer(option)}
            disabled={answer !== null}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCenter: { flexDirection: 'column', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.xl, textAlign: 'center' },
  backButton: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  statsButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  statsButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  difficultyBadge: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs },
  score: { fontSize: 16, color: colors.text },
  difficultyContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  difficultyButton: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.lg,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyLabel: { fontSize: 24, fontWeight: 'bold', marginBottom: spacing.xs },
  difficultyDesc: { fontSize: 14, color: colors.gray.dark },
  problemContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  problem: { fontSize: 48, fontWeight: 'bold', color: colors.text },
  feedback: { fontSize: 24, textAlign: 'center', marginBottom: spacing.lg, color: colors.status.error },
  correct: { color: colors.status.success },
  optionsContainer: { padding: spacing.lg, gap: spacing.md },
  optionButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  correctButton: { backgroundColor: colors.status.success },
  incorrectButton: { backgroundColor: colors.status.error },
  optionText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
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
  statLabel: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  difficultyStatCard: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  difficultyStatLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.xs },
  difficultyStatText: { fontSize: 14, color: colors.text },
  closeButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  closeButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
