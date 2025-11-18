import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Sliding_Puzzle_data';
const GRID_SIZE = 3;
const { width } = Dimensions.get('window');
const TILE_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / GRID_SIZE;

interface Tile {
  value: number;
  position: number;
}

interface GameStats {
  bestMoves: number;
  bestTime: number;
  gamesWon: number;
  gamesPlayed: number;
}

const SOLVED_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];

export default function App() {
  const [tiles, setTiles] = useState<number[]>(SOLVED_STATE);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won'>('ready');
  const [stats, setStats] = useState<GameStats>({ bestMoves: 0, bestTime: 0, gamesWon: 0, gamesPlayed: 0 });
  const [adCounter, setAdCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeAds();
    loadStats();
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

  const isSolvable = (puzzle: number[]): boolean => {
    let inversions = 0;
    const filtered = puzzle.filter(n => n !== 0);

    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (filtered[i] > filtered[j]) {
          inversions++;
        }
      }
    }

    return inversions % 2 === 0;
  };

  const scramblePuzzle = () => {
    let newTiles: number[];
    let attempts = 0;

    do {
      newTiles = [...SOLVED_STATE].sort(() => Math.random() - 0.5);
      attempts++;
    } while ((!isSolvable(newTiles) || arraysEqual(newTiles, SOLVED_STATE)) && attempts < 100);

    // If we can't find a solvable random state, do random moves
    if (!isSolvable(newTiles) || arraysEqual(newTiles, SOLVED_STATE)) {
      newTiles = [...SOLVED_STATE];
      const randomMoves = 50 + Math.floor(Math.random() * 50);

      for (let i = 0; i < randomMoves; i++) {
        const emptyIndex = newTiles.indexOf(0);
        const neighbors = getNeighbors(emptyIndex);
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        [newTiles[emptyIndex], newTiles[randomNeighbor]] = [newTiles[randomNeighbor], newTiles[emptyIndex]];
      }
    }

    setTiles(newTiles);
    setMoves(0);
    setTime(0);
    setGameState('ready');
  };

  const getNeighbors = (index: number): number[] => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    const neighbors: number[] = [];

    if (row > 0) neighbors.push((row - 1) * GRID_SIZE + col); // Up
    if (row < GRID_SIZE - 1) neighbors.push((row + 1) * GRID_SIZE + col); // Down
    if (col > 0) neighbors.push(row * GRID_SIZE + (col - 1)); // Left
    if (col < GRID_SIZE - 1) neighbors.push(row * GRID_SIZE + (col + 1)); // Right

    return neighbors;
  };

  const arraysEqual = (a: number[], b: number[]): boolean => {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  };

  const isSolved = (puzzle: number[]): boolean => {
    return arraysEqual(puzzle, SOLVED_STATE);
  };

  const handleTilePress = (index: number) => {
    if (gameState === 'won') return;

    const emptyIndex = tiles.indexOf(0);
    const neighbors = getNeighbors(emptyIndex);

    if (!neighbors.includes(index)) return;

    if (gameState === 'ready') {
      setGameState('playing');
    }

    // Swap tiles
    const newTiles = [...tiles];
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    setMoves(m => m + 1);

    // Check if solved
    if (isSolved(newTiles)) {
      setGameState('won');

      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + 1,
        bestMoves: stats.bestMoves === 0 ? moves + 1 : Math.min(stats.bestMoves, moves + 1),
        bestTime: stats.bestTime === 0 ? time : Math.min(stats.bestTime, time),
      };
      saveStats(newStats);

      const count = adCounter + 1;
      setAdCounter(count);
      if (count % 3 === 0) {
        setTimeout(() => showInterstitialAd(), 500);
      }

      Alert.alert(
        'Congratulations!',
        `You solved it in ${moves + 1} moves and ${formatTime(time)}!`,
        [{ text: 'New Puzzle', onPress: scramblePuzzle }]
      );
    }
  };

  const getTileColor = (value: number): string => {
    if (value === 0) return 'transparent';

    const hue = (value * 40) % 360;
    return `hsl(${hue}, 70%, 60%)`;
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
        <Text style={styles.title}>Sliding Puzzle</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Moves</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(time)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>
              {stats.bestMoves > 0 ? stats.bestMoves : '--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.grid}>
          {tiles.map((value, index) => {
            const row = Math.floor(index / GRID_SIZE);
            const col = index % GRID_SIZE;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tile,
                  {
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    backgroundColor: getTileColor(value),
                    opacity: value === 0 ? 0 : 1,
                  }
                ]}
                onPress={() => handleTilePress(index)}
                activeOpacity={0.7}
                disabled={value === 0}
              >
                {value !== 0 && (
                  <Text style={styles.tileText}>{value}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {gameState === 'won' && (
          <View style={styles.winOverlay}>
            <View style={styles.winCard}>
              <Text style={styles.winTitle}>🎉 Solved!</Text>
              <Text style={styles.winStat}>Moves: {moves}</Text>
              <Text style={styles.winStat}>Time: {formatTime(time)}</Text>
              {moves === stats.bestMoves && (
                <Text style={styles.bestLabel}>New Best Moves!</Text>
              )}
              {time === stats.bestTime && stats.bestTime > 0 && (
                <Text style={styles.bestLabel}>New Best Time!</Text>
              )}
              <Text style={styles.winInfo}>
                Won: {stats.gamesWon} / {stats.gamesPlayed}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.bestScores}>
          <View style={styles.bestItem}>
            <Text style={styles.bestLabel}>Best Moves</Text>
            <Text style={styles.bestValue}>
              {stats.bestMoves > 0 ? stats.bestMoves : '--'}
            </Text>
          </View>
          <View style={styles.bestItem}>
            <Text style={styles.bestLabel}>Best Time</Text>
            <Text style={styles.bestValue}>
              {stats.bestTime > 0 ? formatTime(stats.bestTime) : '--:--'}
            </Text>
          </View>
          <View style={styles.bestItem}>
            <Text style={styles.bestLabel}>Win Rate</Text>
            <Text style={styles.bestValue}>
              {stats.gamesPlayed > 0
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                : 0}%
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.scrambleBtn} onPress={scramblePuzzle}>
            <Text style={styles.btnText}>New Puzzle</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>Tap tiles adjacent to the empty space to slide them</Text>
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
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: TILE_SIZE * GRID_SIZE + spacing.sm * 2,
    height: TILE_SIZE * GRID_SIZE + spacing.sm * 2,
    backgroundColor: colors.gray.dark,
    padding: spacing.sm,
    borderRadius: 12,
    gap: spacing.sm,
  },
  tile: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tileText: {
    fontSize: TILE_SIZE * 0.4,
    fontWeight: 'bold',
    color: colors.white,
  },
  winOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 280,
  },
  winTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  winStat: {
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bestLabel: {
    fontSize: 14,
    color: colors.status.success,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  winInfo: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  bestScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  bestItem: {
    alignItems: 'center',
  },
  bestValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  buttons: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scrambleBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 13,
    color: colors.gray.dark,
    textAlign: 'center',
  },
});
