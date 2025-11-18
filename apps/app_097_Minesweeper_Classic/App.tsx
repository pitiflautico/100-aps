import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Minesweeper_Classic_data';
const GRID_SIZE = 8;
const MINE_COUNT = 10;
const { width } = Dimensions.get('window');
const CELL_SIZE = (width - spacing.lg * 2 - spacing.sm * 7) / GRID_SIZE;

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

interface GameStats {
  bestTime: number;
  gamesWon: number;
  gamesPlayed: number;
}

export default function App() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [flagMode, setFlagMode] = useState(false);
  const [minesLeft, setMinesLeft] = useState(MINE_COUNT);
  const [time, setTime] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [stats, setStats] = useState<GameStats>({ bestTime: 0, gamesWon: 0, gamesPlayed: 0 });
  const [adCounter, setAdCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadStats();
    initializeGrid();
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveStats = async (newStats: GameStats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const initializeGrid = (excludeRow?: number, excludeCol?: number) => {
    const newGrid: Cell[][] = [];

    // Create empty grid
    for (let row = 0; row < GRID_SIZE; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        newGrid[row][col] = {
          row,
          col,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        };
      }
    }

    // Place mines (avoiding first click)
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);

      if (!newGrid[row][col].isMine && !(row === excludeRow && col === excludeCol)) {
        newGrid[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 && newRow < GRID_SIZE &&
                newCol >= 0 && newCol < GRID_SIZE &&
                newGrid[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          newGrid[row][col].adjacentMines = count;
        }
      }
    }

    setGrid(newGrid);
  };

  const revealCell = (row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return;

    const cell = grid[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    // First click - ensure safe start
    if (firstClick) {
      setFirstClick(false);
      setGameState('playing');
      initializeGrid(row, col);
      // Will reveal on next render
      setTimeout(() => revealCell(row, col), 50);
      return;
    }

    if (cell.isMine) {
      // Game over - reveal all mines
      const newGrid = grid.map(row =>
        row.map(cell => ({
          ...cell,
          isRevealed: cell.isMine ? true : cell.isRevealed
        }))
      );
      setGrid(newGrid);
      setGameState('lost');

      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
      };
      saveStats(newStats);

      Alert.alert('Game Over', 'You hit a mine!', [
        { text: 'New Game', onPress: resetGame }
      ]);
      return;
    }

    // Reveal cell and flood fill if empty
    const newGrid = [...grid];
    const toReveal: [number, number][] = [[row, col]];
    const visited = new Set<string>();

    while (toReveal.length > 0) {
      const [r, c] = toReveal.pop()!;
      const key = `${r},${c}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
      if (newGrid[r][c].isRevealed || newGrid[r][c].isFlagged || newGrid[r][c].isMine) continue;

      newGrid[r][c].isRevealed = true;

      // If cell has no adjacent mines, reveal neighbors
      if (newGrid[r][c].adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) {
              toReveal.push([r + dr, c + dc]);
            }
          }
        }
      }
    }

    setGrid(newGrid);

    // Check for win
    const allNonMinesRevealed = newGrid.every(row =>
      row.every(cell => cell.isMine || cell.isRevealed)
    );

    if (allNonMinesRevealed) {
      setGameState('won');
      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + 1,
        bestTime: stats.bestTime === 0 ? time : Math.min(stats.bestTime, time),
      };
      saveStats(newStats);

      const count = adCounter + 1;
      setAdCounter(count);
      if (count % 3 === 0) showInterstitialAd();

      Alert.alert('Congratulations!', `You won in ${time} seconds!`, [
        { text: 'New Game', onPress: resetGame }
      ]);
    }
  };

  const toggleFlag = (row: number, col: number) => {
    if (gameState === 'won' || gameState === 'lost') return;

    const cell = grid[row][col];
    if (cell.isRevealed) return;

    if (!firstClick && gameState === 'ready') {
      setGameState('playing');
    }

    const newGrid = [...grid];
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
    setGrid(newGrid);

    setMinesLeft(prev => newGrid[row][col].isFlagged ? prev - 1 : prev + 1);
  };

  const handleCellPress = (row: number, col: number) => {
    if (flagMode) {
      toggleFlag(row, col);
    } else {
      revealCell(row, col);
    }
  };

  const resetGame = () => {
    initializeGrid();
    setGameState('ready');
    setFirstClick(true);
    setMinesLeft(MINE_COUNT);
    setTime(0);
    setFlagMode(false);
  };

  const getCellColor = (cell: Cell): string => {
    if (!cell.isRevealed) {
      return colors.gray.medium;
    }
    if (cell.isMine) {
      return '#ff4444';
    }
    return colors.white;
  };

  const getCellContent = (cell: Cell): string => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.adjacentMines === 0) return '';
    return cell.adjacentMines.toString();
  };

  const getNumberColor = (num: number): string => {
    const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[num] || '#000';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Minesweeper</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Mines</Text>
            <Text style={styles.statValue}>{minesLeft}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(time)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>
              {stats.bestTime > 0 ? formatTime(stats.bestTime) : '--:--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.modeBtn, !flagMode && styles.modeBtnActive]}
          onPress={() => setFlagMode(false)}
        >
          <Text style={[styles.modeBtnText, !flagMode && styles.modeBtnTextActive]}>
            Reveal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, flagMode && styles.modeBtnActive]}
          onPress={() => setFlagMode(true)}
        >
          <Text style={[styles.modeBtnText, flagMode && styles.modeBtnTextActive]}>
            🚩 Flag
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
          <Text style={styles.resetBtnText}>New Game</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.grid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    {
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: getCellColor(cell),
                    }
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: getNumberColor(cell.adjacentMines) }
                    ]}
                  >
                    {getCellContent(cell)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {gameState !== 'ready' && gameState !== 'playing' && (
          <View style={styles.overlay}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                {gameState === 'won' ? '🎉 You Won!' : '💥 Game Over'}
              </Text>
              <Text style={styles.resultTime}>
                Time: {formatTime(time)}
              </Text>
              {gameState === 'won' && time === stats.bestTime && (
                <Text style={styles.bestLabel}>New Best Time!</Text>
              )}
              <Text style={styles.resultStats}>
                Won: {stats.gamesWon} / {stats.gamesPlayed} games
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          {flagMode ? 'Tap to place/remove flags' : 'Tap to reveal cells'}
        </Text>
        <Text style={styles.infoText}>
          Win Rate: {stats.gamesPlayed > 0
            ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
            : 0}%
        </Text>
      </View>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  controls: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray.dark,
  },
  modeBtnTextActive: {
    color: colors.white,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.status.info,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  grid: {
    backgroundColor: colors.gray.dark,
    padding: 1,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    margin: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  cellText: {
    fontSize: CELL_SIZE * 0.5,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 250,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  resultTime: {
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bestLabel: {
    fontSize: 16,
    color: colors.status.success,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  resultStats: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  info: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: colors.gray.dark,
    marginBottom: 4,
  },
});
