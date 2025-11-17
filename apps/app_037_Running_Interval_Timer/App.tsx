import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [time, setTime] = useState(60);
  const [on, setOn] = useState(false);
  const [intervals, setIntervals] = useState(0);

  useEffect(() => {
    let i = null;
    if (on && time > 0) i = setInterval(() => setTime(t => t - 1), 1000);
    else if (time === 0) { setTime(60); setIntervals(intervals + 1); }
    return () => clearInterval(i);
  }, [on, time]);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar style="light" />
      <Text style={styles.t}>Running Intervals</Text>
      <Text style={styles.int}>Interval: {intervals + 1}</Text>
      <Text style={styles.time}>{time}</Text>
      <TouchableOpacity style={styles.b} onPress={()=>setOn(!on)}>
        <Text style={styles.bt}>{on ? 'PAUSE' : 'START'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center' },
  t: { fontSize: 24, color: colors.white, fontWeight: 'bold', marginBottom: spacing.sm },
  int: { fontSize: 18, color: colors.white, marginBottom: spacing.xl },
  time: { fontSize: 96, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  b: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12 },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
