import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Brain_Training_Puzzles_data';

type Difficulty = 'easy' | 'medium' | 'hard';
type PuzzleType = 'pattern' | 'memory' | 'math';

interface Stats {
  patternScore: number;
  memoryScore: number;
  mathScore: number;
}

export default function App() {
  const [puzzleType, setPuzzleType] = useState<PuzzleType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<Stats>({ patternScore: 0, memoryScore: 0, mathScore: 0 });

  // Pattern Matching
  const [patternGrid, setPatternGrid] = useState<number[]>([]);
  const [targetPattern, setTargetPattern] = useState<number[]>([]);
  const [selectedCells, setSelectedCells] = useState<number[]>([]);

  // Memory Sequence
  const [memorySequence, setMemorySequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [currentFlash, setCurrentFlash] = useState(-1);

  // Math Quiz
  const [mathProblems, setMathProblems] = useState<Array<{q: string, a: number, options: number[]}>>([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [mathStarted, setMathStarted] = useState(false);

  useEffect(() => {
    initializeAds();
    loadStats();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mathStarted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && mathStarted) {
      endMathQuiz();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, mathStarted]);

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

  const startPatternPuzzle = () => {
    const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const total = size * size;
    const grid = Array.from({ length: total }, (_, i) => i);
    const numTarget = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
    const target: number[] = [];
    while (target.length < numTarget) {
      const idx = Math.floor(Math.random() * total);
      if (!target.includes(idx)) target.push(idx);
    }
    setPatternGrid(grid);
    setTargetPattern(target);
    setSelectedCells([]);
    setPuzzleType('pattern');
  };

  const toggleCell = (idx: number) => {
    setSelectedCells(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const checkPattern = () => {
    const correct = targetPattern.every(i => selectedCells.includes(i)) && selectedCells.every(i => targetPattern.includes(i));
    if (correct) {
      Alert.alert('Correct!', 'Well done!');
      const newStats = { ...stats, patternScore: stats.patternScore + 1 };
      saveStats(newStats);
      showInterstitialAd();
      setPuzzleType(null);
    } else {
      Alert.alert('Try Again', 'Not quite right');
    }
  };

  const startMemoryPuzzle = () => {
    const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    const seq = Array.from({ length }, () => Math.floor(Math.random() * 9));
    setMemorySequence(seq);
    setPlayerSequence([]);
    setPuzzleType('memory');
    showSequence(seq);
  };

  const showSequence = async (seq: number[]) => {
    setShowingSequence(true);
    for (let i = 0; i < seq.length; i++) {
      setCurrentFlash(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
      setCurrentFlash(-1);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    setShowingSequence(false);
  };

  const addToMemory = (num: number) => {
    if (showingSequence) return;
    const newSeq = [...playerSequence, num];
    setPlayerSequence(newSeq);
    if (newSeq.length === memorySequence.length) {
      if (JSON.stringify(newSeq) === JSON.stringify(memorySequence)) {
        Alert.alert('Correct!', 'Perfect memory!');
        const newStats = { ...stats, memoryScore: stats.memoryScore + 1 };
        saveStats(newStats);
        showInterstitialAd();
        setPuzzleType(null);
      } else {
        Alert.alert('Wrong!', 'Try again');
        setPlayerSequence([]);
      }
    }
  };

  const startMathQuiz = () => {
    const numProblems = 10;
    const problems: Array<{q: string, a: number, options: number[]}> = [];
    const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;
    const ops = difficulty === 'easy' ? ['+', '-'] : difficulty === 'medium' ? ['+', '-', '×'] : ['+', '-', '×', '÷'];

    for (let i = 0; i < numProblems; i++) {
      const a = Math.floor(Math.random() * max) + 1;
      const b = Math.floor(Math.random() * max) + 1;
      const op = ops[Math.floor(Math.random() * ops.length)];
      let answer = 0;
      let question = '';

      if (op === '+') { answer = a + b; question = `${a} + ${b}`; }
      else if (op === '-') { answer = Math.abs(a - b); question = `${Math.max(a,b)} - ${Math.min(a,b)}`; }
      else if (op === '×') { answer = a * b; question = `${a} × ${b}`; }
      else { const div = Math.max(a,b); const divisor = Math.min(a,b); answer = Math.floor(div/divisor); question = `${div} ÷ ${divisor}`; }

      const options = [answer];
      while (options.length < 4) {
        const wrong = answer + Math.floor(Math.random() * 20) - 10;
        if (wrong > 0 && !options.includes(wrong)) options.push(wrong);
      }
      problems.push({ q: question, a: answer, options: options.sort(() => Math.random() - 0.5) });
    }

    setMathProblems(problems);
    setCurrentProblem(0);
    setTimeLeft(30);
    setMathStarted(true);
    setPuzzleType('math');
  };

  const answerMath = (answer: number) => {
    if (answer === mathProblems[currentProblem].a) {
      if (currentProblem === mathProblems.length - 1) {
        Alert.alert('Complete!', `Finished all problems! Time: ${30 - timeLeft}s`);
        const newStats = { ...stats, mathScore: stats.mathScore + 1 };
        saveStats(newStats);
        showInterstitialAd();
        setPuzzleType(null);
        setMathStarted(false);
      } else {
        setCurrentProblem(currentProblem + 1);
      }
    } else {
      Alert.alert('Wrong!', 'Try again');
    }
  };

  const endMathQuiz = () => {
    Alert.alert('Time Up!', `Completed ${currentProblem} of ${mathProblems.length} problems`);
    setMathStarted(false);
    setPuzzleType(null);
  };

  if (puzzleType === 'pattern') {
    const size = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPuzzleType(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pattern Match</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.instruction}>Memorize the pattern and recreate it!</Text>
          <View style={[styles.grid, { width: size * 60 }]}>
            {patternGrid.map(idx => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.cell,
                  targetPattern.includes(idx) && styles.targetCell,
                  selectedCells.includes(idx) && styles.selectedCell,
                ]}
                onPress={() => toggleCell(idx)}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.btn} onPress={checkPattern}>
            <Text style={styles.btnText}>Check Answer</Text>
          </TouchableOpacity>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  if (puzzleType === 'memory') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPuzzleType(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Memory Sequence</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.instruction}>
            {showingSequence ? 'Watch the sequence...' : 'Repeat the sequence!'}
          </Text>
          <View style={styles.memoryGrid}>
            {[0,1,2,3,4,5,6,7,8].map(num => (
              <TouchableOpacity
                key={num}
                style={[styles.memoryBtn, currentFlash === num && styles.memoryFlash]}
                onPress={() => addToMemory(num)}
                disabled={showingSequence}
              >
                <Text style={styles.memoryText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.progress}>{playerSequence.join(' ')}</Text>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  if (puzzleType === 'math') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setMathStarted(false); setPuzzleType(null); }}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Math Quiz</Text>
          <Text style={styles.timer}>{timeLeft}s</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.problemNum}>Problem {currentProblem + 1}/10</Text>
          <Text style={styles.problem}>{mathProblems[currentProblem]?.q}</Text>
          <View style={styles.optionsGrid}>
            {mathProblems[currentProblem]?.options.map((opt, idx) => (
              <TouchableOpacity key={idx} style={styles.optionBtn} onPress={() => answerMath(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Brain Training</Text>
      </View>
      <ScrollView contentContainerStyle={styles.menu}>
        <View style={styles.statsCard}>
          <Text style={styles.statTitle}>Your Scores</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statValue}>{stats.patternScore}</Text><Text style={styles.statLabel}>Pattern</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{stats.memoryScore}</Text><Text style={styles.statLabel}>Memory</Text></View>
            <View style={styles.stat}><Text style={styles.statValue}>{stats.mathScore}</Text><Text style={styles.statLabel}>Math</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.diffRow}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <TouchableOpacity key={d} style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]} onPress={() => setDifficulty(d)}>
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose Puzzle</Text>
        <TouchableOpacity style={styles.puzzleCard} onPress={startPatternPuzzle}>
          <Text style={styles.puzzleIcon}>🎯</Text>
          <Text style={styles.puzzleTitle}>Pattern Matching</Text>
          <Text style={styles.puzzleDesc}>Find and match the pattern in the grid</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.puzzleCard} onPress={startMemoryPuzzle}>
          <Text style={styles.puzzleIcon}>🧠</Text>
          <Text style={styles.puzzleTitle}>Memory Sequence</Text>
          <Text style={styles.puzzleDesc}>Remember and repeat the number sequence</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.puzzleCard} onPress={startMathQuiz}>
          <Text style={styles.puzzleIcon}>🔢</Text>
          <Text style={styles.puzzleTitle}>Math Quick</Text>
          <Text style={styles.puzzleDesc}>Solve 10 math problems as fast as you can</Text>
        </TouchableOpacity>
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  backBtn: { fontSize: 16, color: colors.primary },
  timer: { fontSize: 18, fontWeight: 'bold', color: colors.status.error },
  menu: { padding: spacing.lg },
  statsCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg },
  statTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray.dark },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm, marginTop: spacing.md },
  diffRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  diffBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: 8, backgroundColor: colors.gray.light, alignItems: 'center' },
  diffBtnActive: { backgroundColor: colors.primary },
  diffText: { fontSize: 14, fontWeight: '600', color: colors.text },
  diffTextActive: { color: colors.white },
  puzzleCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center' },
  puzzleIcon: { fontSize: 48, marginBottom: spacing.sm },
  puzzleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs },
  puzzleDesc: { fontSize: 14, color: colors.gray.dark, textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', padding: spacing.lg },
  instruction: { fontSize: 16, marginBottom: spacing.xl, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xl },
  cell: { width: 50, height: 50, margin: 5, backgroundColor: colors.gray.light, borderRadius: 8 },
  targetCell: { backgroundColor: colors.primary },
  selectedCell: { backgroundColor: colors.status.warning },
  btn: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 240, marginBottom: spacing.xl },
  memoryBtn: { width: 70, height: 70, backgroundColor: colors.gray.light, margin: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  memoryFlash: { backgroundColor: colors.primary },
  memoryText: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  progress: { fontSize: 18, color: colors.text },
  problemNum: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.sm },
  problem: { fontSize: 36, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xl },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 300 },
  optionBtn: { width: 140, height: 60, margin: 5, backgroundColor: colors.white, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.gray.light },
  optionText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
});
