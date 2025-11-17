import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFlashcards } from './hooks/useFlashcards';
import { FlashcardView } from './components/FlashcardView';
import { colors, spacing } from './theme';
import { Deck } from './types';
import { AdBanner } from './components/AdBanner';
import { AdsManager } from './services/adsManager';

export default function App() {
  const { decks, getCardsForDeck, getDeckProgress, saveSessionProgress, loading } = useFlashcards();
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  // Save progress and show ad when completing a deck
  useEffect(() => {
    if (selectedDeck && currentIndex >= getCardsForDeck(selectedDeck.id).length && currentIndex > 0) {
      // Save session progress
      saveSessionProgress(selectedDeck.id, score.correct, score.incorrect);

      // Show interstitial ad
      const timer = setTimeout(() => {
        AdsManager.showInterstitialAd();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, selectedDeck]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (selectedDeck) {
    const cards = getCardsForDeck(selectedDeck.id);
    if (currentIndex >= cards.length) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.resultContainer}>
            <Text style={styles.title}>Session Complete!</Text>
            <Text style={styles.scoreText}>Correct: {score.correct}</Text>
            <Text style={styles.scoreText}>Incorrect: {score.incorrect}</Text>
            <Text style={styles.scoreText}>
              Score: {Math.round((score.correct / (score.correct + score.incorrect)) * 100)}%
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setSelectedDeck(null);
                setCurrentIndex(0);
                setScore({ correct: 0, incorrect: 0 });
              }}
            >
              <Text style={styles.buttonText}>Back to Decks</Text>
            </TouchableOpacity>
          </View>
          <AdBanner />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>{selectedDeck.name}</Text>
          <Text style={styles.progress}>
            Card {currentIndex + 1} of {cards.length}
          </Text>
        </View>
        <FlashcardView
          card={cards[currentIndex]}
          onCorrect={() => {
            setScore(s => ({ ...s, correct: s.correct + 1 }));
            setCurrentIndex(currentIndex + 1);
          }}
          onIncorrect={() => {
            setScore(s => ({ ...s, incorrect: s.incorrect + 1 }));
            setCurrentIndex(currentIndex + 1);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Flashcards Trainer</Text>
      <Text style={styles.subtitle}>Select a deck to study</Text>
      <FlatList
        data={decks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const deckProgress = getDeckProgress(item.id);
          return (
            <TouchableOpacity
              style={[styles.deckCard, { borderLeftColor: item.color }]}
              onPress={() => setSelectedDeck(item)}
            >
              <Text style={styles.deckName}>{item.name}</Text>
              <Text style={styles.deckDescription}>{item.description}</Text>
              <Text style={styles.cardCount}>{item.cardCount} cards</Text>
              {deckProgress && (
                <Text style={styles.progressText}>
                  Sessions: {deckProgress.totalSessions} | Accuracy: {Math.round((deckProgress.totalCorrect / (deckProgress.totalCorrect + deckProgress.totalIncorrect)) * 100)}%
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
      />
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: 16, color: colors.gray.dark, marginBottom: spacing.md },
  progress: { fontSize: 14, color: colors.gray.dark },
  list: { padding: spacing.lg },
  deckCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deckName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  deckDescription: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.sm },
  cardCount: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  progressText: { fontSize: 11, color: colors.gray.medium, marginTop: spacing.xs },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  scoreText: { fontSize: 18, color: colors.text, marginVertical: spacing.sm },
  button: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, marginTop: spacing.xl },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
