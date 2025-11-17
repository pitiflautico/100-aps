import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Memory_Booster_Offline_data';

type GameType = 'menu' | 'card' | 'number' | 'word';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

interface GameScores {
  cardMatching: { [key in Difficulty]: number };
  numberSequence: { [key in Difficulty]: number };
  wordRecall: { [key in Difficulty]: number };
}

export default function App() {
  const [gameType, setGameType] = useState<GameType>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [scores, setScores] = useState<GameScores>({
    cardMatching: { easy: 0, medium: 0, hard: 0 },
    numberSequence: { easy: 0, medium: 0, hard: 0 },
    wordRecall: { easy: 0, medium: 0, hard: 0 },
  });

  // Card Matching Game
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(0);

  // Number Sequence Game
  const [numberSequence, setNumberSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  const [sequenceLevel, setSequenceLevel] = useState(1);
  const [numberInput, setNumberInput] = useState('');

  // Word Recall Game
  const [wordList, setWordList] = useState<string[]>([]);
  const [showWords, setShowWords] = useState(false);
  const [userWords, setUserWords] = useState('');
  const [wordScore, setWordScore] = useState(0);

  useEffect(() => {
    initializeAds();
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setScores(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveScores = async (newScores: GameScores) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newScores));
      setScores(newScores);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Card Matching Functions
  const initCardGame = () => {
    const gridSize = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16;
    const symbols = ['🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻', '🎹', '🏆', '🏅', '⚽', '🏀', '🎾', '🎳', '🎮', '🎲'];
    const pairs = symbols.slice(0, gridSize / 2);
    const cardValues = [...pairs, ...pairs].sort(() => Math.random() - 0.5);

    const newCards: Card[] = cardValues.map((value, index) => ({
      id: index,
      value,
      flipped: false,
      matched: false,
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setGameStartTime(Date.now());
    setGameType('card');
  };

  const flipCard = (id: number) => {
    if (flippedCards.length === 2) return;
    if (cards[id].flipped || cards[id].matched) return;

    const newCards = cards.map(c =>
      c.id === id ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;

      if (newCards[first].value === newCards[second].value) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, matched: true } : c
          ));
          setFlippedCards([]);

          const allMatched = newCards.filter(c => c.id !== first && c.id !== second).every(c => c.matched);
          if (allMatched) {
            finishCardGame(moves + 1);
          }
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const finishCardGame = (finalMoves: number) => {
    const timeSpent = Math.floor((Date.now() - gameStartTime) / 1000);
    const score = Math.max(1000 - (finalMoves * 10) - timeSpent, 0);

    if (score > scores.cardMatching[difficulty]) {
      const newScores = {
        ...scores,
        cardMatching: { ...scores.cardMatching, [difficulty]: score },
      };
      saveScores(newScores);
      Alert.alert('New High Score!', `Score: ${score}\nMoves: ${finalMoves}\nTime: ${timeSpent}s`);
    } else {
      Alert.alert('Game Complete!', `Score: ${score}\nMoves: ${finalMoves}\nTime: ${timeSpent}s`);
    }

    showInterstitialAd();
    setGameType('menu');
  };

  // Number Sequence Functions
  const initNumberGame = () => {
    setSequenceLevel(1);
    setUserSequence([]);
    setNumberInput('');
    nextNumberSequence(1);
    setGameType('number');
  };

  const nextNumberSequence = (level: number) => {
    const seqLength = difficulty === 'easy' ? level + 2 : difficulty === 'medium' ? level + 3 : level + 4;
    const max = difficulty === 'easy' ? 9 : difficulty === 'medium' ? 50 : 100;
    const sequence = Array.from({ length: seqLength }, () => Math.floor(Math.random() * max));
    setNumberSequence(sequence);
    setShowSequence(true);

    setTimeout(() => {
      setShowSequence(false);
    }, seqLength * 1000);
  };

  const submitNumberSequence = () => {
    const input = numberInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    const correct = JSON.stringify(input) === JSON.stringify(numberSequence);

    if (correct) {
      const newLevel = sequenceLevel + 1;
      setSequenceLevel(newLevel);
      setUserSequence([]);
      setNumberInput('');

      if (newLevel > scores.numberSequence[difficulty]) {
        const newScores = {
          ...scores,
          numberSequence: { ...scores.numberSequence, [difficulty]: newLevel },
        };
        saveScores(newScores);
      }

      Alert.alert('Correct!', `Level ${newLevel}`);
      nextNumberSequence(newLevel);
    } else {
      Alert.alert('Game Over', `You reached level ${sequenceLevel}!`);
      showInterstitialAd();
      setGameType('menu');
    }
  };

  // Word Recall Functions
  const initWordGame = () => {
    const allWords = [
      'apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 'galaxy', 'harbor',
      'island', 'jungle', 'kingdom', 'legend', 'mountain', 'nature', 'ocean', 'planet',
      'queen', 'river', 'sunset', 'thunder', 'universe', 'valley', 'wisdom', 'yellow',
      'zenith', 'bridge', 'castle', 'desert', 'energy', 'flower',
    ];
    const wordCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
    const selected = allWords.sort(() => Math.random() - 0.5).slice(0, wordCount);
    setWordList(selected);
    setShowWords(true);
    setUserWords('');
    setGameType('word');

    setTimeout(() => {
      setShowWords(false);
    }, wordCount * 1500);
  };

  const submitWordRecall = () => {
    const userWordList = userWords.toLowerCase().split(',').map(w => w.trim()).filter(w => w);
    const correctCount = userWordList.filter(w => wordList.includes(w)).length;
    const score = Math.round((correctCount / wordList.length) * 100);

    if (score > scores.wordRecall[difficulty]) {
      const newScores = {
        ...scores,
        wordRecall: { ...scores.wordRecall, [difficulty]: score },
      };
      saveScores(newScores);
      Alert.alert('New High Score!', `${correctCount}/${wordList.length} correct (${score}%)`);
    } else {
      Alert.alert('Results', `${correctCount}/${wordList.length} correct (${score}%)`);
    }

    showInterstitialAd();
    setGameType('menu');
  };

  if (gameType === 'card') {
    const gridCols = difficulty === 'easy' ? 4 : 4;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={() => setGameType('menu')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Card Matching</Text>
          <Text style={styles.moves}>Moves: {moves}</Text>
        </View>

        <View style={[styles.cardGrid, { paddingHorizontal: difficulty === 'hard' ? spacing.sm : spacing.lg }]}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { width: `${100 / gridCols - 2}%` },
                card.flipped || card.matched ? styles.cardFlipped : null,
              ]}
              onPress={() => flipCard(card.id)}
              disabled={card.flipped || card.matched}
            >
              <Text style={styles.cardText}>
                {card.flipped || card.matched ? card.value : '?'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AdBanner />
      </SafeAreaView>
    );
  }

  if (gameType === 'number') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={() => setGameType('menu')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Number Sequence</Text>
          <Text style={styles.level}>Level: {sequenceLevel}</Text>
        </View>

        <View style={styles.gameArea}>
          {showSequence ? (
            <View style={styles.sequenceDisplay}>
              <Text style={styles.instruction}>Memorize this sequence:</Text>
              <Text style={styles.sequenceText}>{numberSequence.join(', ')}</Text>
            </View>
          ) : (
            <View style={styles.inputArea}>
              <Text style={styles.instruction}>Enter the sequence (comma separated):</Text>
              <TextInput
                style={styles.sequenceInput}
                value={numberInput}
                onChangeText={setNumberInput}
                placeholder="e.g. 5, 3, 8, 1"
                keyboardType="numbers-and-punctuation"
                multiline
              />
              <TouchableOpacity style={styles.submitBtn} onPress={submitNumberSequence}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <AdBanner />
      </SafeAreaView>
    );
  }

  if (gameType === 'word') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={() => setGameType('menu')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.gameTitle}>Word Recall</Text>
          <Text style={styles.wordCount}>{wordList.length} words</Text>
        </View>

        <View style={styles.gameArea}>
          {showWords ? (
            <View style={styles.wordDisplay}>
              <Text style={styles.instruction}>Memorize these words:</Text>
              <View style={styles.wordGrid}>
                {wordList.map((word, idx) => (
                  <View key={idx} style={styles.wordChip}>
                    <Text style={styles.wordChipText}>{word}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.inputArea}>
              <Text style={styles.instruction}>Enter the words you remember (comma separated):</Text>
              <TextInput
                style={styles.sequenceInput}
                value={userWords}
                onChangeText={setUserWords}
                placeholder="e.g. apple, banana, cherry"
                multiline
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.submitBtn} onPress={submitWordRecall}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <AdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Memory Booster</Text>
      </View>

      <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent}>
        <View style={styles.difficultySection}>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View style={styles.diffRow}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.gamesSection}>
          <TouchableOpacity style={styles.gameCard} onPress={initCardGame}>
            <Text style={styles.gameIcon}>🎴</Text>
            <Text style={styles.gameName}>Card Matching</Text>
            <Text style={styles.gameDesc}>
              Find matching pairs in a grid
            </Text>
            <Text style={styles.bestScore}>
              Best: {scores.cardMatching[difficulty] || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gameCard} onPress={initNumberGame}>
            <Text style={styles.gameIcon}>🔢</Text>
            <Text style={styles.gameName}>Number Sequence</Text>
            <Text style={styles.gameDesc}>
              Memorize and repeat sequences
            </Text>
            <Text style={styles.bestScore}>
              Best Level: {scores.numberSequence[difficulty] || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gameCard} onPress={initWordGame}>
            <Text style={styles.gameIcon}>📝</Text>
            <Text style={styles.gameName}>Word Recall</Text>
            <Text style={styles.gameDesc}>
              Remember a list of words
            </Text>
            <Text style={styles.bestScore}>
              Best: {scores.wordRecall[difficulty] || 0}%
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
  menu: { flex: 1 },
  menuContent: { padding: spacing.lg },
  difficultySection: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing.md, color: colors.text },
  diffRow: { flexDirection: 'row', gap: spacing.sm },
  diffBtn: { flex: 1, backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, alignItems: 'center' },
  diffBtnActive: { backgroundColor: colors.primary },
  diffText: { fontSize: 14, fontWeight: '600', color: colors.text },
  diffTextActive: { color: colors.white },
  gamesSection: { gap: spacing.md },
  gameCard: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, alignItems: 'center', elevation: 2 },
  gameIcon: { fontSize: 48, marginBottom: spacing.md },
  gameName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  gameDesc: { fontSize: 14, color: colors.gray.dark, textAlign: 'center', marginBottom: spacing.sm },
  bestScore: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Game Views
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  backBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  gameTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  moves: { fontSize: 14, color: colors.gray.dark },
  level: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  wordCount: { fontSize: 14, color: colors.gray.dark },

  // Card Game
  cardGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm, alignContent: 'flex-start' },
  card: { aspectRatio: 1, backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  cardFlipped: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary },
  cardText: { fontSize: 32 },

  // Number/Word Games
  gameArea: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  sequenceDisplay: { alignItems: 'center' },
  wordDisplay: { alignItems: 'center' },
  instruction: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.xl, textAlign: 'center' },
  sequenceText: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  wordChip: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 20 },
  wordChipText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  inputArea: { alignItems: 'stretch' },
  sequenceInput: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.gray.light },
  submitBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
