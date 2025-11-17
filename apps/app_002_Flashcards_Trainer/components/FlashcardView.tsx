import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../theme';
import { Flashcard } from '../types';

interface Props {
  card: Flashcard;
  onCorrect: () => void;
  onIncorrect: () => void;
}

export const FlashcardView: React.FC<Props> = ({ card, onCorrect, onIncorrect }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setFlipped(!flipped)}
        activeOpacity={0.9}
      >
        <Text style={styles.label}>{flipped ? 'BACK' : 'FRONT'}</Text>
        <Text style={styles.content}>{flipped ? card.back : card.front}</Text>
        <Text style={styles.hint}>Tap to flip</Text>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.incorrectButton]} onPress={onIncorrect}>
            <Text style={styles.buttonText}>✗ Incorrect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.correctButton]} onPress={onCorrect}>
            <Text style={styles.buttonText}>✓ Correct</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.md },
  content: { fontSize: 32, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  hint: { fontSize: 12, color: colors.gray.medium, marginTop: spacing.md },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  button: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  correctButton: { backgroundColor: colors.status.success },
  incorrectButton: { backgroundColor: colors.status.error },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
