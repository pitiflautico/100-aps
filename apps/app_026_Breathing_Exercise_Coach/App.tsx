import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [phase, setPhase] = useState('Breathe In');

  setTimeout(() => setPhase(phase === 'Breathe In' ? 'Hold' : phase === 'Hold' ? 'Breathe Out' : 'Breathe In'), 4000);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="light" />
      <Text style={styles.t}>Breathing Exercise</Text>
      <Text style={styles.p}>{phase}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.status.info, justifyContent: 'center', alignItems: 'center' },
  t: { fontSize: 24, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  p: { fontSize: 48, color: colors.white, fontWeight: 'bold' },
});
