/**
 * Play/Pause Button Component
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface PlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
}

export const PlayButton: React.FC<PlayButtonProps> = ({ isPlaying, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isPlaying && styles.buttonPlaying]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{isPlaying ? 'STOP' : 'START'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginVertical: spacing.xl,
  },
  buttonPlaying: {
    backgroundColor: colors.status.error,
  },
  buttonText: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
    letterSpacing: 2,
  },
});
