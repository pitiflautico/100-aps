import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [time, setTime] = useState(1500);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let interval = null;
    if (running && time > 0) interval = setInterval(() => setTime(t => t - 1), 1000);
    else if (time === 0) { setRunning(false); setSessions(s => s + 1); setTime(1500); }
    return () => clearInterval(interval);
  }, [running, time]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Focus Timer</Text>
      <Text style={styles.subtitle}>Sessions: {sessions}</Text>
      <Text style={styles.timer}>{Math.floor(time/60)}:{(time%60).toString().padStart(2,'0')}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => setRunning(!running)}>
        <Text style={styles.btnText}>{running ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.status.info, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 28, color: colors.white, fontWeight: 'bold', marginBottom: spacing.sm },
  subtitle: { fontSize: 16, color: colors.white, marginBottom: spacing.xl },
  timer: { fontSize: 72, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  btn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12, minWidth: 200, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
