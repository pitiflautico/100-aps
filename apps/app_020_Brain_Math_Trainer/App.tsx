import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Brain_Math_Trainer_data';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Problem {
  question: string;
  answer: number;
  options: number[];
}

interface Stats {
  solved: number;
  correct: number;
  totalTime: number;
}

const generateProblem = (difficulty: Difficulty): Problem => {
  const range = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
  const ops = difficulty === 'easy' ? ['+', '-'] : difficulty === 'medium' ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = Math.floor(Math.random() * range) + 1;
  let b = Math.floor(Math.random() * range) + 1;
  let question = '';
  let answer = 0;

  if (op === '+') {
    answer = a + b;
    question = `${a} + ${b}`;
  } else if (op === '-') {
    [a, b] = [Math.max(a, b), Math.min(a, b)];
    answer = a - b;
    question = `${a} - ${b}`;
  } else if (op === '×') {
    answer = a * b;
    question = `${a} × ${b}`;
  } else {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 12) + 1;
    answer = a;
    a = a * b;
    question = `${a} ÷ ${b}`;
  }

  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrong = answer + offset;
    if (wrong > 0 && wrong !== answer && !options.includes(wrong)) {
      options.push(wrong);
    }
  }

  return {
    question,
    answer,
    options: options.sort(() => Math.random() - 0.5),
  };
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<Stats>({ solved: 0, correct: 0, totalTime: 0 });
  const [playing, setPlaying] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [problemCount, setProblemCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadStats();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (playing && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (playing && timeLeft === 0) {
      endGame();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, playing]);

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveStats = async (newStats: Stats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const startGame = () => {
    setPlaying(true);
    setProblemCount(0);
    setCorrectCount(0);
    setTimeLeft(30);
    setStartTime(Date.now());
    nextProblem();
  };

  const nextProblem = () => {
    setProblem(generateProblem(difficulty));
  };

  const answerProblem = (selected: number) => {
    const isCorrect = selected === problem?.answer;
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }
    setProblemCount(problemCount + 1);
    nextProblem();
  };

  const endGame = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = problemCount > 0 ? Math.round((correctCount / problemCount) * 100) : 0;

    const newStats: Stats = {
      solved: stats.solved + problemCount,
      correct: stats.correct + correctCount,
      totalTime: stats.totalTime + timeSpent,
    };
    saveStats(newStats);

    Alert.alert(
      'Game Over!',
      `Problems: ${problemCount}\nCorrect: ${correctCount}\nAccuracy: ${accuracy}%\nTime: ${timeSpent}s`,
      [{ text: 'OK', onPress: () => { setPlaying(false); showInterstitialAd(); } }]
    );
  };

  const accuracy = stats.solved > 0 ? Math.round((stats.correct / stats.solved) * 100) : 0;
  const avgTime = stats.solved > 0 ? Math.round(stats.totalTime / stats.solved) : 0;

  if (playing && problem) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.gameHeader}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Problems</Text>
            <Text style={styles.statValue}>{problemCount}</Text>
          </View>
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Correct</Text>
            <Text style={styles.statValue}>{correctCount}</Text>
          </View>
        </View>

        <View style={styles.problemArea}>
          <Text style={styles.problemText}>{problem.question}</Text>
        </View>

        <View style={styles.optionsGrid}>
          {problem.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.optionButton}
              onPress={() => answerProblem(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.quitBtn} onPress={endGame}>
          <Text style={styles.quitBtnText}>End Game</Text>
        </TouchableOpacity>

        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Math Trainer</Text>
        <TouchableOpacity onPress={() => setShowStats(true)}>
          <Text style={styles.statsBtn}>📊</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{stats.solved}</Text>
              <Text style={styles.quickStatLabel}>Solved</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{accuracy}%</Text>
              <Text style={styles.quickStatLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Difficulty</Text>
        <View style={styles.diffRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
              onPress={() => setDifficulty(d)}
            >
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
              <Text style={[styles.diffDesc, difficulty === d && styles.diffDescActive]}>
                {d === 'easy' ? '1-20, +/-' : d === 'medium' ? '1-50, +/-/×' : '1-100, all ops'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={startGame}>
          <Text style={styles.startBtnText}>Start Training</Text>
        </TouchableOpacity>

        <Text style={styles.rules}>
          • 30 seconds time limit{'\n'}
          • Answer as many problems as you can{'\n'}
          • Multiple choice format
        </Text>
      </View>

      <AdBanner />

      {/* Stats Modal */}
      <Modal visible={showStats} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{stats.solved}</Text>
                <Text style={styles.statCardLabel}>Total Problems</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{stats.correct}</Text>
                <Text style={styles.statCardLabel}>Correct</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{accuracy}%</Text>
                <Text style={styles.statCardLabel}>Accuracy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{avgTime}s</Text>
                <Text style={styles.statCardLabel}>Avg Time</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowStats(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statsBtn: { fontSize: 28 },
  menu: { flex: 1, padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.xl },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md, textAlign: 'center' },
  quickStats: { flexDirection: 'row', justifyContent: 'space-around' },
  quickStat: { alignItems: 'center' },
  quickStatValue: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  quickStatLabel: { fontSize: 12, color: colors.gray.dark },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  diffBtn: { flex: 1, backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, alignItems: 'center' },
  diffBtnActive: { backgroundColor: colors.primary },
  diffText: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  diffTextActive: { color: colors.white },
  diffDesc: { fontSize: 10, color: colors.gray.dark },
  diffDescActive: { color: colors.white },
  startBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.xl },
  startBtnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  rules: { fontSize: 12, color: colors.gray.dark, textAlign: 'center', lineHeight: 20 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.lg },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: colors.gray.dark },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  timerCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.status.error, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  problemArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  problemText: { fontSize: 48, fontWeight: 'bold', color: colors.text },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.lg, gap: spacing.md },
  optionButton: { width: '47%', height: 80, backgroundColor: colors.white, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  optionText: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  quitBtn: { backgroundColor: colors.gray.light, marginHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginBottom: spacing.md },
  quitBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modalContent: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { width: '47%', backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.lg, alignItems: 'center' },
  statCardValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statCardLabel: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs, textAlign: 'center' },
  closeBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
