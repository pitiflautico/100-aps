import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const examDate = new Date('2025-12-31');
  const today = new Date();
  const diff = Math.floor((examDate - today) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Exam Countdown</Text>
      <Text style={styles.d}>{diff}</Text>
      <Text style={styles.l}>days remaining</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  d: { fontSize: 96, fontWeight: 'bold', color: colors.secondary },
  l: { fontSize: 20, color: colors.gray.dark },
});
