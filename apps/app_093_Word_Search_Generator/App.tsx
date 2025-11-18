import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

const STORAGE_KEY = '@Word_Search_Offline_data';
const { width } = Dimensions.get('window');
const CELL_SIZE = (width - spacing.lg * 2) / 10;

type Grid = string[][];
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface WordPosition {
  word: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

interface Puzzle {
  id: number;
  title: string;
  difficulty: Difficulty;
  grid: Grid;
  words: string[];
  wordPositions: WordPosition[];
}

interface GameState {
  currentPuzzle: Puzzle | null;
  foundWords: string[];
  selectedCells: { row: number; col: number }[];
  time: number;
  isComplete: boolean;
}

interface Stats {
  puzzlesCompleted: number;
  totalTime: number;
  bestTime: { [key in Difficulty]: number };
}

const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'Animals',
    difficulty: 'Easy',
    grid: [
      ['C', 'A', 'T', 'X', 'F', 'O', 'X', 'D', 'O', 'G'],
      ['B', 'E', 'A', 'R', 'T', 'I', 'G', 'E', 'R', 'L'],
      ['I', 'O', 'N', 'W', 'O', 'L', 'F', 'P', 'I', 'G'],
      ['R', 'A', 'B', 'B', 'I', 'T', 'F', 'R', 'O', 'G'],
      ['D', 'E', 'E', 'R', 'H', 'O', 'R', 'S', 'E', 'C'],
      ['M', 'O', 'U', 'S', 'E', 'L', 'E', 'P', 'H', 'A'],
      ['L', 'E', 'O', 'P', 'A', 'R', 'D', 'G', 'O', 'T'],
      ['Z', 'E', 'B', 'R', 'A', 'F', 'I', 'S', 'H', 'X'],
      ['M', 'O', 'N', 'K', 'E', 'Y', 'S', 'H', 'A', 'R'],
      ['K', 'A', 'N', 'G', 'A', 'R', 'O', 'O', 'K', 'S'],
    ],
    words: ['CAT', 'DOG', 'BEAR', 'TIGER', 'LION', 'WOLF', 'FOX', 'RABBIT', 'DEER', 'HORSE'],
    wordPositions: [
      { word: 'CAT', startRow: 0, startCol: 0, endRow: 0, endCol: 2, direction: 'horizontal' },
      { word: 'DOG', startRow: 0, startCol: 7, endRow: 0, endCol: 9, direction: 'horizontal' },
      { word: 'BEAR', startRow: 1, startCol: 0, endRow: 1, endCol: 3, direction: 'horizontal' },
      { word: 'TIGER', startRow: 1, startCol: 4, endRow: 1, endCol: 8, direction: 'horizontal' },
      { word: 'LION', startRow: 2, startCol: 0, endRow: 2, endCol: 3, direction: 'horizontal' },
      { word: 'WOLF', startRow: 2, startCol: 4, endRow: 2, endCol: 7, direction: 'horizontal' },
      { word: 'FOX', startRow: 0, startCol: 4, endRow: 0, endCol: 6, direction: 'horizontal' },
      { word: 'RABBIT', startRow: 3, startCol: 1, endRow: 3, endCol: 6, direction: 'horizontal' },
      { word: 'DEER', startRow: 4, startCol: 0, endRow: 4, endCol: 3, direction: 'horizontal' },
      { word: 'HORSE', startRow: 4, startCol: 4, endRow: 4, endCol: 8, direction: 'horizontal' },
    ],
  },
  {
    id: 2,
    title: 'Colors',
    difficulty: 'Easy',
    grid: [
      ['R', 'E', 'D', 'B', 'L', 'U', 'E', 'G', 'R', 'E'],
      ['G', 'R', 'E', 'E', 'N', 'Y', 'E', 'L', 'L', 'O'],
      ['W', 'H', 'I', 'T', 'E', 'B', 'L', 'A', 'C', 'K'],
      ['P', 'U', 'R', 'P', 'L', 'E', 'O', 'R', 'A', 'N'],
      ['G', 'E', 'P', 'I', 'N', 'K', 'B', 'R', 'O', 'W'],
      ['S', 'I', 'L', 'V', 'E', 'R', 'G', 'O', 'L', 'D'],
      ['B', 'E', 'I', 'G', 'E', 'C', 'R', 'E', 'A', 'M'],
      ['M', 'A', 'R', 'O', 'O', 'N', 'T', 'E', 'A', 'L'],
      ['C', 'O', 'R', 'A', 'L', 'N', 'A', 'V', 'Y', 'X'],
      ['I', 'N', 'D', 'I', 'G', 'O', 'G', 'R', 'A', 'Y'],
    ],
    words: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'WHITE', 'BLACK', 'PURPLE', 'ORANGE', 'PINK', 'BROWN'],
    wordPositions: [
      { word: 'RED', startRow: 0, startCol: 0, endRow: 0, endCol: 2, direction: 'horizontal' },
      { word: 'BLUE', startRow: 0, startCol: 3, endRow: 0, endCol: 6, direction: 'horizontal' },
      { word: 'GREEN', startRow: 1, startCol: 0, endRow: 1, endCol: 4, direction: 'horizontal' },
      { word: 'YELLOW', startRow: 1, startCol: 5, endRow: 1, endCol: 10, direction: 'horizontal' },
      { word: 'WHITE', startRow: 2, startCol: 0, endRow: 2, endCol: 4, direction: 'horizontal' },
      { word: 'BLACK', startRow: 2, startCol: 5, endRow: 2, endCol: 9, direction: 'horizontal' },
      { word: 'PURPLE', startRow: 3, startCol: 0, endRow: 3, endCol: 5, direction: 'horizontal' },
      { word: 'ORANGE', startRow: 3, startCol: 6, endRow: 3, endCol: 11, direction: 'horizontal' },
      { word: 'PINK', startRow: 4, startCol: 2, endRow: 4, endCol: 5, direction: 'horizontal' },
      { word: 'BROWN', startRow: 4, startCol: 6, endRow: 4, endCol: 10, direction: 'horizontal' },
    ],
  },
  {
    id: 3,
    title: 'Sports',
    difficulty: 'Medium',
    grid: [
      ['S', 'O', 'C', 'C', 'E', 'R', 'T', 'E', 'N', 'N'],
      ['I', 'B', 'A', 'S', 'K', 'E', 'T', 'B', 'A', 'L'],
      ['L', 'F', 'O', 'O', 'T', 'B', 'A', 'L', 'L', 'V'],
      ['O', 'H', 'O', 'C', 'K', 'E', 'Y', 'G', 'O', 'L'],
      ['L', 'F', 'S', 'W', 'I', 'M', 'M', 'I', 'N', 'G'],
      ['E', 'Y', 'B', 'O', 'X', 'I', 'N', 'G', 'R', 'U'],
      ['Y', 'B', 'A', 'D', 'M', 'I', 'N', 'T', 'O', 'N'],
      ['B', 'A', 'S', 'E', 'B', 'A', 'L', 'L', 'C', 'R'],
      ['A', 'R', 'C', 'H', 'E', 'R', 'Y', 'T', 'E', 'N'],
      ['C', 'R', 'I', 'C', 'K', 'E', 'T', 'R', 'U', 'G'],
    ],
    words: ['SOCCER', 'BASKETBALL', 'FOOTBALL', 'HOCKEY', 'SWIMMING', 'BOXING', 'TENNIS', 'GOLF', 'VOLLEYBALL', 'BASEBALL'],
    wordPositions: [
      { word: 'SOCCER', startRow: 0, startCol: 0, endRow: 0, endCol: 5, direction: 'horizontal' },
      { word: 'BASKETBALL', startRow: 1, startCol: 1, endRow: 1, endCol: 10, direction: 'horizontal' },
      { word: 'FOOTBALL', startRow: 2, startCol: 2, endRow: 2, endCol: 9, direction: 'horizontal' },
      { word: 'HOCKEY', startRow: 3, startCol: 1, endRow: 3, endCol: 6, direction: 'horizontal' },
      { word: 'SWIMMING', startRow: 4, startCol: 2, endRow: 4, endCol: 9, direction: 'horizontal' },
      { word: 'BOXING', startRow: 5, startCol: 2, endRow: 5, endCol: 7, direction: 'horizontal' },
      { word: 'TENNIS', startRow: 0, startCol: 6, endRow: 0, endCol: 11, direction: 'horizontal' },
      { word: 'GOLF', startRow: 3, startCol: 7, endRow: 3, endCol: 10, direction: 'horizontal' },
      { word: 'VOLLEYBALL', startRow: 2, startCol: 10, endRow: 6, endCol: 10, direction: 'vertical' },
      { word: 'BASEBALL', startRow: 7, startCol: 0, endRow: 7, endCol: 7, direction: 'horizontal' },
    ],
  },
  {
    id: 4,
    title: 'Fruits',
    difficulty: 'Medium',
    grid: [
      ['A', 'P', 'P', 'L', 'E', 'O', 'R', 'A', 'N', 'G'],
      ['E', 'B', 'A', 'N', 'A', 'N', 'A', 'G', 'R', 'A'],
      ['P', 'E', 'A', 'R', 'M', 'A', 'N', 'G', 'O', 'P'],
      ['E', 'C', 'H', 'E', 'R', 'R', 'Y', 'P', 'E', 'A'],
      ['C', 'H', 'K', 'I', 'W', 'I', 'L', 'E', 'M', 'O'],
      ['H', 'P', 'L', 'U', 'M', 'L', 'I', 'M', 'E', 'N'],
      ['A', 'V', 'O', 'C', 'A', 'D', 'O', 'D', 'A', 'T'],
      ['P', 'A', 'P', 'A', 'Y', 'A', 'F', 'I', 'G', 'E'],
      ['M', 'E', 'L', 'O', 'N', 'P', 'E', 'A', 'C', 'H'],
      ['P', 'O', 'M', 'E', 'G', 'R', 'A', 'N', 'A', 'T'],
    ],
    words: ['APPLE', 'ORANGE', 'BANANA', 'GRAPE', 'MANGO', 'PEACH', 'CHERRY', 'KIWI', 'LEMON', 'LIME'],
    wordPositions: [
      { word: 'APPLE', startRow: 0, startCol: 0, endRow: 0, endCol: 4, direction: 'horizontal' },
      { word: 'ORANGE', startRow: 0, startCol: 5, endRow: 0, endCol: 10, direction: 'horizontal' },
      { word: 'BANANA', startRow: 1, startCol: 2, endRow: 1, endCol: 7, direction: 'horizontal' },
      { word: 'GRAPE', startRow: 1, startCol: 8, endRow: 5, endCol: 8, direction: 'vertical' },
      { word: 'MANGO', startRow: 2, startCol: 4, endRow: 2, endCol: 8, direction: 'horizontal' },
      { word: 'PEACH', startRow: 8, startCol: 5, endRow: 8, endCol: 9, direction: 'horizontal' },
      { word: 'CHERRY', startRow: 3, startCol: 1, endRow: 3, endCol: 6, direction: 'horizontal' },
      { word: 'KIWI', startRow: 4, startCol: 2, endRow: 4, endCol: 5, direction: 'horizontal' },
      { word: 'LEMON', startRow: 4, startCol: 6, endRow: 5, endCol: 6, direction: 'vertical' },
      { word: 'LIME', startRow: 5, startCol: 5, endRow: 5, endCol: 8, direction: 'horizontal' },
    ],
  },
  {
    id: 5,
    title: 'Countries',
    difficulty: 'Hard',
    grid: [
      ['U', 'S', 'A', 'C', 'A', 'N', 'A', 'D', 'A', 'M'],
      ['E', 'F', 'R', 'A', 'N', 'C', 'E', 'G', 'E', 'X'],
      ['N', 'G', 'E', 'R', 'M', 'A', 'N', 'Y', 'R', 'I'],
      ['G', 'I', 'T', 'A', 'L', 'Y', 'J', 'A', 'P', 'A'],
      ['L', 'C', 'H', 'I', 'N', 'A', 'I', 'N', 'D', 'I'],
      ['A', 'R', 'U', 'S', 'S', 'I', 'A', 'A', 'U', 'A'],
      ['N', 'U', 'B', 'R', 'A', 'Z', 'I', 'L', 'S', 'U'],
      ['D', 'K', 'O', 'R', 'E', 'A', 'S', 'P', 'A', 'I'],
      ['E', 'G', 'Y', 'P', 'T', 'T', 'U', 'R', 'K', 'E'],
      ['P', 'O', 'L', 'A', 'N', 'D', 'G', 'R', 'E', 'E'],
    ],
    words: ['USA', 'CANADA', 'FRANCE', 'GERMANY', 'ITALY', 'CHINA', 'JAPAN', 'INDIA', 'RUSSIA', 'BRAZIL'],
    wordPositions: [
      { word: 'USA', startRow: 0, startCol: 0, endRow: 0, endCol: 2, direction: 'horizontal' },
      { word: 'CANADA', startRow: 0, startCol: 3, endRow: 0, endCol: 8, direction: 'horizontal' },
      { word: 'FRANCE', startRow: 1, startCol: 1, endRow: 1, endCol: 6, direction: 'horizontal' },
      { word: 'GERMANY', startRow: 2, startCol: 1, endRow: 2, endCol: 7, direction: 'horizontal' },
      { word: 'ITALY', startRow: 3, startCol: 1, endRow: 3, endCol: 5, direction: 'horizontal' },
      { word: 'CHINA', startRow: 4, startCol: 1, endRow: 4, endCol: 5, direction: 'horizontal' },
      { word: 'JAPAN', startRow: 3, startCol: 6, endRow: 3, endCol: 10, direction: 'horizontal' },
      { word: 'INDIA', startRow: 4, startCol: 6, endRow: 4, endCol: 10, direction: 'horizontal' },
      { word: 'RUSSIA', startRow: 5, startCol: 1, endRow: 5, endCol: 6, direction: 'horizontal' },
      { word: 'BRAZIL', startRow: 6, startCol: 2, endRow: 6, endCol: 7, direction: 'horizontal' },
    ],
  },
  {
    id: 6,
    title: 'Tech',
    difficulty: 'Hard',
    grid: [
      ['C', 'O', 'M', 'P', 'U', 'T', 'E', 'R', 'I', 'N'],
      ['T', 'L', 'A', 'P', 'T', 'O', 'P', 'H', 'N', 'T'],
      ['E', 'M', 'O', 'B', 'I', 'L', 'E', 'O', 'T', 'E'],
      ['R', 'O', 'U', 'T', 'E', 'R', 'N', 'N', 'E', 'R'],
      ['N', 'D', 'E', 'M', 'K', 'E', 'Y', 'B', 'O', 'A'],
      ['E', 'E', 'M', 'O', 'U', 'S', 'E', 'O', 'A', 'R'],
      ['T', 'M', 'O', 'N', 'I', 'T', 'O', 'R', 'R', 'D'],
      ['S', 'O', 'F', 'T', 'W', 'A', 'R', 'E', 'D', 'C'],
      ['H', 'A', 'R', 'D', 'W', 'A', 'R', 'E', 'S', 'A'],
      ['P', 'R', 'I', 'N', 'T', 'E', 'R', 'C', 'L', 'O'],
    ],
    words: ['COMPUTER', 'LAPTOP', 'MOBILE', 'INTERNET', 'ROUTER', 'KEYBOARD', 'MOUSE', 'MONITOR', 'SOFTWARE', 'HARDWARE'],
    wordPositions: [
      { word: 'COMPUTER', startRow: 0, startCol: 0, endRow: 0, endCol: 7, direction: 'horizontal' },
      { word: 'LAPTOP', startRow: 1, startCol: 1, endRow: 1, endCol: 6, direction: 'horizontal' },
      { word: 'MOBILE', startRow: 2, startCol: 1, endRow: 2, endCol: 6, direction: 'horizontal' },
      { word: 'INTERNET', startRow: 0, startCol: 8, endRow: 3, endCol: 8, direction: 'vertical' },
      { word: 'ROUTER', startRow: 3, startCol: 1, endRow: 3, endCol: 6, direction: 'horizontal' },
      { word: 'KEYBOARD', startRow: 4, startCol: 3, endRow: 4, endCol: 10, direction: 'horizontal' },
      { word: 'MOUSE', startRow: 5, startCol: 2, endRow: 5, endCol: 6, direction: 'horizontal' },
      { word: 'MONITOR', startRow: 6, startCol: 1, endRow: 6, endCol: 7, direction: 'horizontal' },
      { word: 'SOFTWARE', startRow: 7, startCol: 0, endRow: 7, endCol: 7, direction: 'horizontal' },
      { word: 'HARDWARE', startRow: 8, startCol: 0, endRow: 8, endCol: 7, direction: 'horizontal' },
    ],
  },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentPuzzle: null,
    foundWords: [],
    selectedCells: [],
    time: 0,
    isComplete: false,
  });

  const [stats, setStats] = useState<Stats>({
    puzzlesCompleted: 0,
    totalTime: 0,
    bestTime: { Easy: 0, Medium: 0, Hard: 0 },
  });

  const [showPuzzleSelect, setShowPuzzleSelect] = useState(true);
  const [timerActive, setTimerActive] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    AdsManager.showInterstitialAd();
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !gameState.isComplete) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameState.isComplete]);

  const loadData = async () => {
    try {
      const savedStats = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
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

  const selectPuzzle = (puzzle: Puzzle) => {
    setGameState({
      currentPuzzle: puzzle,
      foundWords: [],
      selectedCells: [],
      time: 0,
      isComplete: false,
    });
    setShowPuzzleSelect(false);
    setTimerActive(true);

    const newGamesPlayed = gamesPlayed + 1;
    setGamesPlayed(newGamesPlayed);
    if (newGamesPlayed % 3 === 0) {
      AdsManager.showInterstitialAd();
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (!gameState.currentPuzzle || gameState.isComplete) return;

    const cell = { row, col };
    const newSelected = [...gameState.selectedCells, cell];
    setGameState(prev => ({ ...prev, selectedCells: newSelected }));

    // Check if word is complete
    checkWordSelection(newSelected);
  };

  const checkWordSelection = (selectedCells: { row: number; col: number }[]) => {
    if (!gameState.currentPuzzle || selectedCells.length < 2) return;

    const word = selectedCells.map(cell =>
      gameState.currentPuzzle!.grid[cell.row][cell.col]
    ).join('');

    const foundPosition = gameState.currentPuzzle.wordPositions.find(wp =>
      wp.word === word && !gameState.foundWords.includes(word)
    );

    if (foundPosition) {
      const newFoundWords = [...gameState.foundWords, word];
      const isComplete = newFoundWords.length === gameState.currentPuzzle.words.length;

      setGameState(prev => ({
        ...prev,
        foundWords: newFoundWords,
        selectedCells: [],
        isComplete,
      }));

      if (isComplete) {
        handlePuzzleComplete();
      }
    }
  };

  const handlePuzzleComplete = () => {
    setTimerActive(false);
    const newStats = { ...stats };
    newStats.puzzlesCompleted++;
    newStats.totalTime += gameState.time;

    if (gameState.currentPuzzle) {
      const difficulty = gameState.currentPuzzle.difficulty;
      if (newStats.bestTime[difficulty] === 0 ||
          gameState.time < newStats.bestTime[difficulty]) {
        newStats.bestTime[difficulty] = gameState.time;
      }
    }

    saveStats(newStats);

    setTimeout(() => {
      Alert.alert(
        'Congratulations!',
        `You found all words in ${formatTime(gameState.time)}!`,
        [{ text: 'New Puzzle', onPress: () => setShowPuzzleSelect(true) }]
      );
    }, 300);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearSelection = () => {
    setGameState(prev => ({ ...prev, selectedCells: [] }));
  };

  if (showPuzzleSelect || !gameState.currentPuzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.menuContainer}>
          <Text style={styles.menuTitle}>Word Search Offline</Text>
          <Text style={styles.menuSubtitle}>Select a Puzzle</Text>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Puzzles Completed:</Text>
              <Text style={styles.statValue}>{stats.puzzlesCompleted}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Time:</Text>
              <Text style={styles.statValue}>{formatTime(stats.totalTime)}</Text>
            </View>
          </View>

          {PUZZLES.map((puzzle) => (
            <TouchableOpacity
              key={puzzle.id}
              style={styles.puzzleButton}
              onPress={() => selectPuzzle(puzzle)}
            >
              <View style={styles.puzzleContent}>
                <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
                <Text style={styles.puzzleDifficulty}>{puzzle.difficulty}</Text>
                <Text style={styles.puzzleWords}>{puzzle.words.length} words</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.puzzleHeaderTitle}>{gameState.currentPuzzle.title}</Text>
            <Text style={styles.difficulty}>{gameState.currentPuzzle.difficulty}</Text>
          </View>
          <View>
            <Text style={styles.timer}>{formatTime(gameState.time)}</Text>
            <Text style={styles.progress}>
              {gameState.foundWords.length}/{gameState.currentPuzzle.words.length}
            </Text>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {gameState.currentPuzzle.grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((letter, colIndex) => (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    gameState.selectedCells.some(c => c.row === rowIndex && c.col === colIndex) &&
                      styles.cellSelected,
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                >
                  <Text style={styles.cellText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
          <Text style={styles.clearButtonText}>Clear Selection</Text>
        </TouchableOpacity>

        <View style={styles.wordsContainer}>
          <Text style={styles.wordsTitle}>Words to Find:</Text>
          <View style={styles.wordsList}>
            {gameState.currentPuzzle.words.map((word) => (
              <View
                key={word}
                style={[
                  styles.wordItem,
                  gameState.foundWords.includes(word) && styles.wordItemFound,
                ]}
              >
                <Text
                  style={[
                    styles.wordText,
                    gameState.foundWords.includes(word) && styles.wordTextFound,
                  ]}
                >
                  {word}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.newPuzzleButton}
          onPress={() => setShowPuzzleSelect(true)}
        >
          <Text style={styles.newPuzzleButtonText}>New Puzzle</Text>
        </TouchableOpacity>

        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  puzzleHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  difficulty: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
  },
  progress: {
    fontSize: 14,
    color: colors.gray.dark,
    textAlign: 'right',
  },
  gridContainer: {
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: colors.gray.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  cellSelected: {
    backgroundColor: colors.status.success + '40',
  },
  cellText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  clearButton: {
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  clearButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  wordsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  wordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wordItem: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  wordItemFound: {
    backgroundColor: colors.status.success,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  wordTextFound: {
    color: colors.white,
    textDecorationLine: 'line-through',
  },
  newPuzzleButton: {
    backgroundColor: colors.status.success,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  newPuzzleButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    padding: spacing.lg,
  },
  menuTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  menuSubtitle: {
    fontSize: 18,
    color: colors.gray.dark,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  statLabel: {
    fontSize: 16,
    color: colors.gray.dark,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  puzzleButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  puzzleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puzzleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  puzzleDifficulty: {
    fontSize: 14,
    color: colors.primary,
    marginRight: spacing.md,
  },
  puzzleWords: {
    fontSize: 14,
    color: colors.gray.dark,
  },
});
