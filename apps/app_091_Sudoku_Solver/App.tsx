import React, { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = '@Sudoku_Offline_data';
const { width } = Dimensions.get('window');
const CELL_SIZE = (width - spacing.lg * 2) / 9;

type CellValue = number | null;
type Grid = CellValue[][];
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface GameState {
  grid: Grid;
  solution: Grid;
  initialGrid: Grid;
  selectedCell: { row: number; col: number } | null;
  mistakes: number;
  hints: number;
  difficulty: Difficulty;
  time: number;
  isComplete: boolean;
}

interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: { [key in Difficulty]: number };
  totalTime: number;
}

// Predefined Sudoku puzzles for each difficulty
const PUZZLES = {
  Easy: [
    [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9],
    ],
    [
      [null, null, null, 2, 6, null, 7, null, 1],
      [6, 8, null, null, 7, null, null, 9, null],
      [1, 9, null, null, null, 4, 5, null, null],
      [8, 2, null, 1, null, null, null, 4, null],
      [null, null, 4, 6, null, 2, 9, null, null],
      [null, 5, null, null, null, 3, null, 2, 8],
      [null, null, 9, 3, null, null, null, 7, 4],
      [null, 4, null, null, 5, null, null, 3, 6],
      [7, null, 3, null, 1, 8, null, null, null],
    ],
    [
      [null, 2, null, 6, null, 8, null, null, null],
      [5, 8, null, null, null, 9, 7, null, null],
      [null, null, null, null, 4, null, null, null, null],
      [3, 7, null, null, null, null, 5, null, null],
      [6, null, null, null, null, null, null, null, 4],
      [null, null, 8, null, null, null, null, 1, 3],
      [null, null, null, null, 2, null, null, null, null],
      [null, null, 9, 8, null, null, null, 3, 6],
      [null, null, null, 3, null, 6, null, 9, null],
    ],
  ],
  Medium: [
    [
      [null, null, null, null, null, null, 6, 8, null],
      [null, null, null, null, 7, 3, null, null, 9],
      [3, null, 9, null, null, null, null, 4, 5],
      [4, 9, null, null, null, null, null, null, null],
      [8, null, 3, null, 5, null, 9, null, 2],
      [null, null, null, null, null, null, null, 3, 6],
      [9, 6, null, null, null, null, 3, null, 8],
      [7, null, null, 6, 8, null, null, null, null],
      [null, 2, 8, null, null, null, null, null, null],
    ],
    [
      [null, null, 5, 3, null, null, null, null, null],
      [8, null, null, null, null, null, null, 2, null],
      [null, 7, null, null, 1, null, 5, null, null],
      [4, null, null, null, null, 5, 3, null, null],
      [null, 1, null, null, 7, null, null, null, 6],
      [null, null, 3, 2, null, null, null, 8, null],
      [null, 6, null, 5, null, null, null, null, 9],
      [null, null, 4, null, null, null, null, 3, null],
      [null, null, null, null, null, 9, 7, null, null],
    ],
  ],
  Hard: [
    [
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, 3, null, 8, 5],
      [null, null, 1, null, 2, null, null, null, null],
      [null, null, null, 5, null, 7, null, null, null],
      [null, null, 4, null, null, null, 1, null, null],
      [null, 9, null, null, null, null, null, null, null],
      [5, null, null, null, null, null, null, 7, 3],
      [null, null, 2, null, 1, null, null, null, null],
      [null, null, null, null, 4, null, null, null, 9],
    ],
    [
      [null, null, null, 7, null, null, null, null, null],
      [1, null, null, null, null, null, null, null, null],
      [null, null, null, 4, 3, null, 2, null, null],
      [null, null, null, null, null, null, null, null, 6],
      [null, null, null, 5, null, 9, null, null, null],
      [null, null, null, null, null, null, 4, 1, 8],
      [null, null, null, null, 8, 1, null, null, null],
      [null, null, 2, null, null, null, null, 5, null],
      [null, 4, null, null, null, null, 3, null, null],
    ],
  ],
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(9).fill(null).map(() => Array(9).fill(null)),
    solution: Array(9).fill(null).map(() => Array(9).fill(null)),
    initialGrid: Array(9).fill(null).map(() => Array(9).fill(null)),
    selectedCell: null,
    mistakes: 0,
    hints: 3,
    difficulty: 'Easy',
    time: 0,
    isComplete: false,
  });

  const [stats, setStats] = useState<Stats>({
    gamesPlayed: 0,
    gamesWon: 0,
    bestTime: { Easy: 0, Medium: 0, Hard: 0 },
    totalTime: 0,
  });

  const [timerActive, setTimerActive] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
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

  const solveSudoku = (grid: Grid): Grid | null => {
    const newGrid = grid.map(row => [...row]);

    const isValid = (num: number, row: number, col: number): boolean => {
      // Check row
      for (let i = 0; i < 9; i++) {
        if (newGrid[row][i] === num) return false;
      }

      // Check column
      for (let i = 0; i < 9; i++) {
        if (newGrid[i][col] === num) return false;
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (newGrid[boxRow + i][boxCol + j] === num) return false;
        }
      }

      return true;
    };

    const solve = (): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (newGrid[row][col] === null) {
            for (let num = 1; num <= 9; num++) {
              if (isValid(num, row, col)) {
                newGrid[row][col] = num;
                if (solve()) return true;
                newGrid[row][col] = null;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    solve();
    return newGrid;
  };

  const startNewGame = (difficulty: Difficulty) => {
    const puzzles = PUZZLES[difficulty];
    const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
    const puzzleGrid = randomPuzzle.map(row => [...row]);
    const solution = solveSudoku(puzzleGrid);

    if (solution) {
      setGameState({
        grid: puzzleGrid.map(row => [...row]),
        solution,
        initialGrid: puzzleGrid.map(row => [...row]),
        selectedCell: null,
        mistakes: 0,
        hints: 3,
        difficulty,
        time: 0,
        isComplete: false,
      });
      setTimerActive(true);
      setShowDifficultyMenu(false);

      const newGamesPlayed = gamesPlayed + 1;
      setGamesPlayed(newGamesPlayed);
      if (newGamesPlayed % 3 === 0) {
        AdsManager.showInterstitialAd();
      }
    }
  };

  const handleCellPress = (row: number, col: number) => {
    if (gameState.isComplete) return;
    if (gameState.initialGrid[row][col] !== null) return;
    setGameState(prev => ({
      ...prev,
      selectedCell: { row, col },
    }));
  };

  const handleNumberPress = (num: number) => {
    if (!gameState.selectedCell || gameState.isComplete) return;
    const { row, col } = gameState.selectedCell;
    if (gameState.initialGrid[row][col] !== null) return;

    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[row][col] = num;

    let mistakes = gameState.mistakes;
    if (gameState.solution[row][col] !== num) {
      mistakes++;
      if (mistakes >= 3) {
        Alert.alert('Game Over', 'Too many mistakes! Try again.', [
          { text: 'New Game', onPress: () => startNewGame(gameState.difficulty) },
        ]);
        setTimerActive(false);
        return;
      }
    }

    const isComplete = checkCompletion(newGrid);

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      mistakes,
      isComplete,
    }));

    if (isComplete) {
      handleGameWin();
    }
  };

  const checkCompletion = (grid: Grid): boolean => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === null || grid[i][j] !== gameState.solution[i][j]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleGameWin = () => {
    setTimerActive(false);
    const newStats = { ...stats };
    newStats.gamesPlayed++;
    newStats.gamesWon++;
    newStats.totalTime += gameState.time;

    if (newStats.bestTime[gameState.difficulty] === 0 ||
        gameState.time < newStats.bestTime[gameState.difficulty]) {
      newStats.bestTime[gameState.difficulty] = gameState.time;
    }

    saveStats(newStats);

    setTimeout(() => {
      Alert.alert(
        'Congratulations!',
        `You completed the ${gameState.difficulty} puzzle in ${formatTime(gameState.time)}!`,
        [{ text: 'New Game', onPress: () => setShowDifficultyMenu(true) }]
      );
    }, 300);
  };

  const useHint = () => {
    if (gameState.hints <= 0 || gameState.isComplete) return;

    const emptyCells: { row: number; col: number }[] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (gameState.grid[i][j] === null && gameState.initialGrid[i][j] === null) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length === 0) return;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[randomCell.row][randomCell.col] = gameState.solution[randomCell.row][randomCell.col];

    setGameState(prev => ({
      ...prev,
      grid: newGrid,
      hints: prev.hints - 1,
      isComplete: checkCompletion(newGrid),
    }));
  };

  const clearCell = () => {
    if (!gameState.selectedCell || gameState.isComplete) return;
    const { row, col } = gameState.selectedCell;
    if (gameState.initialGrid[row][col] !== null) return;

    const newGrid = gameState.grid.map(r => [...r]);
    newGrid[row][col] = null;
    setGameState(prev => ({ ...prev, grid: newGrid }));
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Clear all your entries?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setGameState(prev => ({
            ...prev,
            grid: prev.initialGrid.map(row => [...row]),
            mistakes: 0,
            time: 0,
          }));
        },
      },
    ]);
  };

  const checkSolution = () => {
    if (gameState.isComplete) return;

    let errors = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (gameState.grid[i][j] !== null &&
            gameState.grid[i][j] !== gameState.solution[i][j]) {
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellStyle = (row: number, col: number) => {
    const isSelected = gameState.selectedCell?.row === row && gameState.selectedCell?.col === col;
    const isInitial = gameState.initialGrid[row][col] !== null;
    const isError = gameState.grid[row][col] !== null &&
                    gameState.grid[row][col] !== gameState.solution[row][col];

    return [
      styles.cell,
      isSelected && styles.cellSelected,
      isInitial && styles.cellInitial,
      isError && styles.cellError,
      col % 3 === 2 && col !== 8 && styles.cellRightBorder,
      row % 3 === 2 && row !== 8 && styles.cellBottomBorder,
    ];
  };

  if (showDifficultyMenu || gameState.grid.every(row => row.every(cell => cell === null))) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Sudoku Offline</Text>
          <Text style={styles.menuSubtitle}>Select Difficulty</Text>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Games Played:</Text>
              <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Games Won:</Text>
              <Text style={styles.statValue}>{stats.gamesWon}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Win Rate:</Text>
              <Text style={styles.statValue}>
                {stats.gamesPlayed > 0
                  ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`
                  : '0%'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.difficultyButton, styles.easyButton]}
            onPress={() => startNewGame('Easy')}
          >
            <Text style={styles.difficultyButtonText}>Easy</Text>
            <Text style={styles.difficultySubtext}>
              {stats.bestTime.Easy > 0 ? `Best: ${formatTime(stats.bestTime.Easy)}` : 'Not played yet'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.difficultyButton, styles.mediumButton]}
            onPress={() => startNewGame('Medium')}
          >
            <Text style={styles.difficultyButtonText}>Medium</Text>
            <Text style={styles.difficultySubtext}>
              {stats.bestTime.Medium > 0 ? `Best: ${formatTime(stats.bestTime.Medium)}` : 'Not played yet'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.difficultyButton, styles.hardButton]}
            onPress={() => startNewGame('Hard')}
          >
            <Text style={styles.difficultyButtonText}>Hard</Text>
            <Text style={styles.difficultySubtext}>
              {stats.bestTime.Hard > 0 ? `Best: ${formatTime(stats.bestTime.Hard)}` : 'Not played yet'}
            </Text>
          </TouchableOpacity>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.difficulty}>{gameState.difficulty}</Text>
              <Text style={styles.timer}>{formatTime(gameState.time)}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Mistakes</Text>
                <Text style={styles.statItemValue}>{gameState.mistakes}/3</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Hints</Text>
                <Text style={styles.statItemValue}>{gameState.hints}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {gameState.grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={getCellStyle(rowIndex, colIndex)}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                >
                  <Text style={[
                    styles.cellText,
                    gameState.initialGrid[rowIndex][colIndex] !== null && styles.cellTextInitial,
                  ]}>
                    {cell || ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.numberPad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <TouchableOpacity
              key={num}
              style={styles.numberButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.numberButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={clearCell}>
            <Text style={styles.controlButtonText}>Clear Cell</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, gameState.hints === 0 && styles.controlButtonDisabled]}
            onPress={useHint}
            disabled={gameState.hints === 0}
          >
            <Text style={styles.controlButtonText}>Hint ({gameState.hints})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={checkSolution}>
            <Text style={styles.controlButtonText}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={clearAll}>
            <Text style={styles.controlButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => setShowDifficultyMenu(true)}
        >
          <Text style={styles.newGameButtonText}>New Game</Text>
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
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficulty: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  timer: {
    fontSize: 18,
    color: colors.text,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
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
    borderWidth: 0.5,
    borderColor: colors.gray.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  cellSelected: {
    backgroundColor: colors.accent + '30',
  },
  cellInitial: {
    backgroundColor: colors.gray.light,
  },
  cellError: {
    backgroundColor: colors.status.error + '20',
  },
  cellRightBorder: {
    borderRightWidth: 2,
    borderRightColor: colors.black,
  },
  cellBottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
  },
  cellText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  cellTextInitial: {
    color: colors.black,
    fontWeight: 'bold',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  numberButton: {
    width: (width - spacing.lg * 2 - spacing.sm * 8) / 9,
    aspectRatio: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
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
  controlButtonDisabled: {
    backgroundColor: colors.gray.medium,
    opacity: 0.5,
  },
  controlButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  newGameButton: {
    backgroundColor: colors.status.success,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  newGameButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
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
  difficultyButton: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  easyButton: {
    backgroundColor: colors.status.success,
  },
  mediumButton: {
    backgroundColor: colors.status.warning,
  },
  hardButton: {
    backgroundColor: colors.status.error,
  },
  difficultyButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  difficultySubtext: {
    color: colors.white,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
});
