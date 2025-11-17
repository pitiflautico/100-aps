import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [time, setTime] = useState(900);
  const [on, setOn] = useState(false);

  useEffect(() => {
    let i = null;
    if (on && time > 0) i = setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(i);
  }, [on, time]);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="light" />
      <Text style={styles.t}>Concentration</Text>
      <Text style={styles.tm}>{Math.floor(time/60)}:{(time%60).toString().padStart(2,'0')}</Text>
      <TouchableOpacity style={styles.b} onPress={() => setOn(!on)}>
        <Text style={styles.bt}>{on ? 'PAUSE' : 'START'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  t: { fontSize: 24, color: colors.white, fontWeight: 'bold', marginBottom: spacing.lg },
  tm: { fontSize: 64, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  b: { backgroundColor: colors.secondary, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12 },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
