import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Card } from '../types';
import { colors, spacing } from '../theme';

interface FlashcardViewProps {
  card: Card;
  onCorrect: () => void;
  onIncorrect: () => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ card, onCorrect, onIncorrect }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={flipCard} style={styles.cardContainer} activeOpacity={0.9}>
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <Text style={styles.label}>Question</Text>
          <Text style={styles.text}>{card.question}</Text>
          <Text style={styles.hint}>Tap to flip</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <Text style={styles.label}>Answer</Text>
          <Text style={styles.text}>{card.answer}</Text>
          <Text style={styles.hint}>Tap to flip</Text>
        </Animated.View>
      </TouchableOpacity>

      {isFlipped && (
        <View style={styles.buttonsContainer}>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: 300,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardFront: {
    position: 'absolute',
  },
  cardBack: {
    backgroundColor: colors.secondary,
  },
  label: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.gray.medium,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  correctButton: {
    backgroundColor: colors.status.success,
  },
  incorrectButton: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
