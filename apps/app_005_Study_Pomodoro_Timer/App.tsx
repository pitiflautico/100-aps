import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  return (
    <SafeAreaView style={[styles.container, mode === 'break' && styles.breakMode]}>
      <StatusBar style="light" />
      <Text style={styles.title}>Pomodoro Timer</Text>
      <Text style={styles.mode}>{mode === 'work' ? 'WORK TIME' : 'BREAK TIME'}</Text>
      <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => setIsRunning(!isRunning)}
        >
          <Text style={styles.buttonText}>{isRunning ? 'PAUSE' : 'START'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={reset}>
          <Text style={styles.buttonText}>RESET</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  breakMode: { backgroundColor: colors.status.success },
  title: { fontSize: 24, color: colors.white, fontWeight: 'bold', marginBottom: spacing.sm },
  mode: { fontSize: 18, color: colors.white, marginBottom: spacing.xl },
  timer: { fontSize: 72, color: colors.white, fontWeight: 'bold', marginBottom: spacing.xl },
  buttons: { gap: spacing.md },
  button: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: 12, minWidth: 200, alignItems: 'center' },
  primaryButton: { backgroundColor: colors.secondary },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.2)' },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
