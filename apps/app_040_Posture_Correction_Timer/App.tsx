import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [countdown, setCountdown] = useState(1800);

  useEffect(() => {
    const i = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 1800), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="dark" />
      <Text style={styles.t}>Posture Check</Text>
      <Text style={styles.msg}>Next reminder in:</Text>
      <Text style={styles.time}>{Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2,'0')}</Text>
      <Text style={styles.tip}>Sit up straight!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  t: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xl },
  msg: { fontSize: 18, color: colors.gray.dark, marginBottom: spacing.md },
  time: { fontSize: 64, fontWeight: 'bold', color: colors.secondary, marginBottom: spacing.xl },
  tip: { fontSize: 20, color: colors.status.success, fontStyle: 'italic' },
});
