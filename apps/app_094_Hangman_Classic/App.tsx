import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Hangman_Classic_stats';

interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  totalScore: number;
}

interface WordItem {
  word: string;
  hint: string;
}

const WORD_DATABASE: Record<string, WordItem[]> = {
  Animals: [
    { word: 'ELEPHANT', hint: 'Large mammal with trunk' },
    { word: 'GIRAFFE', hint: 'Tallest land animal' },
    { word: 'PENGUIN', hint: 'Flightless bird from Antarctica' },
    { word: 'DOLPHIN', hint: 'Intelligent sea mammal' },
    { word: 'KANGAROO', hint: 'Marsupial that hops' },
    { word: 'BUTTERFLY', hint: 'Insect with colorful wings' },
    { word: 'CHEETAH', hint: 'Fastest land animal' },
    { word: 'OCTOPUS', hint: 'Eight-armed sea creature' },
  ],
  Countries: [
    { word: 'AUSTRALIA', hint: 'Home of kangaroos' },
    { word: 'BRAZIL', hint: 'Largest South American country' },
    { word: 'CANADA', hint: 'Country north of USA' },
    { word: 'FRANCE', hint: 'Country of the Eiffel Tower' },
    { word: 'JAPAN', hint: 'Land of the rising sun' },
    { word: 'MEXICO', hint: 'Country south of USA' },
    { word: 'EGYPT', hint: 'Home of pyramids' },
    { word: 'SPAIN', hint: 'Country of flamenco' },
  ],
  Food: [
    { word: 'PIZZA', hint: 'Italian dish with cheese' },
    { word: 'CHOCOLATE', hint: 'Sweet brown treat' },
    { word: 'HAMBURGER', hint: 'Fast food with patty' },
    { word: 'SPAGHETTI', hint: 'Long Italian pasta' },
    { word: 'SANDWICH', hint: 'Food between bread' },
    { word: 'PANCAKE', hint: 'Flat breakfast cake' },
    { word: 'BANANA', hint: 'Yellow curved fruit' },
    { word: 'STRAWBERRY', hint: 'Red berry with seeds' },
  ],
  Sports: [
    { word: 'BASKETBALL', hint: 'Sport with hoops' },
    { word: 'FOOTBALL', hint: 'Sport with touchdowns' },
    { word: 'TENNIS', hint: 'Racket sport' },
    { word: 'SWIMMING', hint: 'Water sport' },
    { word: 'BASEBALL', hint: 'Sport with bats and bases' },
    { word: 'VOLLEYBALL', hint: 'Net sport with spiking' },
    { word: 'HOCKEY', hint: 'Ice or field sport' },
    { word: 'GOLF', hint: 'Sport with clubs and holes' },
  ],
  Technology: [
    { word: 'COMPUTER', hint: 'Electronic device' },
    { word: 'SMARTPHONE', hint: 'Portable communication device' },
    { word: 'INTERNET', hint: 'Global network' },
    { word: 'KEYBOARD', hint: 'Typing device' },
    { word: 'MONITOR', hint: 'Computer screen' },
    { word: 'SOFTWARE', hint: 'Computer programs' },
    { word: 'WEBSITE', hint: 'Online page' },
    { word: 'BLUETOOTH', hint: 'Wireless technology' },
  ],
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_LIVES = 6;

export default function App() {
  const [currentWord, setCurrentWord] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalScore: 0,
  });
  const [showCategoryModal, setShowCategoryModal] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [gamesCount, setGamesCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadStats();
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const wordSet = new Set(currentWord.split(''));
    const guessedWordLetters = [...guessedLetters].filter(l => wordSet.has(l));

    if (guessedWordLetters.length === wordSet.size && currentWord) {
      setGameState('won');
      const score = calculateScore();
      updateStats(true, score);
    } else if (lives === 0) {
      setGameState('lost');
      updateStats(false, 0);
    }
  }, [guessedLetters, lives, currentWord]);

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

  const selectCategory = (category: string) => {
    const words = WORD_DATABASE[category];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord.word);
    setCurrentHint(randomWord.hint);
    setCurrentCategory(category);
    setShowCategoryModal(false);
    startNewGame();
  };

  const startNewGame = () => {
    setGuessedLetters(new Set());
    setLives(MAX_LIVES);
    setGameState('playing');
  };

  const guessLetter = (letter: string) => {
    if (guessedLetters.has(letter) || gameState !== 'playing') return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!currentWord.includes(letter)) {
      setLives(lives - 1);
    }
  };

  const calculateScore = () => {
    const baseScore = 100;
    const livesBonus = lives * 10;
    const lengthBonus = currentWord.length * 5;
    return baseScore + livesBonus + lengthBonus;
  };

  const updateStats = (won: boolean, score: number) => {
    const newStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + (won ? 1 : 0),
      currentStreak: won ? stats.currentStreak + 1 : 0,
      bestStreak: won ? Math.max(stats.bestStreak, stats.currentStreak + 1) : stats.bestStreak,
      totalScore: stats.totalScore + score,
    };
    saveStats(newStats);

    const newCount = gamesCount + 1;
    setGamesCount(newCount);
    if (newCount % 3 === 0) showInterstitialAd();
  };

  const resetGame = () => {
    setShowCategoryModal(true);
  };

  const getDisplayWord = () => {
    return currentWord
      .split('')
      .map(letter => (guessedLetters.has(letter) ? letter : '_'))
      .join(' ');
  };

  const renderHangman = () => {
    const mistakes = MAX_LIVES - lives;
    const parts = [
      '  ╔═══╗\n  │   │\n  │   O\n  │  /|\\\n  │  / \\\n ═══',
      '  ╔═══╗\n  │   │\n  │   O\n  │  /|\\\n  │  /\n ═══',
      '  ╔═══╗\n  │   │\n  │   O\n  │  /|\\\n  │\n ═══',
      '  ╔═══╗\n  │   │\n  │   O\n  │  /|\n  │\n ═══',
      '  ╔═══╗\n  │   │\n  │   O\n  │   |\n  │\n ═══',
      '  ╔═══╗\n  │   │\n  │   O\n  │\n  │\n ═══',
      '  ╔═══╗\n  │   │\n  │\n  │\n  │\n ═══',
    ];

    return parts[6 - mistakes] || parts[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hangman</Text>
          <Text style={styles.subtitle}>Category: {currentCategory}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.statsBtn} onPress={() => setShowStatsModal(true)}>
            <Text style={styles.statsBtnText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
            <Text style={styles.newGameBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.livesContainer}>
          <Text style={styles.livesLabel}>Lives:</Text>
          <View style={styles.hearts}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Text key={i} style={styles.heart}>
                {i < lives ? '❤️' : '🖤'}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.hangmanContainer}>
          <Text style={styles.hangman}>{renderHangman()}</Text>
        </View>

        {currentHint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintLabel}>Hint:</Text>
            <Text style={styles.hintText}>{currentHint}</Text>
          </View>
        )}

        <View style={styles.wordContainer}>
          <Text style={styles.word}>{getDisplayWord()}</Text>
        </View>

        <View style={styles.keyboardContainer}>
          {ALPHABET.map((letter, index) => {
            const isGuessed = guessedLetters.has(letter);
            const isCorrect = isGuessed && currentWord.includes(letter);
            const isWrong = isGuessed && !currentWord.includes(letter);

            return (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.letterBtn,
                  isCorrect && styles.letterBtnCorrect,
                  isWrong && styles.letterBtnWrong,
                  isGuessed && styles.letterBtnDisabled,
                ]}
                onPress={() => guessLetter(letter)}
                disabled={isGuessed || gameState !== 'playing'}
              >
                <Text style={[
                  styles.letterText,
                  isGuessed && styles.letterTextDisabled,
                ]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {gameState !== 'playing' && (
          <View style={styles.gameOverContainer}>
            <View style={[
              styles.gameOverCard,
              gameState === 'won' ? styles.winCard : styles.loseCard
            ]}>
              <Text style={styles.gameOverTitle}>
                {gameState === 'won' ? '🎉 You Won!' : '😞 Game Over'}
              </Text>
              <Text style={styles.gameOverWord}>
                The word was: <Text style={styles.gameOverWordBold}>{currentWord}</Text>
              </Text>
              {gameState === 'won' && (
                <Text style={styles.scoreText}>Score: +{calculateScore()}</Text>
              )}
              <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <AdBanner />

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.keys(WORD_DATABASE).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryBtn}
                  onPress={() => selectCategory(category)}
                >
                  <Text style={styles.categoryIcon}>
                    {category === 'Animals' ? '🐾' :
                     category === 'Countries' ? '🌍' :
                     category === 'Food' ? '🍕' :
                     category === 'Sports' ? '⚽' :
                     '💻'}
                  </Text>
                  <Text style={styles.categoryText}>{category}</Text>
                  <Text style={styles.categoryCount}>
                    {WORD_DATABASE[category].length} words
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStatsModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
                <Text style={styles.statLabel}>Played</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.gamesWon}</Text>
                <Text style={styles.statLabel}>Won</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {stats.gamesPlayed > 0
                    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.bestStreak}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalScore}</Text>
                <Text style={styles.statLabel}>Total Score</Text>
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
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsBtn: {
    backgroundColor: colors.gray.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  statsBtnText: {
    fontSize: 20,
  },
  newGameBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  newGameBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: spacing.lg,
  },
  livesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  livesLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  hearts: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    fontSize: 24,
  },
  hangmanContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  hangman: {
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  hintContainer: {
    backgroundColor: colors.secondary + '20',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  hintLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray.dark,
    marginBottom: 4,
  },
  hintText: {
    fontSize: 16,
    color: colors.text,
  },
  wordContainer: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 4,
  },
  keyboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  letterBtn: {
    width: 42,
    height: 42,
    backgroundColor: colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  letterBtnCorrect: {
    backgroundColor: colors.status.success + '20',
    borderColor: colors.status.success,
  },
  letterBtnWrong: {
    backgroundColor: colors.status.error + '20',
    borderColor: colors.status.error,
  },
  letterBtnDisabled: {
    opacity: 0.4,
  },
  letterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  letterTextDisabled: {
    color: colors.gray.medium,
  },
  gameOverContainer: {
    marginTop: spacing.lg,
  },
  gameOverCard: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  winCard: {
    backgroundColor: colors.status.success + '20',
  },
  loseCard: {
    backgroundColor: colors.status.error + '20',
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.text,
  },
  gameOverWord: {
    fontSize: 16,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  gameOverWordBold: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 18,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.status.success,
    marginBottom: spacing.md,
  },
  playAgainBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  playAgainText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  categoryBtn: {
    backgroundColor: colors.gray.light,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  categoryText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    fontSize: 12,
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
