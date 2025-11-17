/**
 * BPM Control Component
 * Allows user to adjust tempo (beats per minute)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { colors, typography, spacing } from '../theme';

interface BPMControlProps {
  bpm: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onChangeBpm: (bpm: number) => void;
}

export const BPMControl: React.FC<BPMControlProps> = ({
  bpm,
  onIncrease,
  onDecrease,
  onChangeBpm,
}) => {
  const [inputValue, setInputValue] = React.useState(bpm.toString());

  React.useEffect(() => {
    setInputValue(bpm.toString());
  }, [bpm]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= 40 && numValue <= 240) {
      onChangeBpm(numValue);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tempo (BPM)</Text>

      <View style={styles.controlRow}>
        {/* Decrease Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={onDecrease}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>

        {/* BPM Display */}
        <View style={styles.bpmDisplay}>
          <TextInput
            style={styles.bpmText}
            value={inputValue}
            onChangeText={handleInputChange}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
        </View>

        {/* Increase Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={onIncrease}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.rangeText}>40 - 240 BPM</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  bpmDisplay: {
    minWidth: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  bpmText: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  rangeText: {
    fontSize: typography.sizes.sm,
    color: colors.gray.dark,
    marginTop: spacing.sm,
  },
});
