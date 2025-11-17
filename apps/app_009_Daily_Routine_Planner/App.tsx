import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const ROUTINE = [
  { time: '06:00', task: 'Wake up' },
  { time: '07:00', task: 'Breakfast' },
  { time: '08:00', task: 'Work/Study' },
  { time: '12:00', task: 'Lunch' },
  { time: '17:00', task: 'Exercise' },
  { time: '19:00', task: 'Dinner' },
  { time: '22:00', task: 'Sleep' },
];

export default function App() {
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (time: string) => {
    const newSet = new Set(done);
    if (newSet.has(time)) newSet.delete(time);
    else newSet.add(time);
    setDone(newSet);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Daily Routine</Text>
      <ScrollView>
        {ROUTINE.map(item => (
          <TouchableOpacity
            key={item.time}
            style={[styles.item, done.has(item.time) && styles.itemDone]}
            onPress={() => toggle(item.time)}
          >
            <Text style={styles.time}>{item.time}</Text>
            <Text style={[styles.task, done.has(item.time) && styles.taskDone]}>{item.task}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  item: { flexDirection: 'row', backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  itemDone: { backgroundColor: colors.gray.light },
  time: { fontSize: 16, fontWeight: 'bold', color: colors.primary, width: 60 },
  task: { fontSize: 16, color: colors.text, flex: 1 },
  taskDone: { textDecorationLine: 'line-through', color: colors.gray.medium },
});
