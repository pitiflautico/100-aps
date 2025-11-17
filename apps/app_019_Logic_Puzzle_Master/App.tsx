import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Logic_Puzzle_Master_data';

interface Puzzle {
  id: number;
  title: string;
  clues: string[];
  solution: { [key: string]: string };
  difficulty: string;
}

const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'The Five Houses',
    difficulty: 'Medium',
    clues: [
      'There are 5 houses in 5 different colors.',
      'The Englishman lives in the red house.',
      'The Spaniard owns a dog.',
      'The green house is immediately to the right of the white house.',
      'The green house owner drinks coffee.',
    ],
    solution: { house1: 'Yellow-Norwegian-Water-Cat', house2: 'Blue-Ukrainian-Tea-Horse', house3: 'Red-Englishman-Milk-Snake', house4: 'White-Japanese-Coffee-Zebra', house5: 'Green-Spaniard-Orange-Dog' },
  },
  {
    id: 2,
    title: 'Three Friends',
    difficulty: 'Easy',
    clues: [
      'Three friends: Alice, Bob, and Carol.',
      'One is a teacher, one is a doctor, one is an engineer.',
      'Alice is not the doctor.',
      'Bob is not the teacher.',
      'The engineer is not Alice.',
    ],
    solution: { Alice: 'Teacher', Bob: 'Engineer', Carol: 'Doctor' },
  },
  {
    id: 3,
    title: 'Four Students',
    difficulty: 'Medium',
    clues: [
      'Four students: Amy, Ben, Chris, Diana.',
      'They study Math, Science, History, and Art.',
      'Amy doesn\'t study Math or Science.',
      'Ben studies History.',
      'Chris studies either Math or Science.',
      'Diana doesn\'t study Art.',
    ],
    solution: { Amy: 'Art', Ben: 'History', Chris: 'Math', Diana: 'Science' },
  },
  {
    id: 4,
    title: 'The Meeting',
    difficulty: 'Hard',
    clues: [
      'Five people attend a meeting at different times.',
      'The lawyer arrives before the doctor but after the teacher.',
      'The engineer arrives before the teacher.',
      'The artist arrives last.',
      'The doctor arrives before the artist.',
    ],
    solution: { first: 'Engineer', second: 'Teacher', third: 'Lawyer', fourth: 'Doctor', fifth: 'Artist' },
  },
  {
    id: 5,
    title: 'Pet Owners',
    difficulty: 'Easy',
    clues: [
      'Three people: John, Mary, and Steve.',
      'They own a cat, a dog, and a bird.',
      'John doesn\'t own the dog.',
      'Mary is allergic to birds.',
      'Steve doesn\'t own the cat.',
    ],
    solution: { John: 'Cat', Mary: 'Dog', Steve: 'Bird' },
  },
];

export default function App() {
  const [currentPuzzle, setCurrentPuzzle] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [timeStart, setTimeStart] = useState<number>(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setCompleted(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveCompleted = async (puzzleId: number) => {
    try {
      const newCompleted = [...completed, puzzleId];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted));
      setCompleted(newCompleted);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const startPuzzle = (id: number) => {
    setCurrentPuzzle(id);
    setAnswer('');
    setHintsUsed(0);
    setTimeStart(Date.now());
  };

  const showHint = () => {
    const puzzle = PUZZLES.find(p => p.id === currentPuzzle);
    if (!puzzle) return;
    if (hintsUsed < puzzle.clues.length) {
      setHintsUsed(hintsUsed + 1);
    } else {
      Alert.alert('No More Hints', 'All clues are already visible');
    }
  };

  const checkSolution = () => {
    const puzzle = PUZZLES.find(p => p.id === currentPuzzle);
    if (!puzzle) return;

    const elapsed = Math.floor((Date.now() - timeStart) / 1000);
    const timeStr = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`;

    Alert.alert(
      'Solution Submitted!',
      `Time: ${timeStr}\nHints used: ${hintsUsed}\n\nIn a real implementation, this would verify your solution.`,
      [
        { text: 'Mark Complete', onPress: () => {
          saveCompleted(puzzle.id);
          showInterstitialAd();
          setCurrentPuzzle(null);
        }},
        { text: 'Try Again' },
      ]
    );
  };

  const puzzle = PUZZLES.find(p => p.id === currentPuzzle);

  if (puzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentPuzzle(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{puzzle.title}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.puzzleContent}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{puzzle.difficulty}</Text>
          </View>

          <Text style={styles.sectionTitle}>Clues</Text>
          {puzzle.clues.slice(0, hintsUsed || puzzle.clues.length).map((clue, idx) => (
            <View key={idx} style={styles.clueCard}>
              <Text style={styles.clueNumber}>{idx + 1}</Text>
              <Text style={styles.clueText}>{clue}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.hintBtn} onPress={showHint}>
            <Text style={styles.hintBtnText}>💡 Show Hint ({hintsUsed}/{puzzle.clues.length})</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Your Solution</Text>
          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.gray.medium}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={checkSolution}>
            <Text style={styles.submitBtnText}>Check Solution</Text>
          </TouchableOpacity>
        </ScrollView>
        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Logic Puzzles</Text>
        <Text style={styles.completedCount}>
          {completed.length}/{PUZZLES.length} ✓
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.subtitle}>Einstein-Style Riddles</Text>
        {PUZZLES.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.puzzleCard, completed.includes(p.id) && styles.puzzleCardCompleted]}
            onPress={() => startPuzzle(p.id)}
          >
            <View style={styles.puzzleCardHeader}>
              <Text style={styles.puzzleTitle}>{p.title}</Text>
              {completed.includes(p.id) && <Text style={styles.completeBadge}>✓</Text>}
            </View>
            <Text style={styles.puzzleDifficulty}>{p.difficulty}</Text>
            <Text style={styles.puzzleClueCount}>{p.clues.length} clues</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  backBtn: { fontSize: 16, color: colors.primary },
  completedCount: { fontSize: 16, color: colors.status.success, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.lg, textAlign: 'center' },
  listContent: { padding: spacing.lg },
  puzzleCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 2, borderColor: 'transparent' },
  puzzleCardCompleted: { borderColor: colors.status.success },
  puzzleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  puzzleTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  completeBadge: { fontSize: 24, color: colors.status.success },
  puzzleDifficulty: { fontSize: 14, color: colors.status.warning, fontWeight: '600', marginBottom: spacing.xs },
  puzzleClueCount: { fontSize: 12, color: colors.gray.dark },
  puzzleContent: { padding: spacing.lg, paddingBottom: 100 },
  difficultyBadge: { alignSelf: 'center', backgroundColor: colors.status.warning, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12, marginBottom: spacing.lg },
  difficultyText: { color: colors.white, fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  clueCard: { backgroundColor: colors.gray.light, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row' },
  clueNumber: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginRight: spacing.md },
  clueText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  hintBtn: { backgroundColor: colors.accent, paddingVertical: spacing.md, borderRadius: 12, alignItems: 'center', marginTop: spacing.md },
  hintBtnText: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  answerInput: { backgroundColor: colors.gray.light, borderRadius: 12, padding: spacing.md, fontSize: 14, minHeight: 120 },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: 12, alignItems: 'center', marginTop: spacing.xl },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
