import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [time, setTime] = useState(45);
  const [rest, setRest] = useState(15);
  const [current, setCurrent] = useState(45);
  const [mode, setMode] = useState('work');
  const [on, setOn] = useState(false);

  useEffect(() => {
    let i = null;
    if (on && current > 0) i = setInterval(() => setCurrent(t => t - 1), 1000);
    else if (current === 0) {
      if (mode === 'work') { setMode('rest'); setCurrent(rest); }
      else { setMode('work'); setCurrent(time); }
    }
    return () => clearInterval(i);
  }, [on, current, mode]);

  return (
    <SafeAreaView style={[styles.c, mode === 'rest' && styles.restMode]}>
      <StatusBar style="light" />
      <Text style={styles.t}>Workout Timer</Text>
      <Text style={styles.mode}>{mode === 'work' ? 'WORK' : 'REST'}</Text>
      <Text style={styles.time}>{current}</Text>
      <TouchableOpacity style={styles.b} onPress={()=>setOn(!on)}>
        <Text style={styles.bt}>{on ? 'PAUSE' : 'START'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.status.success, justifyContent: 'center', alignItems: 'center' },
  restMode: { backgroundColor: colors.status.warning },
  t: { fontSize: 24, color: colors.white, fontWeight: 'bold', marginBottom: spacing.md },
  mode: { fontSize: 20, color: colors.white, marginBottom: spacing.xl },
  time: { fontSize: 96, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  b: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12 },
  bt: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
