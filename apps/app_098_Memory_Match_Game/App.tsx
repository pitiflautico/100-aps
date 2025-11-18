import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Memory_Match_Game_data';
const GRID_SIZE = 4;
const TOTAL_PAIRS = 8;
const { width } = Dimensions.get('window');
const CARD_SIZE = (width - spacing.lg * 2 - spacing.md * 3) / GRID_SIZE;

const CARD_EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎹'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameStats {
  bestScore: number;
  bestTime: number;
  gamesPlayed: number;
}

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won'>('ready');
  const [stats, setStats] = useState<GameStats>({ bestScore: 0, bestTime: 0, gamesPlayed: 0 });
  const [adCounter, setAdCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const flipAnimations = useRef<{ [key: number]: Animated.Value }>({});

  useEffect(() => {
    initializeAds();
    loadStats();
    initializeGame();
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

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);

      if (firstCard && secondCard) {
        if (firstCard.emoji === secondCard.emoji) {
          // Match found
          setTimeout(() => {
            setCards(prev =>
              prev.map(c =>
                c.id === first || c.id === second ? { ...c, isMatched: true } : c
              )
            );
            setMatches(prev => prev + 1);
            setFlippedCards([]);
          }, 600);
        } else {
          // No match - flip back
          setTimeout(() => {
            setCards(prev =>
              prev.map(c =>
                c.id === first || c.id === second ? { ...c, isFlipped: false } : c
              )
            );
            setFlippedCards([]);
          }, 1000);
        }
      }
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (matches === TOTAL_PAIRS && gameState === 'playing') {
      setGameState('won');

      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        bestScore: stats.bestScore === 0 ? moves : Math.min(stats.bestScore, moves),
        bestTime: stats.bestTime === 0 ? time : Math.min(stats.bestTime, time),
      };
      saveStats(newStats);

      const count = adCounter + 1;
      setAdCounter(count);
      if (count % 3 === 0) {
        setTimeout(() => showInterstitialAd(), 1000);
      }
    }
  }, [matches, gameState]);

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

  const initializeGame = () => {
    // Create pairs
    const cardPairs: Card[] = [];
    CARD_EMOJIS.forEach((emoji, index) => {
      cardPairs.push(
        {
          id: index * 2,
          emoji,
          isFlipped: false,
          isMatched: false,
        },
        {
          id: index * 2 + 1,
          emoji,
          isFlipped: false,
          isMatched: false,
        }
      );
    });

    // Shuffle
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffled);

    // Reset animations
    flipAnimations.current = {};
    shuffled.forEach(card => {
      flipAnimations.current[card.id] = new Animated.Value(0);
    });

    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setTime(0);
    setGameState('ready');
  };

  const handleCardPress = (cardId: number) => {
    if (gameState === 'won') return;
    if (flippedCards.length === 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    if (gameState === 'ready') {
      setGameState('playing');
    }

    // Animate flip
    Animated.spring(flipAnimations.current[cardId], {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();

    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );

    setFlippedCards(prev => [...prev, cardId]);

    if (flippedCards.length === 1) {
      setMoves(m => m + 1);
    }
  };

  const resetGame = () => {
    // Animate all cards back
    Object.values(flipAnimations.current).forEach(anim => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => {
      initializeGame();
    }, 300);
  };

  const getCardRotation = (cardId: number) => {
    const animation = flipAnimations.current[cardId];
    if (!animation) return '0deg';

    return animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });
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
        <Text style={styles.title}>Memory Match</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Moves</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Matches</Text>
            <Text style={styles.statValue}>{matches}/{TOTAL_PAIRS}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(time)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.gameContainer}>
        <View style={styles.grid}>
          {cards.map((card, index) => {
            const row = Math.floor(index / GRID_SIZE);
            const col = index % GRID_SIZE;

            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardContainer,
                  {
                    width: CARD_SIZE,
                    height: CARD_SIZE,
                  }
                ]}
                onPress={() => handleCardPress(card.id)}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    styles.card,
                    {
                      transform: [
                        { rotateY: getCardRotation(card.id) }
                      ],
                    }
                  ]}
                >
                  <View style={styles.cardFront}>
                    <Text style={styles.cardQuestion}>?</Text>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.card,
                    styles.cardBack,
                    {
                      transform: [
                        { rotateY: getCardRotation(card.id) }
                      ],
                    }
                  ]}
                >
                  <Text style={styles.cardEmoji}>{card.emoji}</Text>
                </Animated.View>

                {card.isMatched && (
                  <View style={styles.matchOverlay}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {gameState === 'won' && (
          <View style={styles.winOverlay}>
            <View style={styles.winCard}>
              <Text style={styles.winTitle}>🎉 You Won!</Text>
              <Text style={styles.winStat}>Moves: {moves}</Text>
              <Text style={styles.winStat}>Time: {formatTime(time)}</Text>
              {moves === stats.bestScore && (
                <Text style={styles.bestLabel}>New Best Score!</Text>
              )}
              <TouchableOpacity style={styles.newGameBtn} onPress={resetGame}>
                <Text style={styles.newGameBtnText}>New Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.bestScores}>
          <View style={styles.bestItem}>
            <Text style={styles.bestLabel}>Best Moves</Text>
            <Text style={styles.bestValue}>
              {stats.bestScore > 0 ? stats.bestScore : '--'}
            </Text>
          </View>
          <View style={styles.bestItem}>
            <Text style={styles.bestLabel}>Best Time</Text>
            <Text style={styles.bestValue}>
              {stats.bestTime > 0 ? formatTime(stats.bestTime) : '--:--'}
            </Text>
          </View>
          <View style={styles.bestItem}>
            <Text style={styles.bestLabel}>Games</Text>
            <Text style={styles.bestValue}>{stats.gamesPlayed}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
          <Text style={styles.resetBtnText}>New Game</Text>
        </TouchableOpacity>
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
    gap: spacing.md,
    justifyContent: 'center',
  },
  cardContainer: {
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardFront: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardQuestion: {
    fontSize: CARD_SIZE * 0.5,
    color: colors.white,
    fontWeight: 'bold',
  },
  cardBack: {
    backgroundColor: colors.white,
    transform: [{ rotateY: '180deg' }],
  },
  cardEmoji: {
    fontSize: CARD_SIZE * 0.5,
  },
  matchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: CARD_SIZE * 0.4,
    color: colors.white,
    fontWeight: 'bold',
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
    marginBottom: spacing.md,
  },
  newGameBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  newGameBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  bestScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  bestItem: {
    alignItems: 'center',
  },
  bestValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resetBtn: {
    backgroundColor: colors.status.info,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
