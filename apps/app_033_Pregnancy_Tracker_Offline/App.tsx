import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const dueDate = new Date('2025-09-01');
  const today = new Date();
  const diff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor((280 - diff) / 7);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Pregnancy Tracker</Text>
      <Text style={styles.w}>Week {weeks}</Text>
      <Text style={styles.d}>{diff} days until due date</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  w: { fontSize: 64, fontWeight: 'bold', color: colors.secondary, marginBottom: spacing.lg },
  d: { fontSize: 20, color: colors.text },
});
