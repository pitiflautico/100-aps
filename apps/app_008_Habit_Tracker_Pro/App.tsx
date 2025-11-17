import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const HABITS = ['Exercise', 'Read', 'Meditate', 'Drink Water', 'Sleep 8h'];

export default function App() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (habit: string) => {
    const newSet = new Set(checked);
    if (newSet.has(habit)) newSet.delete(habit);
    else newSet.add(habit);
    setChecked(newSet);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Habit Tracker</Text>
      <Text style={styles.subtitle}>Completed: {checked.size}/{HABITS.length}</Text>
      <FlatList
        data={HABITS}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.habit, checked.has(item) && styles.checked]}
            onPress={() => toggle(item)}
          >
            <Text style={[styles.habitText, checked.has(item) && styles.checkedText]}>
              {checked.has(item) ? '✓ ' : '○ '}{item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: 18, color: colors.text, marginBottom: spacing.lg },
  habit: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.md },
  checked: { backgroundColor: colors.status.success },
  habitText: { fontSize: 18, color: colors.text },
  checkedText: { color: colors.white, fontWeight: 'bold' },
});
