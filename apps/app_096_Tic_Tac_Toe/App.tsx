import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Tic_Tac_Toe_stats';

interface GameStats {
  wins: number;
  losses: number;
  draws: number;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

export default function App() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<'pvp' | 'ai'>('ai');
  const [stats, setStats] = useState<GameStats>({ wins: 0, losses: 0, draws: 0 });
  const [showModeModal, setShowModeModal] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [gamesCount, setGamesCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadStats();
  }, []);

  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !gameOver) {
      setTimeout(makeAIMove, 500);
    }
  }, [currentPlayer, gameOver, gameMode]);

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setStats(JSON.parse(saved));
      }
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

  const checkWinner = (currentBoard: Board): { winner: Player; line: number[] } => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    return { winner: null, line: [] };
  };

  const checkDraw = (currentBoard: Board): boolean => {
    return currentBoard.every(cell => cell !== null);
  };

  const makeMove = (index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const { winner: gameWinner, line } = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);
      setGameOver(true);
      updateStats(gameWinner);
    } else if (checkDraw(newBoard)) {
      setGameOver(true);
      updateStats(null);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const makeAIMove = () => {
    if (gameOver) return;

    // Simple AI: Try to win, block player, or pick random
    let move = findWinningMove(board, 'O'); // Try to win
    if (move === -1) move = findWinningMove(board, 'X'); // Block player
    if (move === -1) move = findBestMove(board); // Strategic move

    if (move !== -1) {
      makeMove(move);
    }
  };

  const findWinningMove = (currentBoard: Board, player: 'X' | 'O'): number => {
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = player;
        const { winner } = checkWinner(testBoard);
        if (winner === player) return i;
      }
    }
    return -1;
  };

  const findBestMove = (currentBoard: Board): number => {
    // Prefer center, then corners, then edges
    const center = 4;
    if (!currentBoard[center]) return center;

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !currentBoard[i]);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => !currentBoard[i]);
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }

    return -1;
  };

  const updateStats = (gameWinner: Player) => {
    let newStats = { ...stats };
    if (gameWinner === 'X') {
      newStats.wins++;
    } else if (gameWinner === 'O') {
      newStats.losses++;
    } else {
      newStats.draws++;
    }
    saveStats(newStats);

    const newCount = gamesCount + 1;
    setGamesCount(newCount);
    if (newCount % 4 === 0) showInterstitialAd();
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setWinner(null);
    setWinningLine([]);
  };

  const selectMode = (mode: 'pvp' | 'ai') => {
    setGameMode(mode);
    setShowModeModal(false);
    resetGame();
  };

  const getCellStyle = (index: number) => {
    const isWinning = winningLine.includes(index);
    return [
      styles.cell,
      isWinning && styles.cellWinning,
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tic Tac Toe</Text>
          <Text style={styles.subtitle}>
            {gameMode === 'ai' ? 'vs AI' : 'Player vs Player'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowStatsModal(true)}
          >
            <Text style={styles.headerBtnText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowModeModal(true)}
          >
            <Text style={styles.headerBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{stats.wins}</Text>
            <Text style={styles.scoreLabel}>Wins</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{stats.draws}</Text>
            <Text style={styles.scoreLabel}>Draws</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreValue}>{stats.losses}</Text>
            <Text style={styles.scoreLabel}>Losses</Text>
          </View>
        </View>

        {!gameOver && (
          <View style={styles.turnIndicator}>
            <Text style={styles.turnText}>
              Current Turn: <Text style={styles.turnPlayer}>{currentPlayer}</Text>
            </Text>
          </View>
        )}

        {gameOver && (
          <View style={styles.gameOverBanner}>
            <Text style={styles.gameOverText}>
              {winner ? `Player ${winner} Wins!` : "It's a Draw!"}
            </Text>
          </View>
        )}

        <View style={styles.boardContainer}>
          <View style={styles.board}>
            {board.map((cell, index) => (
              <TouchableOpacity
                key={index}
                style={getCellStyle(index)}
                onPress={() => makeMove(index)}
                disabled={!!cell || gameOver}
              >
                <Text style={[
                  styles.cellText,
                  cell === 'X' && styles.cellTextX,
                  cell === 'O' && styles.cellTextO,
                ]}>
                  {cell}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
          <Text style={styles.resetBtnText}>New Game</Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to Play:</Text>
          <Text style={styles.instructionText}>
            • Get 3 in a row (horizontal, vertical, or diagonal) to win
          </Text>
          <Text style={styles.instructionText}>
            • X always goes first
          </Text>
          <Text style={styles.instructionText}>
            • Play against AI or with a friend
          </Text>
        </View>
      </ScrollView>

      <AdBanner />

      <Modal visible={showModeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Game Mode</Text>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => selectMode('ai')}
            >
              <Text style={styles.modeBtnIcon}>🤖</Text>
              <Text style={styles.modeBtnText}>vs AI</Text>
              <Text style={styles.modeBtnSubtext}>Play against computer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => selectMode('pvp')}
            >
              <Text style={styles.modeBtnIcon}>👥</Text>
              <Text style={styles.modeBtnText}>Player vs Player</Text>
              <Text style={styles.modeBtnSubtext}>Play with a friend</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showStatsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.wins}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.losses}</Text>
                <Text style={styles.statLabel}>Losses</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.draws}</Text>
                <Text style={styles.statLabel}>Draws</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {stats.wins + stats.losses + stats.draws}
                </Text>
                <Text style={styles.statLabel}>Total Games</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {stats.wins + stats.losses + stats.draws > 0
                    ? Math.round((stats.wins / (stats.wins + stats.losses + stats.draws)) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowStatsModal(false)}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray.dark,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerBtn: {
    backgroundColor: colors.gray.light,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    fontSize: 20,
  },
  content: {
    padding: spacing.lg,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 4,
  },
  turnIndicator: {
    backgroundColor: colors.primary + '20',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  turnText: {
    fontSize: 18,
    color: colors.text,
  },
  turnPlayer: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gameOverBanner: {
    backgroundColor: colors.status.success + '20',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.status.success,
  },
  boardContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 330,
    height: 330,
    backgroundColor: colors.gray.medium,
    padding: 3,
    borderRadius: 12,
  },
  cell: {
    width: 106,
    height: 106,
    backgroundColor: colors.white,
    margin: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  cellWinning: {
    backgroundColor: colors.status.success + '30',
  },
  cellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  cellTextX: {
    color: colors.primary,
  },
  cellTextO: {
    color: colors.secondary,
  },
  resetBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resetBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modeBtn: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  modeBtnIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  modeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  modeBtnSubtext: {
    fontSize: 13,
    color: colors.gray.dark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 4,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
