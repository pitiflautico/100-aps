/**
 * Metronome Display Component
 * Visual indicator showing current beat
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing } from '../theme';
import { TimeSignature } from '../hooks/useMetronome';

interface MetronomeDisplayProps {
  currentBeat: number;
  timeSignature: TimeSignature;
  isPlaying: boolean;
}

const getBeatsPerMeasure = (ts: TimeSignature): number => {
  const beatsMap: Record<TimeSignature, number> = {
    '2/4': 2,
    '3/4': 3,
    '4/4': 4,
    '5/4': 5,
    '6/8': 6,
  };
  return beatsMap[ts];
};

export const MetronomeDisplay: React.FC<MetronomeDisplayProps> = ({
  currentBeat,
  timeSignature,
  isPlaying,
}) => {
  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Animate on beat change
  React.useEffect(() => {
    if (isPlaying && currentBeat > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentBeat, isPlaying]);

  return (
    <View style={styles.container}>
      {/* Beat Indicators */}
      <View style={styles.beatsContainer}>
        {Array.from({ length: beatsPerMeasure }).map((_, index) => {
          const beatNumber = index + 1;
          const isActive = currentBeat === beatNumber;
          const isAccent = beatNumber === 1;

          return (
            <Animated.View
              key={index}
              style={[
                styles.beatIndicator,
                isActive && styles.beatIndicatorActive,
                isAccent && styles.beatIndicatorAccent,
                isActive && { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  isActive && styles.beatNumberActive,
                ]}
              >
                {beatNumber}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Time Signature Display */}
      <View style={styles.timeSignatureContainer}>
        <Text style={styles.timeSignatureText}>{timeSignature}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  beatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  beatIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gray.light,
    borderWidth: 2,
    borderColor: colors.gray.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatIndicatorActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  beatIndicatorAccent: {
    borderWidth: 3,
  },
  beatNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.gray.dark,
  },
  beatNumberActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  timeSignatureContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
  },
  timeSignatureText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
