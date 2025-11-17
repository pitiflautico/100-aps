/**
 * Time Signature Selector Component
 * Allows user to select different time signatures
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';
import { TimeSignature } from '../hooks/useMetronome';

interface TimeSignatureSelectorProps {
  selected: TimeSignature;
  onSelect: (ts: TimeSignature) => void;
  disabled?: boolean;
}

const TIME_SIGNATURES: TimeSignature[] = ['2/4', '3/4', '4/4', '5/4', '6/8'];

export const TimeSignatureSelector: React.FC<TimeSignatureSelectorProps> = ({
  selected,
  onSelect,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time Signature</Text>
      <View style={styles.optionsContainer}>
        {TIME_SIGNATURES.map((ts) => (
          <TouchableOpacity
            key={ts}
            style={[
              styles.option,
              selected === ts && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => !disabled && onSelect(ts)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text
              style={[
                styles.optionText,
                selected === ts && styles.optionTextSelected,
                disabled && styles.optionTextDisabled,
              ]}
            >
              {ts}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.gray.light,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    minWidth: 60,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  optionTextDisabled: {
    color: colors.gray.dark,
  },
});
