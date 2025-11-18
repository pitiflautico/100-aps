import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY_BEST = '@2048_Game_best_score';
const STORAGE_KEY_STATE = '@2048_Game_state';

type Grid = number[][];

const GRID_SIZE = 4;
const { width } = Dimensions.get('window');
const TILE_SIZE = (width - spacing.lg * 2 - spacing.sm * 3) / GRID_SIZE;

const TILE_COLORS: Record<number, string> = {
  0: '#CDC1B4',
  2: '#EEE4DA',
  4: '#EDE0C8',
  8: '#F2B179',
  16: '#F59563',
  32: '#F67C5F',
  64: '#F65E3B',
  128: '#EDCF72',
  256: '#EDCC61',
  512: '#EDC850',
  1024: '#EDC53F',
  2048: '#EDC22E',
  4096: '#3C3A32',
  8192: '#3C3A32',
};

const TILE_TEXT_COLORS: Record<number, string> = {
  2: '#776E65',
  4: '#776E65',
};

export default function App() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [gamesCount, setGamesCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadBestScore();
    loadGameState();
  }, []);

  useEffect(() => {
    saveGameState();
  }, [grid, score, gameOver, hasWon]);

  const loadBestScore = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_BEST);
      if (saved) {
        setBestScore(parseInt(saved));
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveBestScore = async (newBest: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_BEST, newBest.toString());
      setBestScore(newBest);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const loadGameState = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const state = JSON.parse(saved);
        setGrid(state.grid);
        setScore(state.score);
        setGameOver(state.gameOver);
        setHasWon(state.hasWon);
      } else {
        initializeGame();
      }
    } catch (error) {
      console.error('Load error:', error);
      initializeGame();
    }
  };

  const saveGameState = async () => {
    try {
      const state = {
        grid,
        score,
        gameOver,
        hasWon,
      };
      await AsyncStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  function createEmptyGrid(): Grid {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  }

  function initializeGame() {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
  }

  function addRandomTile(currentGrid: Grid): Grid {
    const emptyTiles: [number, number][] = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          emptyTiles.push([i, j]);
        }
      }
    }
    if (emptyTiles.length === 0) return currentGrid;

    const [row, col] = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    const newValue = Math.random() < 0.9 ? 2 : 4;

    const newGrid = currentGrid.map(row => [...row]);
    newGrid[row][col] = newValue;
    return newGrid;
  }

  function rotateGrid(grid: Grid, times: number): Grid {
    let rotated = grid.map(row => [...row]);
    for (let i = 0; i < times; i++) {
      rotated = rotated[0].map((_, index) =>
        rotated.map(row => row[index]).reverse()
      );
    }
    return rotated;
  }

  function mergeLine(line: number[]): { line: number[], scoreIncrease: number } {
    const filtered = line.filter(num => num !== 0);
    const merged: number[] = [];
    let scoreIncrease = 0;
    let skip = false;

    for (let i = 0; i < filtered.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const newValue = filtered[i] * 2;
        merged.push(newValue);
        scoreIncrease += newValue;
        skip = true;
      } else {
        merged.push(filtered[i]);
      }
    }

    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }

    return { line: merged, scoreIncrease };
  }

  function move(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (gameOver) return false;

    let rotations = 0;
    switch (direction) {
      case 'left': rotations = 0; break;
      case 'up': rotations = 1; break;
      case 'right': rotations = 2; break;
      case 'down': rotations = 3; break;
    }

    let rotatedGrid = rotateGrid(grid, rotations);
    let newGrid: Grid = [];
    let totalScoreIncrease = 0;
    let moved = false;

    for (let i = 0; i < GRID_SIZE; i++) {
      const { line, scoreIncrease } = mergeLine(rotatedGrid[i]);
      newGrid.push(line);
      totalScoreIncrease += scoreIncrease;

      if (JSON.stringify(line) !== JSON.stringify(rotatedGrid[i])) {
        moved = true;
      }
    }

    if (!moved) return false;

    newGrid = rotateGrid(newGrid, (4 - rotations) % 4);
    newGrid = addRandomTile(newGrid);

    const newScore = score + totalScoreIncrease;
    setGrid(newGrid);
    setScore(newScore);

    if (newScore > bestScore) {
      saveBestScore(newScore);
    }

    // Check for 2048 tile (win condition)
    if (!hasWon && newGrid.some(row => row.includes(2048))) {
      setHasWon(true);
      Alert.alert('Congratulations!', 'You reached 2048! You can continue playing.', [
        { text: 'Continue', style: 'default' }
      ]);
    }

    // Check if game is over
    if (isGameOver(newGrid)) {
      setGameOver(true);
      const newCount = gamesCount + 1;
      setGamesCount(newCount);
      if (newCount % 3 === 0) showInterstitialAd();
    }

    return true;
  }

  function isGameOver(currentGrid: Grid): boolean {
    // Check for empty tiles
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) return false;
      }
    }

    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];
        if (j < GRID_SIZE - 1 && current === currentGrid[i][j + 1]) return false;
        if (i < GRID_SIZE - 1 && current === currentGrid[i + 1][j]) return false;
      }
    }

    return true;
  }

  function handleNewGame() {
    if (score > 0 && !gameOver) {
      Alert.alert(
        'New Game',
        'Are you sure you want to start a new game? Current progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'New Game', onPress: initializeGame }
        ]
      );
    } else {
      initializeGame();
    }
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy } = gestureState;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > absY && absX > 50) {
        move(dx > 0 ? 'right' : 'left');
      } else if (absY > absX && absY > 50) {
        move(dy > 0 ? 'down' : 'up');
      }
    },
  });

  function getTileColor(value: number): string {
    return TILE_COLORS[value] || '#3C3A32';
  }

  function getTileTextColor(value: number): string {
    return TILE_TEXT_COLORS[value] || '#F9F6F2';
  }

  function getTileFontSize(value: number): number {
    if (value >= 1024) return 24;
    if (value >= 128) return 28;
    return 32;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>2048</Text>
          <Text style={styles.subtitle}>Swipe to play</Text>
        </View>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={[styles.scoreBox, styles.bestScoreBox]}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={styles.scoreValue}>{bestScore}</Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.newGameBtn} onPress={handleNewGame}>
          <Text style={styles.newGameBtnText}>New Game</Text>
        </TouchableOpacity>
      </View>

      {gameOver && (
        <View style={styles.gameOverBanner}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <TouchableOpacity style={styles.tryAgainBtn} onPress={initializeGame}>
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasWon && !gameOver && (
        <View style={styles.winBanner}>
          <Text style={styles.winText}>You Win! 🎉</Text>
        </View>
      )}

      <View style={styles.gameBoard} {...panResponder.panHandlers}>
        {grid.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((value, j) => (
              <View
                key={`${i}-${j}`}
                style={[
                  styles.tile,
                  {
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    backgroundColor: getTileColor(value),
                  },
                ]}
              >
                {value > 0 && (
                  <Text
                    style={[
                      styles.tileText,
                      {
                        color: getTileTextColor(value),
                        fontSize: getTileFontSize(value),
                      },
                    ]}
                  >
                    {value}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to play:</Text>
        <Text style={styles.instructionText}>
          Swipe or use arrow buttons to move tiles. When two tiles with the same number touch, they merge into one!
        </Text>
        <Text style={styles.instructionText}>
          Goal: Create a tile with the number 2048
        </Text>
      </View>

      <View style={styles.buttonGrid}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonSpacer} />
          <TouchableOpacity
            style={styles.directionBtn}
            onPress={() => move('up')}
          >
            <Text style={styles.directionText}>↑</Text>
          </TouchableOpacity>
          <View style={styles.buttonSpacer} />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.directionBtn}
            onPress={() => move('left')}
          >
            <Text style={styles.directionText}>←</Text>
          </TouchableOpacity>
          <View style={styles.buttonSpacer} />
          <TouchableOpacity
            style={styles.directionBtn}
            onPress={() => move('right')}
          >
            <Text style={styles.directionText}>→</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <View style={styles.buttonSpacer} />
          <TouchableOpacity
            style={styles.directionBtn}
            onPress={() => move('down')}
          >
            <Text style={styles.directionText}>↓</Text>
          </TouchableOpacity>
          <View style={styles.buttonSpacer} />
        </View>
      </View>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8EF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#776E65',
  },
  subtitle: {
    fontSize: 14,
    color: '#776E65',
    marginTop: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreBox: {
    backgroundColor: '#BBADA0',
    borderRadius: 8,
    padding: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  bestScoreBox: {
    backgroundColor: '#8F7A66',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EEE4DA',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  controls: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  newGameBtn: {
    backgroundColor: '#8F7A66',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newGameBtnText: {
    color: '#F9F6F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameOverBanner: {
    backgroundColor: 'rgba(238, 228, 218, 0.95)',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#776E65',
    marginBottom: spacing.sm,
  },
  tryAgainBtn: {
    backgroundColor: '#8F7A66',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  tryAgainText: {
    color: '#F9F6F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  winBanner: {
    backgroundColor: 'rgba(237, 194, 46, 0.9)',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  winText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gameBoard: {
    backgroundColor: '#BBADA0',
    borderRadius: 12,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tile: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontWeight: 'bold',
  },
  instructions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#776E65',
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: 13,
    color: '#776E65',
    marginBottom: 4,
  },
  buttonGrid: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  buttonSpacer: {
    width: 60,
  },
  directionBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#8F7A66',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionText: {
    fontSize: 32,
    color: '#F9F6F2',
    fontWeight: 'bold',
  },
});
