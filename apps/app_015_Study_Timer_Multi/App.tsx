import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [time, setTime] = useState(600);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (running && time > 0) interval = setInterval(() => setTime(t => t - 1), 1000);
    else if (time === 0) setRunning(false);
    return () => clearInterval(interval);
  }, [running, time]);

  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Study Timer</Text>
      <Text style={styles.timer}>{format(time)}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btn} onPress={() => setRunning(!running)}>
          <Text style={styles.btnText}>{running ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => { setTime(600); setRunning(false); }}>
          <Text style={styles.btnText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 24, color: colors.white, fontWeight: 'bold', marginBottom: spacing.lg },
  timer: { fontSize: 64, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  buttons: { gap: spacing.md },
  btn: { backgroundColor: colors.secondary, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12, minWidth: 150, alignItems: 'center' },
  btnText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
