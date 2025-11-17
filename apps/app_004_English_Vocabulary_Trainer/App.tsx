import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const WORDS = [
  { id: '1', word: 'Eloquent', definition: 'Fluent and persuasive in speaking', example: 'She gave an eloquent speech.' },
  { id: '2', word: 'Benevolent', definition: 'Well-meaning and kindly', example: 'A benevolent smile' },
  { id: '3', word: 'Resilient', definition: 'Able to recover quickly', example: 'Children are resilient.' },
  { id: '4', word: 'Ambiguous', definition: 'Open to multiple interpretations', example: 'An ambiguous statement' },
  { id: '5', word: 'Pragmatic', definition: 'Dealing with things realistically', example: 'A pragmatic approach' },
  { id: '6', word: 'Diligent', definition: 'Showing care and effort', example: 'A diligent student' },
  { id: '7', word: 'Empathy', definition: 'Understanding others feelings', example: 'Show empathy to others' },
  { id: '8', word: 'Innovative', definition: 'Featuring new methods', example: 'An innovative solution' },
];

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [learned, setLearned] = useState(new Set());

  const currentWord = WORDS[currentIndex];

  const markAsLearned = () => {
    setLearned(new Set([...learned, currentWord.id]));
    nextWord();
  };

  const nextWord = () => {
    setShowDefinition(false);
    setCurrentIndex((currentIndex + 1) % WORDS.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Vocabulary Trainer</Text>
        <Text style={styles.progress}>Learned: {learned.size}/{WORDS.length}</Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowDefinition(!showDefinition)}
          activeOpacity={0.9}
        >
          <Text style={styles.wordTitle}>{currentWord.word}</Text>

          {showDefinition && (
            <>
              <Text style={styles.definition}>{currentWord.definition}</Text>
              <Text style={styles.example}>Example: {currentWord.example}</Text>
            </>
          )}

          {!showDefinition && (
            <Text style={styles.hint}>Tap to see definition</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={nextWord}>
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.learnButton} onPress={markAsLearned}>
          <Text style={styles.buttonText}>I Know This</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  progress: { fontSize: 16, color: colors.text },
  cardContainer: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wordTitle: { fontSize: 36, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  definition: { fontSize: 18, color: colors.text, marginBottom: spacing.md },
  example: { fontSize: 16, color: colors.gray.dark, fontStyle: 'italic' },
  hint: { fontSize: 14, color: colors.gray.medium, textAlign: 'center', marginTop: spacing.lg },
  buttonContainer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  skipButton: {
    flex: 1,
    backgroundColor: colors.gray.medium,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  learnButton: {
    flex: 1,
    backgroundColor: colors.status.success,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
