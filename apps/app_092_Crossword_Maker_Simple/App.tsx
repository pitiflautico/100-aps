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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

const STORAGE_KEY = '@Crossword_Offline_data';
const { width } = Dimensions.get('window');
const CELL_SIZE = (width - spacing.lg * 2) / 7;

type CellValue = string | null;
type Grid = CellValue[][];

interface Clue {
  number: number;
  text: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  length: number;
}

interface Puzzle {
  id: number;
  grid: Grid;
  solution: Grid;
  clues: Clue[];
  title: string;
}

interface GameState {
  currentPuzzle: Puzzle | null;
  userGrid: Grid;
  selectedCell: { row: number; col: number } | null;
  hintsUsed: number;
  isComplete: boolean;
}

interface Stats {
  puzzlesCompleted: number;
  totalHintsUsed: number;
  bestPuzzle: number;
}

// Predefined crossword puzzles
const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: 'Animals',
    grid: [
      ['C', 'A', 'T', null, null, null, null],
      [null, null, 'I', null, null, null, null],
      ['D', 'O', 'G', null, 'B', 'I', 'G'],
      [null, null, 'E', null, null, null, null],
      [null, null, 'R', null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    solution: [
      ['C', 'A', 'T', null, null, null, null],
      [null, null, 'I', null, null, null, null],
      ['D', 'O', 'G', null, 'B', 'I', 'G'],
      [null, null, 'E', null, null, null, null],
      [null, null, 'R', null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    clues: [
      { number: 1, text: 'Feline pet', row: 0, col: 0, direction: 'across', length: 3 },
      { number: 2, text: 'Canine pet', row: 2, col: 0, direction: 'across', length: 3 },
      { number: 3, text: 'Large in size', row: 2, col: 4, direction: 'across', length: 3 },
      { number: 4, text: 'Striped big cat', row: 0, col: 2, direction: 'down', length: 5 },
    ],
  },
  {
    id: 2,
    title: 'Food',
    grid: [
      ['B', 'R', 'E', 'A', 'D', null, null],
      [null, null, null, null, null, null, null],
      ['M', 'I', 'L', 'K', null, null, null],
      [null, null, null, null, null, null, null],
      ['E', 'G', 'G', 'S', null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    solution: [
      ['B', 'R', 'E', 'A', 'D', null, null],
      [null, null, null, null, null, null, null],
      ['M', 'I', 'L', 'K', null, null, null],
      [null, null, null, null, null, null, null],
      ['E', 'G', 'G', 'S', null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    clues: [
      { number: 1, text: 'Baked staple food', row: 0, col: 0, direction: 'across', length: 5 },
      { number: 2, text: 'White dairy drink', row: 2, col: 0, direction: 'across', length: 4 },
      { number: 3, text: 'From chickens', row: 4, col: 0, direction: 'across', length: 4 },
    ],
  },
  {
    id: 3,
    title: 'Colors',
    grid: [
      ['R', 'E', 'D', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['B', 'L', 'U', 'E', null, null, null],
      [null, null, null, null, null, null, null],
      ['G', 'R', 'E', 'E', 'N', null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    solution: [
      ['R', 'E', 'D', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['B', 'L', 'U', 'E', null, null, null],
      [null, null, null, null, null, null, null],
      ['G', 'R', 'E', 'E', 'N', null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    clues: [
      { number: 1, text: 'Color of fire trucks', row: 0, col: 0, direction: 'across', length: 3 },
      { number: 2, text: 'Color of the sky', row: 2, col: 0, direction: 'across', length: 4 },
      { number: 3, text: 'Color of grass', row: 4, col: 0, direction: 'across', length: 5 },
    ],
  },
  {
    id: 4,
    title: 'Sports',
    grid: [
      ['S', 'O', 'C', 'C', 'E', 'R', null],
      [null, null, null, null, null, null, null],
      ['T', 'E', 'N', 'N', 'I', 'S', null],
      [null, null, null, null, null, null, null],
      ['G', 'O', 'L', 'F', null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    solution: [
      ['S', 'O', 'C', 'C', 'E', 'R', null],
      [null, null, null, null, null, null, null],
      ['T', 'E', 'N', 'N', 'I', 'S', null],
      [null, null, null, null, null, null, null],
      ['G', 'O', 'L', 'F', null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    clues: [
      { number: 1, text: 'Sport with a ball and goals', row: 0, col: 0, direction: 'across', length: 6 },
      { number: 2, text: 'Racket sport', row: 2, col: 0, direction: 'across', length: 6 },
      { number: 3, text: 'Sport with clubs and holes', row: 4, col: 0, direction: 'across', length: 4 },
    ],
  },
  {
    id: 5,
    title: 'Weather',
    grid: [
      ['S', 'U', 'N', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['R', 'A', 'I', 'N', null, null, null],
      [null, null, null, null, null, null, null],
      ['W', 'I', 'N', 'D', null, null, null],
      [null, null, null, null, null, null, null],
      ['S', 'N', 'O', 'W', null, null, null],
    ],
    solution: [
      ['S', 'U', 'N', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['R', 'A', 'I', 'N', null, null, null],
      [null, null, null, null, null, null, null],
      ['W', 'I', 'N', 'D', null, null, null],
      [null, null, null, null, null, null, null],
      ['S', 'N', 'O', 'W', null, null, null],
    ],
    clues: [
      { number: 1, text: 'Bright star in the sky', row: 0, col: 0, direction: 'across', length: 3 },
      { number: 2, text: 'Water falling from clouds', row: 2, col: 0, direction: 'across', length: 4 },
      { number: 3, text: 'Moving air', row: 4, col: 0, direction: 'across', length: 4 },
      { number: 4, text: 'White frozen precipitation', row: 6, col: 0, direction: 'across', length: 4 },
    ],
  },
  {
    id: 6,
    title: 'Numbers',
    grid: [
      ['O', 'N', 'E', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['T', 'W', 'O', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['T', 'H', 'R', 'E', 'E', null, null],
      [null, null, null, null, null, null, null],
      ['F', 'O', 'U', 'R', null, null, null],
    ],
    solution: [
      ['O', 'N', 'E', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['T', 'W', 'O', null, null, null, null],
      [null, null, null, null, null, null, null],
      ['T', 'H', 'R', 'E', 'E', null, null],
      [null, null, null, null, null, null, null],
      ['F', 'O', 'U', 'R', null, null, null],
    ],
    clues: [
      { number: 1, text: 'First number', row: 0, col: 0, direction: 'across', length: 3 },
      { number: 2, text: 'After one', row: 2, col: 0, direction: 'across', length: 3 },
      { number: 3, text: 'After two', row: 4, col: 0, direction: 'across', length: 5 },
      { number: 4, text: 'After three', row: 6, col: 0, direction: 'across', length: 4 },
    ],
  },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentPuzzle: null,
    userGrid: Array(7).fill(null).map(() => Array(7).fill(null)),
    selectedCell: null,
    hintsUsed: 0,
    isComplete: false,
  });

  const [stats, setStats] = useState<Stats>({
    puzzlesCompleted: 0,
    totalHintsUsed: 0,
    bestPuzzle: 0,
  });

  const [showPuzzleSelect, setShowPuzzleSelect] = useState(true);
  const [showClues, setShowClues] = useState(true);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    AdsManager.showInterstitialAd();
    loadData();
  }, []);

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
    const emptyGrid = Array(7).fill(null).map(() => Array(7).fill(null));
    setGameState({
      currentPuzzle: puzzle,
      userGrid: emptyGrid,
      selectedCell: null,
      hintsUsed: 0,
      isComplete: false,
    });
    setShowPuzzleSelect(false);

    const newGamesPlayed = gamesPlayed + 1;
    setGamesPlayed(newGamesPlayed);
    if (newGamesPlayed % 3 === 0) {
      AdsManager.showInterstitialAd();
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (!gameState.currentPuzzle || gameState.isComplete) return;
    if (gameState.currentPuzzle.solution[row][col] === null) return;

    setGameState(prev => ({
      ...prev,
      selectedCell: { row, col },
    }));
  };

  const handleLetterInput = (letter: string) => {
    if (!gameState.selectedCell || !gameState.currentPuzzle || gameState.isComplete) return;
    const { row, col } = gameState.selectedCell;

    const newGrid = gameState.userGrid.map(r => [...r]);
    newGrid[row][col] = letter.toUpperCase();

    const isComplete = checkCompletion(newGrid);

    setGameState(prev => ({
      ...prev,
      userGrid: newGrid,
      isComplete,
    }));

    if (isComplete) {
      handlePuzzleComplete();
    }
  };

  const checkCompletion = (grid: Grid): boolean => {
    if (!gameState.currentPuzzle) return false;

    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const solution = gameState.currentPuzzle.solution[i][j];
        if (solution !== null && grid[i][j] !== solution) {
          return false;
        }
      }
    }
    return true;
  };

  const handlePuzzleComplete = () => {
    const newStats = { ...stats };
    newStats.puzzlesCompleted++;
    newStats.totalHintsUsed += gameState.hintsUsed;

    if (gameState.currentPuzzle && gameState.currentPuzzle.id > newStats.bestPuzzle) {
      newStats.bestPuzzle = gameState.currentPuzzle.id;
    }

    saveStats(newStats);

    setTimeout(() => {
      Alert.alert(
        'Congratulations!',
        `You completed "${gameState.currentPuzzle?.title}" with ${gameState.hintsUsed} hint${gameState.hintsUsed !== 1 ? 's' : ''}!`,
        [{ text: 'New Puzzle', onPress: () => setShowPuzzleSelect(true) }]
      );
    }, 300);
  };

  const useHint = () => {
    if (!gameState.currentPuzzle || gameState.isComplete) return;

    const emptyCells: { row: number; col: number }[] = [];
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (gameState.currentPuzzle.solution[i][j] !== null &&
            gameState.userGrid[i][j] === null) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length === 0) return;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = gameState.userGrid.map(r => [...r]);
    newGrid[randomCell.row][randomCell.col] =
      gameState.currentPuzzle.solution[randomCell.row][randomCell.col];

    setGameState(prev => ({
      ...prev,
      userGrid: newGrid,
      hintsUsed: prev.hintsUsed + 1,
      isComplete: checkCompletion(newGrid),
    }));
  };

  const clearGrid = () => {
    Alert.alert('Clear Grid', 'Clear all your entries?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          const emptyGrid = Array(7).fill(null).map(() => Array(7).fill(null));
          setGameState(prev => ({
            ...prev,
            userGrid: emptyGrid,
            hintsUsed: 0,
          }));
        },
      },
    ]);
  };

  const checkSolution = () => {
    if (!gameState.currentPuzzle || gameState.isComplete) return;

    let errors = 0;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (gameState.userGrid[i][j] !== null &&
            gameState.currentPuzzle.solution[i][j] !== null &&
            gameState.userGrid[i][j] !== gameState.currentPuzzle.solution[i][j]) {
          errors++;
        }
      }
    }

    Alert.alert(
      'Solution Check',
      errors === 0
        ? 'All filled cells are correct! Keep going!'
        : `Found ${errors} error${errors > 1 ? 's' : ''}. Keep trying!`
    );
  };

  const getCellStyle = (row: number, col: number) => {
    if (!gameState.currentPuzzle) return [styles.cell];

    const isSelected = gameState.selectedCell?.row === row && gameState.selectedCell?.col === col;
    const isBlocked = gameState.currentPuzzle.solution[row][col] === null;
    const hasError = gameState.userGrid[row][col] !== null &&
                     gameState.currentPuzzle.solution[row][col] !== null &&
                     gameState.userGrid[row][col] !== gameState.currentPuzzle.solution[row][col];

    return [
      styles.cell,
      isBlocked && styles.cellBlocked,
      isSelected && !isBlocked && styles.cellSelected,
      hasError && styles.cellError,
    ];
  };

  const getClueNumber = (row: number, col: number): number | null => {
    if (!gameState.currentPuzzle) return null;
    const clue = gameState.currentPuzzle.clues.find(
      c => c.row === row && c.col === col
    );
    return clue ? clue.number : null;
  };

  if (showPuzzleSelect || !gameState.currentPuzzle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.menuContainer}>
          <Text style={styles.menuTitle}>Crossword Offline</Text>
          <Text style={styles.menuSubtitle}>Select a Puzzle</Text>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Puzzles Completed:</Text>
              <Text style={styles.statValue}>{stats.puzzlesCompleted}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Hints Used:</Text>
              <Text style={styles.statValue}>{stats.totalHintsUsed}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Best Puzzle:</Text>
              <Text style={styles.statValue}>
                {stats.bestPuzzle > 0 ? `#${stats.bestPuzzle}` : 'None'}
              </Text>
            </View>
          </View>

          {PUZZLES.map((puzzle) => (
            <TouchableOpacity
              key={puzzle.id}
              style={styles.puzzleButton}
              onPress={() => selectPuzzle(puzzle)}
            >
              <View style={styles.puzzleButtonContent}>
                <Text style={styles.puzzleNumber}>#{puzzle.id}</Text>
                <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
                <Text style={styles.puzzleClues}>{puzzle.clues.length} clues</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <AdBanner />
      </SafeAreaView>
    );
  }

  const acrossClues = gameState.currentPuzzle.clues.filter(c => c.direction === 'across');
  const downClues = gameState.currentPuzzle.clues.filter(c => c.direction === 'down');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.puzzleHeaderTitle}>{gameState.currentPuzzle.title}</Text>
          <Text style={styles.hintsText}>Hints Used: {gameState.hintsUsed}</Text>
        </View>

        <View style={styles.gridContainer}>
          {gameState.userGrid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => {
                const clueNumber = getClueNumber(rowIndex, colIndex);
                return (
                  <TouchableOpacity
                    key={`${rowIndex}-${colIndex}`}
                    style={getCellStyle(rowIndex, colIndex)}
                    onPress={() => handleCellPress(rowIndex, colIndex)}
                  >
                    {clueNumber && (
                      <Text style={styles.clueNumber}>{clueNumber}</Text>
                    )}
                    <Text style={styles.cellText}>
                      {gameState.userGrid[rowIndex][colIndex] || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.keyboard}>
          {['ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')].map((letters, i) => (
            <View key={i} style={styles.keyboardRow}>
              {letters[0].slice(i * 9, (i + 1) * 9).map((letter) => (
                <TouchableOpacity
                  key={letter}
                  style={styles.keyButton}
                  onPress={() => handleLetterInput(letter)}
                >
                  <Text style={styles.keyButtonText}>{letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={styles.keyboardRow}>
            {'QRSTUVWXYZ'.split('').map((letter) => (
              <TouchableOpacity
                key={letter}
                style={styles.keyButton}
                onPress={() => handleLetterInput(letter)}
              >
                <Text style={styles.keyButtonText}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={useHint}>
            <Text style={styles.controlButtonText}>Hint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={checkSolution}>
            <Text style={styles.controlButtonText}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={clearGrid}>
            <Text style={styles.controlButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cluesToggle}
          onPress={() => setShowClues(!showClues)}
        >
          <Text style={styles.cluesToggleText}>
            {showClues ? 'Hide Clues' : 'Show Clues'}
          </Text>
        </TouchableOpacity>

        {showClues && (
          <View style={styles.cluesContainer}>
            <View style={styles.cluesSection}>
              <Text style={styles.cluesSectionTitle}>Across</Text>
              {acrossClues.map((clue) => (
                <View key={`across-${clue.number}`} style={styles.clueItem}>
                  <Text style={styles.clueNumber2}>{clue.number}.</Text>
                  <Text style={styles.clueText}>{clue.text}</Text>
                </View>
              ))}
            </View>

            {downClues.length > 0 && (
              <View style={styles.cluesSection}>
                <Text style={styles.cluesSectionTitle}>Down</Text>
                {downClues.map((clue) => (
                  <View key={`down-${clue.number}`} style={styles.clueItem}>
                    <Text style={styles.clueNumber2}>{clue.number}.</Text>
                    <Text style={styles.clueText}>{clue.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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
  hintsText: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  gridContainer: {
    backgroundColor: colors.white,
    padding: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.black,
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
    position: 'relative',
  },
  cellBlocked: {
    backgroundColor: colors.black,
  },
  cellSelected: {
    backgroundColor: colors.accent + '30',
  },
  cellError: {
    backgroundColor: colors.status.error + '20',
  },
  cellText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  clueNumber: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
  },
  keyboard: {
    marginBottom: spacing.md,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  keyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginHorizontal: 2,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  keyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  controlButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cluesToggle: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cluesToggleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cluesContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cluesSection: {
    marginBottom: spacing.lg,
  },
  cluesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  clueItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  clueNumber2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: spacing.sm,
    minWidth: 25,
  },
  clueText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
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
  puzzleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  puzzleNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  puzzleTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  puzzleClues: {
    fontSize: 14,
    color: colors.gray.dark,
  },
});
