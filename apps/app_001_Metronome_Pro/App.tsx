/**
 * Metronome Pro
 * Professional metronome app with AdMob integration
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useMetronome } from './hooks/useMetronome';
import { BPMControl } from './components/BPMControl';
import { MetronomeDisplay } from './components/MetronomeDisplay';
import { PlayButton } from './components/PlayButton';
import { TimeSignatureSelector } from './components/TimeSignatureSelector';
import { colors, spacing } from './theme';

// AdMob imports (commented out for now since expo-ads-admob setup is needed)
// import { AdBanner } from '../../shared/admob/AdBanner';
// import { InterstitialAdManager } from '../../shared/admob/AdInterstitial';

export default function App() {
  const {
    bpm,
    isPlaying,
    currentBeat,
    timeSignature,
    setBpm,
    setTimeSignature,
    toggle,
    increaseBpm,
    decreaseBpm,
  } = useMetronome();

  // Initialize AdMob on app start
  useEffect(() => {
    // InterstitialAdManager.init();
    // Show interstitial ad after 3 seconds
    // setTimeout(() => {
    //   InterstitialAdManager.showAdWithDelay(3000);
    // }, 3000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Metronome Pro</Text>
          <Text style={styles.subtitle}>Professional Tempo Trainer</Text>
        </View>

        {/* Metronome Display */}
        <MetronomeDisplay
          currentBeat={currentBeat}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
        />

        {/* Play/Stop Button */}
        <PlayButton isPlaying={isPlaying} onPress={toggle} />

        {/* BPM Control */}
        <BPMControl
          bpm={bpm}
          onIncrease={increaseBpm}
          onDecrease={decreaseBpm}
          onChangeBpm={setBpm}
        />

        {/* Time Signature Selector */}
        <TimeSignatureSelector
          selected={timeSignature}
          onSelect={setTimeSignature}
          disabled={isPlaying}
        />

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Tap START to begin. Adjust tempo with +/- buttons.
          </Text>
          <Text style={styles.infoText}>
            Time signature can only be changed when stopped.
          </Text>
        </View>
      </ScrollView>

      {/* AdMob Banner (uncomment when AdMob is configured) */}
      {/* <AdBanner /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray.dark,
  },
  infoContainer: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
});
