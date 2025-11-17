import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function App() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [tasks] = useState({ 0: ['Meeting', 'Gym'], 1: ['Study'], 2: [] });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Weekly Planner</Text>
      <ScrollView horizontal style={styles.daysContainer}>
        {DAYS.map((day, i) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>{day}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.tasksContainer}>
        {(tasks[selectedDay] || []).length === 0 ? (
          <Text style={styles.empty}>No tasks for {DAYS[selectedDay]}</Text>
        ) : (
          (tasks[selectedDay] || []).map((task, i) => (
            <View key={i} style={styles.taskCard}>
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  daysContainer: { flexDirection: 'row', marginBottom: spacing.lg },
  dayBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.gray.light, borderRadius: 8, marginRight: spacing.sm },
  dayBtnActive: { backgroundColor: colors.primary },
  dayText: { fontSize: 16, color: colors.text },
  dayTextActive: { color: colors.white, fontWeight: 'bold' },
  tasksContainer: { flex: 1 },
  empty: { fontSize: 16, color: colors.gray.medium, textAlign: 'center', marginTop: spacing.xl },
  taskCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  taskText: { fontSize: 16, color: colors.text },
});
