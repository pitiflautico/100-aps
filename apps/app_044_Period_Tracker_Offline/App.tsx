import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const lastPeriod = new Date('2025-11-01');
  const today = new Date();
  const daysSince = Math.floor((today - lastPeriod) / (1000*60*60*24));
  const cycleDay = (daysSince % 28) + 1;
  const nextPeriod = 28 - cycleDay;

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Period Tracker</Text>
      <Text style={styles.label}>Cycle Day</Text>
      <Text style={styles.day}>{cycleDay}</Text>
      <Text style={styles.next}>Next period in {nextPeriod} days</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  label: { fontSize: 18, color: colors.gray.dark, marginBottom: spacing.sm },
  day: { fontSize: 96, fontWeight: 'bold', color: '#E91E63', marginBottom: spacing.lg },
  next: { fontSize: 20, color: colors.text },
});
